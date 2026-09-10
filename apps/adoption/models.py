import uuid
from django.db import models
from apps.accounts.models import User


class AdoptionListing(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE, related_name='listings')
	shelter = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE)
	is_active = models.BooleanField(default=True)
	adoption_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	posted_at = models.DateTimeField(auto_now_add=True)
	expires_at = models.DateTimeField(null=True, blank=True)
	views_count = models.PositiveIntegerField(default=0)

	class Meta:
		db_table = 'adoption_listings'


class AdopterFavorite(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE)
	saved_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'adopter_favorites'
		unique_together = ('user', 'cat')


class AdoptionApplication(models.Model):
	STATUS_CHOICES = [
		('SUBMITTED', 'Submitted'),
		('UNDER_REVIEW', 'Under Review'),
		('INTERVIEW_SCHEDULED', 'Interview Scheduled'),
		('APPROVED', 'Approved'),
		('REJECTED', 'Rejected'),
		('WITHDRAWN', 'Withdrawn'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE)
	applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
	shelter = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE)
	status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='SUBMITTED')
	submitted_at = models.DateTimeField(auto_now_add=True)
	reviewed_by = models.ForeignKey(
		User,
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name='reviewed_applications',
	)
	rejection_reason = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'adoption_applications'


class AdoptionQuestionnaire(models.Model):
	LIVING_CHOICES = [
		('HOUSE_WITH_GARDEN', 'House with Garden'),
		('APARTMENT', 'Apartment'),
		('HOUSE_NO_GARDEN', 'House without Garden'),
		('OTHER', 'Other'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	application = models.OneToOneField(AdoptionApplication, on_delete=models.CASCADE)
	living_type = models.CharField(max_length=30, choices=LIVING_CHOICES)
	has_garden = models.BooleanField(default=False)
	other_pets = models.BooleanField(default=False)
	children_in_house = models.BooleanField(default=False)
	work_hours_away = models.PositiveIntegerField()
	previous_pet_experience = models.TextField()
	financial_readiness_confirmed = models.BooleanField(default=False)
	references = models.JSONField(default=list)
	emergency_contact_name = models.CharField(max_length=100, blank=True, default='')
	emergency_contact_phone = models.CharField(max_length=20, blank=True, default='')

	class Meta:
		db_table = 'adoption_questionnaires'


class AdoptionInterview(models.Model):
	OUTCOME_CHOICES = [('PASS', 'Pass'), ('FAIL', 'Fail'), ('PENDING', 'Pending')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	application = models.ForeignKey(AdoptionApplication, on_delete=models.CASCADE, related_name='interviews')
	scheduled_at = models.DateTimeField()
	conducted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
	notes = models.TextField(blank=True)
	outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES, default='PENDING')
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'adoption_interviews'


class AdoptionRecord(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE)
	adopter = models.ForeignKey(User, on_delete=models.CASCADE)
	shelter = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE)
	application = models.OneToOneField(AdoptionApplication, on_delete=models.CASCADE)
	adoption_date = models.DateTimeField(auto_now_add=True)
	adoption_fee_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	follow_up_date = models.DateField(null=True, blank=True)

	class Meta:
		db_table = 'adoption_records'
