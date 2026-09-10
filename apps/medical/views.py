from django.db.models import Q
from django.utils import timezone
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import MedicalRecord, Allergy, Vaccination, Prescription, DoseLog
from .serializers import (
	MedicalRecordSerializer,
	AllergySerializer,
	VaccinationSerializer,
	PrescriptionSerializer,
	DoseLogSerializer,
)
from apps.core.responses import success_response, created_response, error_response, no_content_response


NOT_PATIENT_MSG = 'You can only treat cats that have an appointment booked with you.'


def _vet_can_treat(user, cat_id):
	"""Option (b): a vet may only add/update medical data for cats that have an
	appointment booked with them. Non-vet roles are governed by their own checks."""
	if getattr(user, 'role', None) != 'VET':
		return True
	from apps.wellness.models import Appointment
	return Appointment.objects.filter(vet=user, cat_id=cat_id, is_deleted=False).exists()


class MedicalRecordListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		qs = MedicalRecord.objects.filter(cat_id=cat_id, is_deleted=False).order_by('-created_at')
		return success_response(MedicalRecordSerializer(qs, many=True).data)

	def post(self, request, cat_id):
		if request.user.role not in ['VET', 'SHELTER_ADMIN', 'SUPER_ADMIN']:
			return error_response('ACCESS_DENIED', 'Insufficient permissions', 403)
		# A lost or deceased cat isn't in anyone's care, so no new records.
		from apps.cats.models import Cat
		try:
			cat = Cat.objects.get(pk=cat_id, is_deleted=False)
		except Cat.DoesNotExist:
			return error_response('NOT_FOUND', 'Cat not found', 404)
		if cat.current_status in ('LOST', 'DECEASED'):
			return error_response('CAT_NOT_TREATABLE',
								   'Cannot add a medical record for a lost or deceased cat.', 400)
		if not _vet_can_treat(request.user, cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)

		# Resolve which appointment this record documents. A vet always treats
		# through an appointment; if the client names one, honour it (after
		# checking it belongs to this cat and — for a vet — to them), otherwise
		# fall back to the vet's most recent appointment for the cat.
		from apps.wellness.models import Appointment
		appointment = None
		appointment_id = request.data.get('appointment')
		if appointment_id:
			appointment = Appointment.objects.filter(
				pk=appointment_id, cat_id=cat_id, is_deleted=False).first()
			if not appointment:
				return error_response('NOT_FOUND', 'Appointment not found for this cat', 404)
			if request.user.role == 'VET' and appointment.vet_id != request.user.id:
				return error_response('NOT_YOUR_PATIENT',
									   'That appointment was not booked with you.', 403)
		elif request.user.role == 'VET':
			appointment = (Appointment.objects
						   .filter(vet=request.user, cat_id=cat_id, is_deleted=False)
						   .order_by('-scheduled_at').first())

		data = request.data.copy()
		data['cat'] = str(cat_id)
		# Drop empty-string values so optional date/decimal fields validate
		# (the forms submit every field, including blanks).
		for key in [k for k in list(data.keys()) if data.get(k) in ('', None)]:
			data.pop(key)
		# File attachments are handled by the dedicated attachments endpoint.
		data.pop('attachments', None)
		# The appointment link is derived server-side, not trusted from the client.
		data.pop('appointment', None)
		# Default the displayed vet name to the creating vet when not provided.
		if not data.get('vet_name'):
			prof = getattr(request.user, 'profile', None)
			full = f"{prof.first_name} {prof.last_name}".strip() if prof else ''
			if full:
				data['vet_name'] = full
		serializer = MedicalRecordSerializer(data=data)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)

		# A treatment can't be recorded before the appointment it belongs to.
		occurred_at = serializer.validated_data.get('occurred_at')
		if appointment and occurred_at:
			if timezone.is_naive(occurred_at):
				occurred_at = timezone.make_aware(occurred_at)
			if occurred_at < appointment.scheduled_at:
				return error_response(
					'RECORD_BEFORE_APPOINTMENT',
					'The record date & time cannot be before the appointment time '
					f'({timezone.localtime(appointment.scheduled_at).strftime("%d %b %Y, %H:%M")}).',
					400,
				)

		record = serializer.save(vet=request.user, appointment=appointment)
		return created_response(MedicalRecordSerializer(record).data)


class MedicalRecordDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, pk):
		try:
			record = MedicalRecord.objects.get(pk=pk, is_deleted=False)
			return success_response(MedicalRecordSerializer(record).data)
		except MedicalRecord.DoesNotExist:
			return error_response('NOT_FOUND', 'Record not found', 404)

	def put(self, request, pk):
		try:
			record = MedicalRecord.objects.get(pk=pk, is_deleted=False)
		except MedicalRecord.DoesNotExist:
			return error_response('NOT_FOUND', 'Record not found', 404)

		if not _vet_can_treat(request.user, record.cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)

		if (timezone.now() - record.created_at).days > 90:
			return error_response('RECORD_LOCKED', 'Records older than 90 days cannot be edited', 403)

		serializer = MedicalRecordSerializer(record, data=request.data, partial=True)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		serializer.save()
		return success_response(MedicalRecordSerializer(record).data)


class MedicalAttachmentView(APIView):
	permission_classes = [IsAuthenticated]
	parser_classes = [MultiPartParser, FormParser]

	def post(self, request, pk):
		try:
			record = MedicalRecord.objects.get(pk=pk, is_deleted=False)
		except MedicalRecord.DoesNotExist:
			return error_response('NOT_FOUND', 'Record not found', 404)

		from django.core.files.storage import default_storage

		urls = list(record.attachments or [])
		for attachment in request.FILES.values():
			path = default_storage.save(f"medical/{record.cat_id}/{pk}/{attachment.name}", attachment)
			urls.append(request.build_absolute_uri(default_storage.url(path)))
		record.attachments = urls
		record.save(update_fields=['attachments'])
		return success_response({'attachments': urls})


class AllergyListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		allergies = Allergy.objects.filter(cat_id=cat_id).order_by('-discovered_at')
		return success_response(AllergySerializer(allergies, many=True).data)

	def post(self, request, cat_id):
		if request.user.role != 'VET':
			return error_response('ACCESS_DENIED', 'Only vets can record allergies', 403)
		if not _vet_can_treat(request.user, cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		data = request.data.copy()
		data['cat'] = str(cat_id)
		serializer = AllergySerializer(data=data)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		allergy = serializer.save(created_by=request.user)
		return created_response(AllergySerializer(allergy).data)


class AllergyDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			allergy = Allergy.objects.get(pk=pk)
		except Allergy.DoesNotExist:
			return error_response('NOT_FOUND', 'Allergy not found', 404)
		if not _vet_can_treat(request.user, allergy.cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		serializer = AllergySerializer(allergy, data=request.data, partial=True)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		serializer.save()
		return success_response(AllergySerializer(allergy).data)


class VaccinationListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		qs = Vaccination.objects.filter(cat_id=cat_id, is_deleted=False).order_by('-administered_at')
		return success_response(VaccinationSerializer(qs, many=True).data)

	def post(self, request, cat_id):
		if request.user.role not in ['VET', 'SHELTER_ADMIN', 'SUPER_ADMIN']:
			return error_response('ACCESS_DENIED', 'Insufficient permissions', 403)
		if not _vet_can_treat(request.user, cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		data = request.data.copy()
		data['cat'] = str(cat_id)
		serializer = VaccinationSerializer(data=data)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		vaccination = serializer.save(administered_by=request.user)

		if vaccination.vaccine_type == 'CORE':
			from apps.cats.models import Cat
			Cat.objects.filter(pk=cat_id).update(is_vaccinated_core=True)

		from apps.wellness.models import HealthAlert
		HealthAlert.objects.filter(
			cat_id=cat_id,
			alert_type__in=['VACCINATION_DUE', 'VACCINATION_OVERDUE'],
			is_resolved=False,
		).update(is_resolved=True)

		return created_response(VaccinationSerializer(vaccination).data)


class UpcomingVaccinesView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		import datetime

		now = timezone.now().date()
		upcoming = Vaccination.objects.filter(
			cat_id=cat_id,
			is_deleted=False,
			next_due_date__isnull=False,
		).order_by('next_due_date')
		overdue = [v for v in upcoming if v.next_due_date < now]
		due_soon = [v for v in upcoming if now <= v.next_due_date <= now + datetime.timedelta(days=30)]
		future = [v for v in upcoming if v.next_due_date > now + datetime.timedelta(days=30)]
		return success_response({
			'overdue': VaccinationSerializer(overdue, many=True).data,
			'due_soon': VaccinationSerializer(due_soon, many=True).data,
			'upcoming': VaccinationSerializer(future, many=True).data,
		})


class VaccinationDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			vaccination = Vaccination.objects.get(pk=pk, is_deleted=False)
		except Vaccination.DoesNotExist:
			return error_response('NOT_FOUND', 'Vaccination not found', 404)
		if not _vet_can_treat(request.user, vaccination.cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		serializer = VaccinationSerializer(vaccination, data=request.data, partial=True)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		serializer.save()
		return success_response(VaccinationSerializer(vaccination).data)

	def delete(self, request, pk):
		try:
			vaccination = Vaccination.objects.get(pk=pk)
		except Vaccination.DoesNotExist:
			return error_response('NOT_FOUND', 'Vaccination not found', 404)
		if not _vet_can_treat(request.user, vaccination.cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		vaccination.is_deleted = True
		vaccination.save(update_fields=['is_deleted'])
		return no_content_response()


class PrescriptionListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, cat_id):
		qs = Prescription.objects.filter(cat_id=cat_id)
		if request.query_params.get('active') == 'true':
			qs = qs.filter(Q(end_date__gte=timezone.now().date()) | Q(is_ongoing=True))
		return success_response(PrescriptionSerializer(qs.order_by('-created_at'), many=True).data)

	def post(self, request, cat_id):
		if request.user.role != 'VET':
			return error_response('ACCESS_DENIED', 'Only vets can prescribe', 403)
		if not _vet_can_treat(request.user, cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		data = request.data.copy()
		data['cat'] = str(cat_id)
		serializer = PrescriptionSerializer(data=data)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		prescription = serializer.save(prescribed_by=request.user)
		return created_response(PrescriptionSerializer(prescription).data)


class PrescriptionDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		try:
			prescription = Prescription.objects.get(pk=pk)
		except Prescription.DoesNotExist:
			return error_response('NOT_FOUND', 'Prescription not found', 404)
		if not _vet_can_treat(request.user, prescription.cat_id):
			return error_response('NOT_YOUR_PATIENT', NOT_PATIENT_MSG, 403)
		serializer = PrescriptionSerializer(prescription, data=request.data, partial=True)
		if not serializer.is_valid():
			return error_response('VALIDATION_FAILED', 'Validation error', 400, serializer.errors)
		serializer.save()
		return success_response(PrescriptionSerializer(prescription).data)


class CompletePrescriptionView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request, pk):
		try:
			prescription = Prescription.objects.get(pk=pk)
			prescription.is_completed = True
			prescription.end_date = timezone.now().date()
			prescription.save(update_fields=['is_completed', 'end_date', 'updated_at'])
			return success_response(PrescriptionSerializer(prescription).data)
		except Prescription.DoesNotExist:
			return error_response('NOT_FOUND', 'Prescription not found', 404)


class DoseLogView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, pk):
		logs = DoseLog.objects.filter(prescription_id=pk).order_by('given_at')
		total = logs.count()
		given = logs.filter(was_given=True).count()
		missed = total - given
		compliance = round(given / total * 100) if total else 0
		return success_response({
			'compliance_percent': compliance,
			'total_doses': total,
			'given': given,
			'missed': missed,
			'logs': DoseLogSerializer(logs, many=True).data,
		})

	def post(self, request, pk):
		try:
			prescription = Prescription.objects.get(pk=pk)
		except Prescription.DoesNotExist:
			return error_response('NOT_FOUND', 'Prescription not found', 404)

		log = DoseLog.objects.create(
			prescription=prescription,
			logged_by=request.user,
			was_given=request.data.get('was_given', True),
			notes=request.data.get('notes', ''),
			missed_reason=request.data.get('missed_reason', ''),
		)

		if not log.was_given:
			recent = DoseLog.objects.filter(prescription=prescription, was_given=False).order_by('-given_at')[:3]
			if recent.count() == 3:
				from apps.wellness.models import HealthAlert
				HealthAlert.objects.get_or_create(
					cat=prescription.cat,
					alert_type='MISSED_DOSE',
					is_resolved=False,
					defaults={
						'severity': 'WARNING',
						'message': f"3 consecutive missed doses for {prescription.drug_name}",
					},
				)

		return created_response(DoseLogSerializer(log).data)
