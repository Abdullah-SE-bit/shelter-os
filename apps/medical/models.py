import uuid
from django.db import models
from apps.accounts.models import User


class MedicalRecord(models.Model):
	# Superset of the types the frontend forms offer (checkup, dental, etc.)
	# plus the original clinical categories.
	RECORD_TYPE_CHOICES = [
		('CHECKUP', 'Checkup'),
		('VACCINATION', 'Vaccination'),
		('ILLNESS', 'Illness'),
		('INJURY', 'Injury'),
		('SURGERY', 'Surgery'),
		('DENTAL', 'Dental'),
		('DIAGNOSTIC', 'Diagnostic'),
		('DIAGNOSIS', 'Diagnosis'),
		('TREATMENT', 'Treatment'),
		('EMERGENCY', 'Emergency'),
		('FOLLOW_UP', 'Follow-up'),
		('ALLERGY', 'Allergy'),
		('CHRONIC', 'Chronic'),
		('OTHER', 'Other'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='medical_records')
	vet = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	# The appointment this record documents. A vet reaches a patient through an
	# appointment, so the record is tied back to it; the record's date/time can't
	# precede the appointment's scheduled time.
	appointment = models.ForeignKey(
		'wellness.Appointment', on_delete=models.SET_NULL, null=True, blank=True,
		related_name='medical_records')
	record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES, default='CHECKUP')
	title = models.CharField(max_length=200, blank=True, default='')
	description = models.TextField(blank=True, default='')
	# `date` is what the UI sends/reads; occurred_at is kept in sync for any
	# legacy consumers.
	date = models.DateField(null=True, blank=True)
	occurred_at = models.DateTimeField(null=True, blank=True)
	diagnosis = models.TextField(blank=True, default='')
	treatment = models.TextField(blank=True, default='')
	vet_name = models.CharField(max_length=200, blank=True, default='')
	clinic_name = models.CharField(max_length=200, blank=True, default='')
	cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
	weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
	follow_up_date = models.DateField(null=True, blank=True)
	next_appointment = models.DateField(null=True, blank=True)
	is_confidential = models.BooleanField(default=False)
	notes = models.TextField(blank=True)
	attachments = models.JSONField(default=list)
	is_ongoing = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	is_deleted = models.BooleanField(default=False)

	class Meta:
		db_table = 'medical_records'


class Allergy(models.Model):
	SEVERITY_CHOICES = [('MILD', 'Mild'), ('MODERATE', 'Moderate'), ('SEVERE', 'Severe')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='allergies')
	allergen = models.CharField(max_length=200)
	reaction_description = models.TextField(blank=True)
	severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
	discovered_at = models.DateField()
	is_active = models.BooleanField(default=True)
	created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'allergies'


class Vaccination(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='vaccinations')
	vaccine_name = models.CharField(max_length=200)
	vaccine_type = models.CharField(max_length=20, choices=[('CORE', 'Core'), ('NON_CORE', 'Non-Core')])
	batch_number = models.CharField(max_length=100, blank=True)
	administered_at = models.DateTimeField()
	administered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	valid_until = models.DateField(null=True, blank=True)
	next_due_date = models.DateField(null=True, blank=True)
	clinic_name = models.CharField(max_length=200, blank=True)
	notes = models.TextField(blank=True)
	is_deleted = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'vaccinations'


class Prescription(models.Model):
	FREQUENCY_CHOICES = [
		('ONCE_DAILY', 'Once Daily'),
		('TWICE_DAILY', 'Twice Daily'),
		('THREE_TIMES_DAILY', 'Three Times Daily'),
		('EVERY_OTHER_DAY', 'Every Other Day'),
		('AS_NEEDED', 'As Needed'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='prescriptions')
	prescribed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	drug_name = models.CharField(max_length=200)
	dosage_amount = models.DecimalField(max_digits=8, decimal_places=2)
	dosage_unit = models.CharField(max_length=50)
	frequency = models.CharField(max_length=30, choices=FREQUENCY_CHOICES)
	start_date = models.DateField()
	end_date = models.DateField(null=True, blank=True)
	is_ongoing = models.BooleanField(default=False)
	instructions = models.TextField(blank=True)
	is_completed = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'prescriptions'


class DoseLog(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='dose_logs')
	logged_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	given_at = models.DateTimeField(auto_now_add=True)
	was_given = models.BooleanField()
	notes = models.TextField(blank=True)
	missed_reason = models.CharField(max_length=500, blank=True)

	class Meta:
		db_table = 'dose_logs'
