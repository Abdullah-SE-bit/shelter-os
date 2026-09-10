import math
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView

from .models import LostCatAlert, FoundCatReport, MatchResult
from .serializers import LostCatAlertSerializer, FoundCatReportSerializer, MatchResultSerializer
from .tasks import match_found_report, match_lost_alert, _compute_score, _upsert_match
from apps.core.responses import success_response, created_response, error_response
from apps.core.permissions import IsShelterAdminOrSuperAdmin


def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def _geo_filter(items, request, lat_attr, lng_attr):
    """Optional distance filter (lat/lng/radius_km) applied in Python."""
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    radius = request.query_params.get('radius_km')
    if not (lat and lng and radius):
        return items
    try:
        latf, lngf, radf = float(lat), float(lng), float(radius)
    except (TypeError, ValueError):
        return items
    return [
        it for it in items
        if getattr(it, lat_attr) is not None and getattr(it, lng_attr) is not None
        and _haversine_km(latf, lngf, getattr(it, lat_attr), getattr(it, lng_attr)) <= radf
    ]


def _save_photos(request, files, subdir):
    urls = []
    for f in files:
        try:
            path = default_storage.save(f'{subdir}/{f.name}', f)
            urls.append(request.build_absolute_uri(default_storage.url(path)))
        except Exception:
            continue
    return urls


# ─────────────────────────── Lost cat alerts ───────────────────────────

class LostAlertListCreateView(APIView):
	parser_classes = [MultiPartParser, FormParser, JSONParser]

	def get_permissions(self):
		return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

	def get(self, request):
		qs = LostCatAlert.objects.filter(is_deleted=False).select_related(
			'reporter__profile', 'cat').order_by('-created_at')
		status_param = (request.query_params.get('status') or 'ACTIVE').upper()
		if status_param != 'ALL':
			qs = qs.filter(status=status_param)
		q = request.query_params.get('q') or request.query_params.get('search')
		if q:
			qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q) | Q(cat__name__icontains=q))
		breed = request.query_params.get('breed')
		if breed:
			qs = qs.filter(cat__breed_id=breed)

		items = _geo_filter(list(qs), request, 'last_seen_latitude', 'last_seen_longitude')
		page = int(request.query_params.get('page', 1))
		page_size = int(request.query_params.get('page_size', 12))
		total = len(items)
		return success_response({
			'results': LostCatAlertSerializer(items[(page - 1) * page_size: page * page_size], many=True).data,
			'count': total,
		})

	def post(self, request):
		"""Report a lost cat. A Cat record (status LOST) is created/linked, then
		the matching engine runs synchronously against open found reports."""
		cat_id = request.data.get('cat')
		cat_instance = None

		if cat_id:
			existing = LostCatAlert.objects.filter(cat_id=cat_id, status='ACTIVE', is_deleted=False).first()
			if existing:
				return error_response('LOST_ALERT_ALREADY_EXISTS',
									   'An active lost alert already exists for this cat', 409)
		else:
			from apps.cats.models import Cat
			from apps.core.models import LookupValue
			# Optional breed selected from the BREED dropdown (a LookupValue id).
			breed_id = request.data.get('breed') or None
			if breed_id and not LookupValue.objects.filter(pk=breed_id).exists():
				breed_id = None
			cat_instance = Cat.objects.create(
				name=request.data.get('cat_name') or request.data.get('title') or 'Unknown',
				current_status='LOST',
				breed_id=breed_id,
				color=request.data.get('color', ''),
				behavioral_notes=request.data.get('description', ''),
				created_by=request.user,
				owner=request.user,   # the reporter is the owner of their lost cat
				shelter=None,
			)
			cat_id = cat_instance.id

		serializer = LostCatAlertSerializer(data=request.data)
		if not serializer.is_valid():
			if cat_instance:
				cat_instance.delete()
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)

		alert = serializer.save(reporter=request.user, cat_id=cat_id)

		photos = request.FILES.getlist('photos')
		if photos:
			alert.photos = _save_photos(request, photos, f'lost_alerts/{alert.id}')
			alert.save(update_fields=['photos'])

		if not cat_instance:
			from apps.cats.models import Cat
			Cat.objects.filter(pk=cat_id).update(current_status='LOST')

		# Run matching now (synchronous) so the reporter sees candidates immediately.
		match_lost_alert(alert)

		return created_response(LostCatAlertSerializer(alert).data)


class LostAlertDetailView(APIView):
	def get_permissions(self):
		return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

	def _get(self, pk):
		try:
			return LostCatAlert.objects.get(pk=pk, is_deleted=False)
		except LostCatAlert.DoesNotExist:
			return None

	def get(self, request, pk):
		alert = self._get(pk)
		if not alert:
			return error_response('NOT_FOUND', 'Alert not found', 404)
		return success_response(LostCatAlertSerializer(alert).data)

	def put(self, request, pk):
		alert = self._get(pk)
		if not alert:
			return error_response('NOT_FOUND', 'Alert not found', 404)
		if alert.status != 'ACTIVE':
			return error_response('ALERT_NOT_EDITABLE', 'Only active alerts can be edited', 400)
		if alert.reporter != request.user and request.user.role not in ['SHELTER_ADMIN', 'SUPER_ADMIN']:
			return error_response('ACCESS_DENIED', 'Not your alert', 403)
		serializer = LostCatAlertSerializer(alert, data=request.data, partial=True)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		serializer.save()
		match_lost_alert(alert)
		return success_response(LostCatAlertSerializer(alert).data)


class ResolveLostAlertView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, pk):
		try:
			alert = LostCatAlert.objects.get(pk=pk, is_deleted=False)
		except LostCatAlert.DoesNotExist:
			return error_response('NOT_FOUND', 'Alert not found', 404)
		if alert.reporter != request.user and request.user.role not in ['SHELTER_ADMIN', 'SUPER_ADMIN']:
			return error_response('ACCESS_DENIED', 'Not authorised', 403)
		alert.status = 'RESOLVED'
		alert.resolved_at = timezone.now()
		alert.save(update_fields=['status', 'resolved_at', 'updated_at'])
		MatchResult.objects.filter(lost_alert=alert, status='PENDING').update(status='CLOSED')
		return success_response(LostCatAlertSerializer(alert).data)


# ─────────────────────────── Found cat reports ───────────────────────────

class FoundReportListCreateView(APIView):
	parser_classes = [MultiPartParser, FormParser, JSONParser]

	def get_permissions(self):
		return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

	def get(self, request):
		qs = FoundCatReport.objects.filter(is_deleted=False).select_related(
			'reporter__profile', 'shelter').order_by('-created_at')
		status_param = (request.query_params.get('status') or 'OPEN').upper()
		if status_param != 'ALL':
			qs = qs.filter(status=status_param)
		q = request.query_params.get('q') or request.query_params.get('search')
		if q:
			qs = qs.filter(Q(description__icontains=q) | Q(breed_guess__icontains=q))
		mine = request.query_params.get('mine')
		if mine and request.user.is_authenticated:
			qs = qs.filter(reporter=request.user)
		items = _geo_filter(list(qs), request, 'found_latitude', 'found_longitude')
		page = int(request.query_params.get('page', 1))
		page_size = int(request.query_params.get('page_size', 12))
		total = len(items)
		return success_response({
			'results': FoundCatReportSerializer(items[(page - 1) * page_size: page * page_size], many=True).data,
			'count': total,
		})

	def post(self, request):
		"""Report a found cat. Optionally the finder can flag a specific lost
		alert they think it matches; either way the matching engine runs."""
		data = {
			'description': request.data.get('description', ''),
			'breed_guess': request.data.get('breed_guess', ''),
			'contact_phone': request.data.get('contact_phone', ''),
			'contact_email': request.data.get('contact_email', ''),
		}
		for f in ('found_latitude', 'found_longitude'):
			v = request.data.get(f)
			if v not in (None, ''):
				data[f] = v
		if request.data.get('found_at'):
			data['found_at'] = request.data.get('found_at')
		color = request.data.get('color')
		if color:
			data['color'] = color

		serializer = FoundCatReportSerializer(data=data)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		report = serializer.save(reporter=request.user)

		photos = request.FILES.getlist('photos')
		if photos:
			report.photos = _save_photos(request, photos, f'found_reports/{report.id}')
			report.save(update_fields=['photos'])

		# Auto-match against active lost alerts.
		created = match_found_report(report)

		# The finder may explicitly link a lost alert they suspect is the owner.
		lost_id = request.data.get('possible_lost_alert') or request.data.get('lost_alert')
		if lost_id:
			alert = LostCatAlert.objects.filter(pk=lost_id, status='ACTIVE', is_deleted=False).first()
			if alert:
				score = _compute_score(alert, report)
				_upsert_match(alert, report, max(score, 0.5))

		out = FoundCatReportSerializer(report).data
		out['match_count'] = MatchResult.objects.filter(found_report=report, status='PENDING').count()
		return created_response(out)


class FoundReportDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, pk):
		try:
			report = FoundCatReport.objects.get(pk=pk, is_deleted=False)
		except FoundCatReport.DoesNotExist:
			return error_response('NOT_FOUND', 'Found report not found', 404)
		return success_response(FoundCatReportSerializer(report).data)


class FoundReportMatchesView(APIView):
	"""Candidate lost-cat matches for a found report — the 'compare the details'
	step when someone finds a cat."""
	permission_classes = [IsAuthenticated]

	def get(self, request, pk):
		try:
			report = FoundCatReport.objects.get(pk=pk, is_deleted=False)
		except FoundCatReport.DoesNotExist:
			return error_response('NOT_FOUND', 'Found report not found', 404)
		# Compute on demand so results are always fresh / never empty by accident.
		match_found_report(report)
		matches = MatchResult.objects.filter(
			found_report=report, status__in=['PENDING', 'CONFIRMED'],
		).select_related('lost_alert__reporter__profile', 'lost_alert__cat').order_by('-score')
		return success_response(MatchResultSerializer(matches, many=True).data)


class LinkFoundToLostView(APIView):
	"""Finder explicitly links a found report to a lost alert they believe is
	the owner. Creates a match (bypassing the auto threshold)."""
	permission_classes = [IsAuthenticated]

	def post(self, request, pk):
		try:
			report = FoundCatReport.objects.get(pk=pk, is_deleted=False)
		except FoundCatReport.DoesNotExist:
			return error_response('NOT_FOUND', 'Found report not found', 404)
		lost_id = request.data.get('lost_alert') or request.data.get('lost_alert_id')
		alert = LostCatAlert.objects.filter(pk=lost_id, status='ACTIVE', is_deleted=False).first()
		if not alert:
			return error_response('NOT_FOUND', 'Lost alert not found or not active', 404)
		score = _compute_score(alert, report)
		match, _created = _upsert_match(alert, report, max(score, 0.5))
		return created_response(MatchResultSerializer(match).data)


class FoundReportIntakeView(APIView):
	"""A shelter takes a found cat in — creates a Cat in the shelter and closes
	the found report. Unclaimed found cats end up cared for by a shelter."""
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request, pk):
		try:
			report = FoundCatReport.objects.get(pk=pk, is_deleted=False)
		except FoundCatReport.DoesNotExist:
			return error_response('NOT_FOUND', 'Found report not found', 404)
		if report.status in ('SHELTERED', 'REUNITED', 'CLOSED'):
			return error_response('ALREADY_RESOLVED', 'This found report has already been resolved', 400)

		from apps.shelters.models import Shelter
		if request.user.role == 'SHELTER_ADMIN':
			shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
			if not shelter:
				return error_response('ACCESS_DENIED', 'You are not assigned to a shelter', 403)
		else:  # SUPER_ADMIN
			shelter_id = request.data.get('shelter') or request.data.get('shelter_id')
			shelter = (Shelter.objects.filter(pk=shelter_id, is_deleted=False).first() if shelter_id
					   else Shelter.objects.filter(is_deleted=False, is_active=True).first())
			if not shelter:
				return error_response('NO_SHELTER', 'No shelter available for intake', 400)

		from apps.cats.models import Cat
		with transaction.atomic():
			cat = Cat.objects.create(
				name=request.data.get('name') or 'Found cat',
				current_status='IN_SHELTER',
				shelter=shelter,
				color=(report.color_tags[0] if report.color_tags else ''),
				behavioral_notes=report.description or '',
				primary_photo_url=(report.photos[0] if report.photos else ''),
				created_by=request.user,
			)
			report.status = 'SHELTERED'
			report.shelter = shelter
			report.resolved_cat = cat
			report.save(update_fields=['status', 'shelter', 'resolved_cat'])
			MatchResult.objects.filter(found_report=report, status='PENDING').update(status='CLOSED')

		return success_response({
			'found_report': FoundCatReportSerializer(report).data,
			'cat_id': str(cat.id),
		})


# ─────────────────────────── Matches ───────────────────────────

class MatchListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, lost_id):
		matches = MatchResult.objects.filter(
			lost_alert_id=lost_id,
			status__in=['PENDING', 'CONFIRMED'],
		).select_related('found_report__reporter__profile').order_by('-score')
		return success_response(MatchResultSerializer(matches, many=True).data)


class ConfirmMatchView(APIView):
	"""Confirm a match → reunite the lost cat with the reporter who lost it.
	Either the lost reporter, the finder, or an admin may confirm."""
	permission_classes = [IsAuthenticated]

	def post(self, request, match_id):
		try:
			match = MatchResult.objects.select_related('lost_alert', 'found_report').get(
				pk=match_id, status='PENDING')
		except MatchResult.DoesNotExist:
			return error_response('NOT_FOUND', 'Match not found or already processed', 404)

		alert = match.lost_alert
		report = match.found_report
		allowed = (
			alert.reporter_id == request.user.id
			or report.reporter_id == request.user.id
			or request.user.role in ['SHELTER_ADMIN', 'SUPER_ADMIN']
		)
		if not allowed:
			return error_response('ACCESS_DENIED', 'You cannot confirm this match', 403)

		with transaction.atomic():
			match.status = 'CONFIRMED'
			match.confirmed_by = request.user
			match.save(update_fields=['status', 'confirmed_by'])

			report.status = 'REUNITED'

			alert.status = 'RESOLVED'
			alert.resolved_at = timezone.now()
			alert.save(update_fields=['status', 'resolved_at', 'updated_at'])

			# Return the cat to the person who reported it lost.
			if alert.cat:
				cat = alert.cat
				cat.owner = alert.reporter
				cat.current_status = 'OWNED'
				cat.save(update_fields=['owner', 'current_status', 'updated_at'])
				report.resolved_cat = cat

			report.save(update_fields=['status', 'resolved_cat'])

			# Close every other pending match tied to either side.
			MatchResult.objects.filter(
				Q(lost_alert=alert) | Q(found_report=report), status='PENDING',
			).exclude(pk=match.id).update(status='CLOSED')

		from apps.notifications.tasks import send_notification
		try:
			send_notification.delay(
				user_id=str(report.reporter_id),
				title='Found cat reunited 🎉',
				body='The cat you found has been matched to its owner. Thank you!',
				category='RESCUE',
			)
			send_notification.delay(
				user_id=str(alert.reporter_id),
				title='Your cat has been found 🎉',
				body='A found-cat report was confirmed as your lost cat.',
				category='RESCUE',
			)
		except Exception:
			pass

		return success_response(MatchResultSerializer(match).data)


class RejectMatchView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, match_id):
		try:
			match = MatchResult.objects.select_related('lost_alert', 'found_report').get(
				pk=match_id, status='PENDING')
		except MatchResult.DoesNotExist:
			return error_response('NOT_FOUND', 'Match not found', 404)
		if (match.lost_alert.reporter_id != request.user.id
				and match.found_report.reporter_id != request.user.id
				and request.user.role not in ['SHELTER_ADMIN', 'SUPER_ADMIN']):
			return error_response('ACCESS_DENIED', 'You cannot reject this match', 403)
		match.status = 'REJECTED'
		match.save(update_fields=['status'])
		return success_response(MatchResultSerializer(match).data)
