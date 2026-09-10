import datetime
from django.db.models import Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import WeightLog, NutritionPlan, Appointment, HealthAlert, FeedingLog
from .serializers import WeightLogSerializer, NutritionPlanSerializer, AppointmentSerializer, HealthAlertSerializer
from apps.core.responses import success_response, created_response, error_response


class WeightLogView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		qs = WeightLog.objects.filter(cat_id=cat_id).order_by('recorded_at')
		return success_response(WeightLogSerializer(qs, many=True).data)

	def post(self, request, cat_id):
		weight = request.data.get('weight_kg')
		if not weight:
			return error_response('VALIDATION_FAILED', 'weight_kg is required', 400)
		log = WeightLog.objects.create(
			cat_id=cat_id,
			weight_kg=float(weight),
			recorded_by=request.user,
			notes=request.data.get('notes', ''),
		)
		from .tasks import check_weight_concern
		check_weight_concern.delay(str(cat_id))
		return created_response(WeightLogSerializer(log).data)


class WeightChartView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		period_map = {'1m': 30, '3m': 90, '6m': 180, '1y': 365}
		days = period_map.get(request.query_params.get('period', '3m'), 90)
		since = timezone.now() - datetime.timedelta(days=days)
		logs = WeightLog.objects.filter(cat_id=cat_id, recorded_at__gte=since).order_by('recorded_at')
		points = [{'date': l.recorded_at.strftime('%Y-%m-%d'), 'weight': float(l.weight_kg)} for l in logs]

		trend = 'STABLE'
		if len(points) >= 2:
			diff = points[-1]['weight'] - points[0]['weight']
			if diff > 0.2:
				trend = 'GAINING'
			elif diff < -0.2:
				trend = 'LOSING'

		return success_response({'points': points, 'trend': trend})


class NutritionPlanView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		plan = NutritionPlan.objects.filter(cat_id=cat_id, is_active=True).first()
		return success_response(NutritionPlanSerializer(plan).data if plan else None)

	def post(self, request, cat_id):
		NutritionPlan.objects.filter(cat_id=cat_id, is_active=True).update(is_active=False)
		plan = NutritionPlan.objects.create(
			cat_id=cat_id,
			food_brand=request.data.get('food_brand', ''),
			daily_amount_grams=int(request.data.get('daily_amount_grams', 0)),
			feeding_frequency=request.data.get('feeding_frequency', 'TWICE'),
			created_by=request.user,
		)
		return created_response(NutritionPlanSerializer(plan).data)


class FeedingLogView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, cat_id):
		log = FeedingLog.objects.create(
			cat_id=cat_id,
			amount_grams=int(request.data.get('amount_grams', 0)),
			fed_by=request.user,
			food_type=request.data.get('food_type', ''),
		)
		return created_response({'id': str(log.id), 'fed_at': str(log.fed_at)})


class AppointmentListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		qs = Appointment.objects.filter(is_deleted=False)
		if request.user.role == 'VET':
			qs = qs.filter(vet=request.user)
		elif request.user.role == 'CAT_OWNER':
			qs = qs.filter(owner=request.user)
		qs = qs.order_by('scheduled_at')
		return success_response(AppointmentSerializer(qs, many=True).data)

	def post(self, request):
		from apps.accounts.models import User

		cat_id = request.data.get('cat')
		vet_id = request.data.get('vet')
		try:
			vet = User.objects.get(pk=vet_id, role='VET')
		except User.DoesNotExist:
			return error_response('NOT_FOUND', 'Vet not found', 404)

		# Cat owners, shelter admins and volunteers can all request appointments;
		# the requester is recorded as the appointment's owner/booker.
		booking_roles = ('CAT_OWNER', 'SHELTER_ADMIN', 'VOLUNTEER', 'ADOPTER')
		appt = Appointment.objects.create(
			cat_id=cat_id,
			vet=vet,
			owner=request.user if request.user.role in booking_roles else None,
			appointment_type=request.data.get('appointment_type', 'CHECKUP'),
			scheduled_at=request.data.get('scheduled_at'),
			duration_minutes=int(request.data.get('duration_minutes', 30)),
			notes=request.data.get('notes', ''),
		)

		from apps.notifications.tasks import send_notification
		send_notification.delay(
			str(vet.id),
			'New appointment request',
			'You have a new appointment request.',
			'MEDICAL',
		)
		return created_response(AppointmentSerializer(appt).data)


class MyAppointmentsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		qs = Appointment.objects.filter(
			Q(vet=request.user) | Q(owner=request.user),
			is_deleted=False,
			scheduled_at__gte=timezone.now(),
		).order_by('scheduled_at')
		return success_response(AppointmentSerializer(qs, many=True).data)


class AppointmentDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			appt = Appointment.objects.get(pk=pk, is_deleted=False)
		except Appointment.DoesNotExist:
			return error_response('NOT_FOUND', 'Appointment not found', 404)
		if 'scheduled_at' in request.data:
			appt.scheduled_at = request.data['scheduled_at']
			appt.status = 'SCHEDULED'
		appt.save()
		return success_response(AppointmentSerializer(appt).data)


class ConfirmAppointmentView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			appt = Appointment.objects.get(pk=pk, vet=request.user)
			appt.status = 'CONFIRMED'
			appt.save(update_fields=['status'])
			return success_response(AppointmentSerializer(appt).data)
		except Appointment.DoesNotExist:
			return error_response('NOT_FOUND', 'Appointment not found', 404)


class CompleteAppointmentView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			appt = Appointment.objects.get(pk=pk, vet=request.user)
			appt.status = 'COMPLETED'
			appt.outcome_summary = request.data.get('outcome_summary', '')
			appt.save(update_fields=['status', 'outcome_summary', 'updated_at'])
			return success_response(AppointmentSerializer(appt).data)
		except Appointment.DoesNotExist:
			return error_response('NOT_FOUND', 'Appointment not found', 404)


class CancelAppointmentView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			appt = Appointment.objects.get(pk=pk, is_deleted=False)
			appt.status = 'CANCELLED'
			appt.cancellation_reason = request.data.get('cancellation_reason', '')
			appt.save(update_fields=['status', 'cancellation_reason', 'updated_at'])
			return success_response(AppointmentSerializer(appt).data)
		except Appointment.DoesNotExist:
			return error_response('NOT_FOUND', 'Appointment not found', 404)


class CatAppointmentsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		qs = Appointment.objects.filter(cat_id=cat_id, is_deleted=False).order_by('-scheduled_at')
		return success_response(AppointmentSerializer(qs, many=True).data)


class VetScheduleView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		date_str = request.query_params.get('date')
		try:
			date = datetime.date.fromisoformat(date_str)
		except (TypeError, ValueError):
			date = timezone.now().date()
		qs = Appointment.objects.filter(
			vet=request.user,
			scheduled_at__date=date,
			is_deleted=False,
		).order_by('scheduled_at')
		return success_response(AppointmentSerializer(qs, many=True).data)


class CatAlertsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		qs = HealthAlert.objects.filter(cat_id=cat_id)
		if request.query_params.get('resolved', 'false') == 'false':
			qs = qs.filter(is_resolved=False)
		return success_response(HealthAlertSerializer(qs.order_by('-triggered_at'), many=True).data)


class MyAlertsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		from apps.cats.models import Cat

		cat_ids = Cat.objects.filter(owner=request.user, is_deleted=False).values_list('id', flat=True)
		qs = HealthAlert.objects.filter(cat_id__in=cat_ids, is_resolved=False)
		return success_response(HealthAlertSerializer(qs, many=True).data)


class ShelterAlertsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, shelter_id):
		from apps.cats.models import Cat

		cat_ids = Cat.objects.filter(shelter_id=shelter_id, is_deleted=False).values_list('id', flat=True)
		qs = HealthAlert.objects.filter(cat_id__in=cat_ids, is_resolved=False)
		return success_response(HealthAlertSerializer(qs, many=True).data)


class ResolveAlertView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			alert = HealthAlert.objects.get(pk=pk, is_resolved=False)
			alert.is_resolved = True
			alert.resolved_at = timezone.now()
			alert.resolved_by = request.user
			alert.save(update_fields=['is_resolved', 'resolved_at', 'resolved_by'])
			return success_response(HealthAlertSerializer(alert).data)
		except HealthAlert.DoesNotExist:
			return error_response('NOT_FOUND', 'Alert not found or already resolved', 404)


class VetAlertsView(APIView):
	"""Get all health alerts for VET role - shows alerts for all cats in the system"""
	permission_classes = [IsAuthenticated]

	def get(self, request):
		if request.user.role != 'VET':
			return error_response('ACCESS_DENIED', 'Only vets can access this endpoint', 403)
		
		# Get all unresolved alerts (vets can see all)
		qs = HealthAlert.objects.filter(is_resolved=False).select_related('cat', 'cat__owner', 'cat__shelter')
		
		# Optional filters
		alert_type = request.query_params.get('type')
		if alert_type:
			qs = qs.filter(alert_type=alert_type)
		
		severity = request.query_params.get('severity')
		if severity:
			qs = qs.filter(severity=severity)
		
		# Order by severity (critical first) then by date
		severity_order = {'CRITICAL': 1, 'WARNING': 2, 'INFO': 3}
		alerts = sorted(
			qs.order_by('-triggered_at'),
			key=lambda x: (severity_order.get(x.severity, 4), -x.triggered_at.timestamp())
		)
		
		return success_response(HealthAlertSerializer(alerts, many=True).data)
