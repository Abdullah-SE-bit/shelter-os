from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from .models import (
	AdoptionListing,
	AdopterFavorite,
	AdoptionApplication,
	AdoptionQuestionnaire,
	AdoptionInterview,
	AdoptionRecord,
)
from .serializers import AdoptionListingSerializer, ApplicationSerializer, AdoptionRecordSerializer
from apps.core.permissions import IsShelterAdminOrSuperAdmin
from apps.core.responses import success_response, created_response, error_response, no_content_response


class BrowseListingsView(APIView):
	permission_classes = [AllowAny]

	def get(self, request):
		# Get all cats available for adoption (not just those with explicit listings)
		from apps.cats.models import Cat
		
		qs = Cat.objects.filter(
			is_deleted=False,
			current_status='IN_SHELTER',
			shelter__isnull=False  # Must be in a shelter
		).select_related('breed', 'shelter')

		# Apply filters
		gender = request.query_params.get('gender')
		if gender:
			qs = qs.filter(gender=gender)
		
		breed_id = request.query_params.get('breed_id')
		if breed_id:
			qs = qs.filter(breed_id=breed_id)
		
		shelter_id = request.query_params.get('shelter_id')
		if shelter_id:
			qs = qs.filter(shelter_id=shelter_id)
		
		age_min = request.query_params.get('age_min')
		if age_min:
			qs = qs.filter(age_years__gte=int(age_min))
		
		age_max = request.query_params.get('age_max')
		if age_max:
			qs = qs.filter(age_years__lte=int(age_max))

		# Pagination
		page = int(request.query_params.get('page', 1))
		page_size = int(request.query_params.get('page_size', 12))
		total = qs.count()
		cats = qs[(page - 1) * page_size: page * page_size]

		# Get or create listings for these cats. The cat's adoption_fee is the
		# source of truth, so a listing mirrors it (fixes fees showing as Free).
		results = []
		for cat in cats:
			listing = AdoptionListing.objects.filter(cat=cat, is_active=True).first()
			if not listing:
				listing = AdoptionListing.objects.create(
					cat=cat,
					shelter=cat.shelter,
					is_active=True,
					adoption_fee=cat.adoption_fee or 0,
				)
			elif listing.adoption_fee != (cat.adoption_fee or 0):
				listing.adoption_fee = cat.adoption_fee or 0
				listing.save(update_fields=['adoption_fee'])
			results.append(AdoptionListingSerializer(listing).data)

		return success_response({
			'results': results,
			'count': total,
			'page': page,
		})


class ListingDetailView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, cat_id):
		from apps.cats.models import Cat
		listing = AdoptionListing.objects.filter(cat_id=cat_id, is_active=True).first()
		if not listing:
			# Auto-create a listing for an in-shelter cat so the detail page works.
			cat = Cat.objects.filter(pk=cat_id, is_deleted=False, shelter__isnull=False).first()
			if not cat:
				return error_response('NOT_FOUND', 'No active listing for this cat', 404)
			listing = AdoptionListing.objects.create(
				cat=cat, shelter=cat.shelter, is_active=True, adoption_fee=cat.adoption_fee or 0)
		elif listing.adoption_fee != (listing.cat.adoption_fee or 0):
			# Keep the listing fee in sync with the cat (source of truth).
			listing.adoption_fee = listing.cat.adoption_fee or 0
			listing.save(update_fields=['adoption_fee'])
		listing.views_count += 1
		listing.save(update_fields=['views_count'])
		return success_response(AdoptionListingSerializer(listing).data)


class CreateListingView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request):
		from apps.shelters.models import Shelter

		cat_id = request.data.get('cat')
		if AdoptionListing.objects.filter(cat_id=cat_id, is_active=True).exists():
			return error_response('DUPLICATE_LISTING', 'Active listing already exists for this cat', 409)

		shelter = Shelter.objects.filter(admin=request.user).first()
		if not shelter and request.user.role != 'SUPER_ADMIN':
			return error_response('ACCESS_DENIED', 'Not a shelter admin', 403)

		listing = AdoptionListing.objects.create(
			cat_id=cat_id,
			shelter=shelter or Shelter.objects.get(pk=request.data.get('shelter')),
			adoption_fee=request.data.get('adoption_fee', 0),
			expires_at=request.data.get('expires_at'),
		)
		return created_response(AdoptionListingSerializer(listing).data)


class ListingUpdateView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def put(self, request, pk):
		try:
			listing = AdoptionListing.objects.get(pk=pk)
		except AdoptionListing.DoesNotExist:
			return error_response('NOT_FOUND', 'Listing not found', 404)

		if 'adoption_fee' in request.data:
			listing.adoption_fee = request.data['adoption_fee']
		if 'expires_at' in request.data:
			listing.expires_at = request.data['expires_at']
		if 'is_active' in request.data:
			listing.is_active = request.data['is_active']
		listing.save()
		return success_response(AdoptionListingSerializer(listing).data)

	def delete(self, request, pk):
		try:
			listing = AdoptionListing.objects.get(pk=pk)
			listing.is_active = False
			listing.save(update_fields=['is_active'])
			return no_content_response()
		except AdoptionListing.DoesNotExist:
			return error_response('NOT_FOUND', 'Listing not found', 404)


class FavoritesView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		favorites = AdopterFavorite.objects.filter(user=request.user).select_related('cat__breed')
		from apps.cats.serializers import CatSummarySerializer
		return success_response(CatSummarySerializer([favorite.cat for favorite in favorites], many=True).data)


class FavoriteToggleView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, cat_id):
		AdopterFavorite.objects.get_or_create(user=request.user, cat_id=cat_id)
		return success_response(message='Added to favorites')

	def delete(self, request, cat_id):
		AdopterFavorite.objects.filter(user=request.user, cat_id=cat_id).delete()
		return no_content_response()


class ApplicationListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		if request.user.role == 'SUPER_ADMIN':
			qs = AdoptionApplication.objects.all()
			shelter_id = request.query_params.get('shelter_id')
			if shelter_id:
				qs = qs.filter(shelter_id=shelter_id)
			status = request.query_params.get('status')
			if status:
				qs = qs.filter(status=status)
		elif request.user.role == 'SHELTER_ADMIN':
			from apps.shelters.models import Shelter
			shelter = Shelter.objects.filter(admin=request.user).first()
			if shelter:
				qs = AdoptionApplication.objects.filter(shelter=shelter)
			else:
				qs = AdoptionApplication.objects.none()
			status = request.query_params.get('status')
			if status:
				qs = qs.filter(status=status)
		else:
			qs = AdoptionApplication.objects.filter(applicant=request.user)

		qs = qs.order_by('-submitted_at')

		page = request.query_params.get('page')
		page_size = request.query_params.get('page_size', 15)
		if page:
			page = int(page)
			page_size = int(page_size)
			total = qs.count()
			qs = qs[(page - 1) * page_size: page * page_size]
			return success_response({
				'results': ApplicationSerializer(qs, many=True).data,
				'count': total,
				'page': page,
				'page_size': page_size
			})

		return success_response(ApplicationSerializer(qs, many=True).data)

	def post(self, request):
		cat_id = request.data.get('cat')
		if AdoptionApplication.objects.filter(
			cat_id=cat_id,
			applicant=request.user,
			status__in=['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'],
		).exists():
			return error_response(
				'APPLICATION_ALREADY_EXISTS',
				'You already have an active application for this cat',
				409,
			)

		listing = AdoptionListing.objects.filter(cat_id=cat_id, is_active=True).first()
		if not listing:
			return error_response('LISTING_NOT_FOUND', 'No active adoption listing for this cat', 400)

		# Emergency contact: optional name + (if provided) a valid PK mobile.
		ec_name = (request.data.get('emergency_contact_name') or '').strip()
		ec_phone = (request.data.get('emergency_contact_phone') or '').strip()
		if ec_phone:
			from apps.core.phone import normalize_pk_mobile
			try:
				ec_phone = normalize_pk_mobile(ec_phone)
			except ValueError as exc:
				return error_response('VALIDATION_FAILED', 'Validation error', 400,
									   {'emergency_contact_phone': [str(exc)]})

		app = AdoptionApplication.objects.create(
			cat_id=cat_id,
			applicant=request.user,
			shelter=listing.shelter,
			status='SUBMITTED',
		)
		AdoptionQuestionnaire.objects.create(
			application=app,
			living_type=request.data.get('living_type', 'APARTMENT'),
			has_garden=request.data.get('has_garden', False),
			other_pets=request.data.get('other_pets', False),
			children_in_house=request.data.get('children_in_house', False),
			work_hours_away=int(request.data.get('work_hours_away', 8)),
			previous_pet_experience=request.data.get('previous_pet_experience', ''),
			financial_readiness_confirmed=request.data.get('financial_readiness_confirmed', False),
			references=request.data.get('references', []),
			emergency_contact_name=ec_name,
			emergency_contact_phone=ec_phone,
		)

		from apps.notifications.tasks import send_notification
		if listing.shelter.admin:
			send_notification.delay(
				user_id=str(listing.shelter.admin.id),
				title='New adoption application',
				body=f"New application for {listing.cat.name or 'a cat'}",
				category='ADOPTION',
			)
		return created_response(ApplicationSerializer(app).data)


class MyApplicationsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		applications = AdoptionApplication.objects.filter(applicant=request.user).order_by('-submitted_at')
		return success_response(ApplicationSerializer(applications, many=True).data)


class ApplicationDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, pk):
		try:
			app = AdoptionApplication.objects.get(pk=pk)
			if app.applicant != request.user and request.user.role not in ['SHELTER_ADMIN', 'SUPER_ADMIN']:
				return error_response('ACCESS_DENIED', 'Not authorised', 403)
			return success_response(ApplicationSerializer(app).data)
		except AdoptionApplication.DoesNotExist:
			return error_response('NOT_FOUND', 'Application not found', 404)


class MoveToReviewView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def put(self, request, pk):
		try:
			app = AdoptionApplication.objects.get(pk=pk)
		except AdoptionApplication.DoesNotExist:
			return error_response('NOT_FOUND', 'Application not found', 404)

		target_status = request.data.get('status')
		if not target_status:
			return error_response('MISSING_STATUS', 'Status is required', 400)

		from apps.notifications.tasks import send_notification

		if target_status == 'UNDER_REVIEW':
			app.status = 'UNDER_REVIEW'
			app.reviewed_by = request.user
			app.save(update_fields=['status', 'reviewed_by', 'updated_at'])
			send_notification.delay(
				str(app.applicant.id),
				'Application under review',
				'Your adoption application is being reviewed.',
				'ADOPTION',
			)
			return success_response(ApplicationSerializer(app).data)

		elif target_status == 'INTERVIEW':
			scheduled_at = request.data.get('interview_scheduled_at') or timezone.now()
			interview = AdoptionInterview.objects.create(
				application=app,
				scheduled_at=scheduled_at,
				outcome='PENDING',
				conducted_by=request.user
			)
			app.status = 'INTERVIEW_SCHEDULED'
			app.save(update_fields=['status', 'updated_at'])
			send_notification.delay(
				str(app.applicant.id),
				'Interview scheduled',
				'Your interview has been scheduled.',
				'ADOPTION'
			)
			return success_response(ApplicationSerializer(app).data)

		elif target_status == 'APPROVED':
			if AdoptionRecord.objects.filter(cat=app.cat).exists():
				return error_response('ALREADY_ADOPTED', 'This cat has already been adopted', 409)

			from django.db import transaction
			with transaction.atomic():
				record = AdoptionRecord.objects.create(
					cat=app.cat,
					adopter=app.applicant,
					shelter=app.shelter,
					application=app,
					adoption_fee_paid=0,
				)
				cat = app.cat
				cat.current_status = 'ADOPTED'
				cat.owner = app.applicant
				cat.save(update_fields=['current_status', 'owner', 'updated_at'])

				AdoptionListing.objects.filter(cat=app.cat).update(is_active=False)
				AdoptionApplication.objects.filter(
					cat=app.cat,
					status__in=['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'],
				).exclude(pk=pk).update(status='REJECTED')

				app.status = 'APPROVED'
				app.save(update_fields=['status', 'updated_at'])

			send_notification.delay(
				str(app.applicant.id),
				'Adoption approved',
				f"Your application for {cat.name or 'a cat'} has been approved!",
				'ADOPTION',
			)
			return success_response(ApplicationSerializer(app).data)

		elif target_status == 'REJECTED':
			app.status = 'REJECTED'
			app.rejection_reason = request.data.get('rejection_reason', '')
			app.reviewed_by = request.user
			app.save(update_fields=['status', 'rejection_reason', 'reviewed_by', 'updated_at'])
			send_notification.delay(
				str(app.applicant.id),
				'Application update',
				'Your adoption application status has been updated.',
				'ADOPTION',
			)
			return success_response(ApplicationSerializer(app).data)

		else:
			return error_response('INVALID_STATUS', f'Invalid status transition to {target_status}', 400)


class ScheduleInterviewView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request, pk):
		try:
			app = AdoptionApplication.objects.get(pk=pk)
		except AdoptionApplication.DoesNotExist:
			return error_response('NOT_FOUND', 'Application not found', 404)

		interview = AdoptionInterview.objects.create(
			application=app,
			scheduled_at=request.data.get('scheduled_at'),
			outcome='PENDING',
		)
		app.status = 'INTERVIEW_SCHEDULED'
		app.save(update_fields=['status', 'updated_at'])

		from apps.notifications.tasks import send_notification
		send_notification.delay(str(app.applicant.id), 'Interview scheduled', 'Your interview is scheduled.', 'ADOPTION')
		return created_response({'interview_id': str(interview.id), 'scheduled_at': str(interview.scheduled_at)})


class RecordInterviewOutcomeView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def put(self, request, pk):
		try:
			interview = AdoptionInterview.objects.get(pk=pk)
		except AdoptionInterview.DoesNotExist:
			return error_response('NOT_FOUND', 'Interview not found', 404)

		outcome = request.data.get('outcome', 'PENDING')
		interview.outcome = outcome
		interview.notes = request.data.get('notes', '')
		interview.conducted_by = request.user
		interview.save()

		app = interview.application
		if outcome == 'FAIL':
			app.status = 'REJECTED'
			from apps.notifications.tasks import send_notification
			send_notification.delay(
				str(app.applicant.id),
				'Application not successful',
				'Unfortunately your application was not approved.',
				'ADOPTION',
			)
		elif outcome == 'PASS':
			app.status = 'UNDER_REVIEW'
		app.save(update_fields=['status', 'updated_at'])
		return success_response({'outcome': outcome, 'application_status': app.status})


class ApproveApplicationView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request, pk):
		try:
			app = AdoptionApplication.objects.get(pk=pk)
		except AdoptionApplication.DoesNotExist:
			return error_response('NOT_FOUND', 'Application not found', 404)

		if AdoptionRecord.objects.filter(cat=app.cat).exists():
			return error_response('ALREADY_ADOPTED', 'This cat has already been adopted', 409)

		record = AdoptionRecord.objects.create(
			cat=app.cat,
			adopter=app.applicant,
			shelter=app.shelter,
			application=app,
			adoption_fee_paid=request.data.get('adoption_fee_paid', 0),
		)

		cat = app.cat
		cat.current_status = 'ADOPTED'
		cat.owner = app.applicant
		cat.save(update_fields=['current_status', 'owner', 'updated_at'])

		AdoptionListing.objects.filter(cat=app.cat).update(is_active=False)
		AdoptionApplication.objects.filter(
			cat=app.cat,
			status__in=['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'],
		).exclude(pk=pk).update(status='REJECTED')

		app.status = 'APPROVED'
		app.save(update_fields=['status', 'updated_at'])

		from apps.notifications.tasks import send_notification
		send_notification.delay(
			str(app.applicant.id),
			'Adoption approved',
			f"Your application for {cat.name or 'a cat'} has been approved!",
			'ADOPTION',
		)
		return success_response(AdoptionRecordSerializer(record).data)


class RejectApplicationView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request, pk):
		try:
			app = AdoptionApplication.objects.get(pk=pk)
		except AdoptionApplication.DoesNotExist:
			return error_response('NOT_FOUND', 'Application not found', 404)

		app.status = 'REJECTED'
		app.rejection_reason = request.data.get('rejection_reason', '')
		app.reviewed_by = request.user
		app.save(update_fields=['status', 'rejection_reason', 'reviewed_by', 'updated_at'])

		from apps.notifications.tasks import send_notification
		send_notification.delay(
			str(app.applicant.id),
			'Application update',
			'Your adoption application status has been updated.',
			'ADOPTION',
		)
		return success_response(ApplicationSerializer(app).data)


class WithdrawApplicationView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, pk):
		try:
			app = AdoptionApplication.objects.get(pk=pk, applicant=request.user)
		except AdoptionApplication.DoesNotExist:
			return error_response('NOT_FOUND', 'Application not found', 404)

		if app.status in ['APPROVED', 'REJECTED', 'WITHDRAWN']:
			return error_response('CANNOT_WITHDRAW', 'Application cannot be withdrawn in its current state', 400)

		app.status = 'WITHDRAWN'
		app.save(update_fields=['status', 'updated_at'])
		return success_response(ApplicationSerializer(app).data)
