import uuid
from django.db import models
from apps.accounts.models import User


class WeightLog(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='weight_logs')
	weight_kg = models.DecimalField(max_digits=5, decimal_places=3)
	recorded_at = models.DateTimeField(auto_now_add=True)
	recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	notes = models.TextField(blank=True)

	class Meta:
		db_table = 'weight_logs'
		ordering = ['recorded_at']


class NutritionPlan(models.Model):
	FREQUENCY_CHOICES = [
		('ONCE', 'Once'),
		('TWICE', 'Twice'),
		('THREE_TIMES', 'Three Times'),
		('FREE_FEED', 'Free Feed'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE)
	food_brand = models.CharField(max_length=200, blank=True)
	daily_amount_grams = models.PositiveIntegerField()
	feeding_frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
	is_active = models.BooleanField(default=True)
	created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
	active_since = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'nutrition_plans'


class FeedingLog(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='feeding_logs')
	amount_grams = models.PositiveIntegerField(default=0)
	food_type = models.CharField(max_length=200, blank=True)
	fed_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
	fed_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'feeding_logs'


class Appointment(models.Model):
	TYPE_CHOICES = [
		('CHECKUP', 'Checkup'),
		('VACCINATION', 'Vaccination'),
		('SURGERY', 'Surgery'),
		('FOLLOWUP', 'Follow-up'),
		('EMERGENCY', 'Emergency'),
	]
	STATUS_CHOICES = [
		('SCHEDULED', 'Scheduled'),
		('CONFIRMED', 'Confirmed'),
		('COMPLETED', 'Completed'),
		('CANCELLED', 'Cancelled'),
		('NO_SHOW', 'No Show'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='appointments')
	vet = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='vet_appointments')
	owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owner_appointments')
	shelter = models.ForeignKey('shelters.Shelter', null=True, blank=True, on_delete=models.SET_NULL)
	appointment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
	scheduled_at = models.DateTimeField()
	duration_minutes = models.PositiveIntegerField(default=30)
	location_type = models.CharField(max_length=20, default='CLINIC')
	clinic_name = models.CharField(max_length=200, blank=True)
	status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
	notes = models.TextField(blank=True)
	outcome_summary = models.TextField(blank=True)
	cancellation_reason = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	is_deleted = models.BooleanField(default=False)

	class Meta:
		db_table = 'appointments'


class HealthAlert(models.Model):
	TYPE_CHOICES = [
		('VACCINATION_DUE', 'Vaccination Due'),
		('VACCINATION_OVERDUE', 'Vaccination Overdue'),
		('MISSED_DOSE', 'Missed Dose'),
		('CHECKUP_DUE', 'Checkup Due'),
		('WEIGHT_CONCERN', 'Weight Concern'),
		('CUSTOM', 'Custom'),
	]
	SEVERITY_CHOICES = [('INFO', 'Info'), ('WARNING', 'Warning'), ('CRITICAL', 'Critical')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='health_alerts')
	alert_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
	severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
	message = models.TextField()
	is_resolved = models.BooleanField(default=False)
	resolved_at = models.DateTimeField(null=True, blank=True)
	resolved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
	triggered_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'health_alerts'
