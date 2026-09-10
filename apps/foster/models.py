import uuid
from django.db import models
from apps.accounts.models import User


class FosterProfile(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	shelter = models.ForeignKey('shelters.Shelter', null=True, blank=True, on_delete=models.SET_NULL)
	max_capacity = models.PositiveIntegerField()
	current_capacity = models.PositiveIntegerField(default=0)
	preferred_ages = models.JSONField(default=list)
	can_handle_medical = models.BooleanField(default=False)
	can_handle_kittens = models.BooleanField(default=False)
	is_available = models.BooleanField(default=True)
	address = models.CharField(max_length=500)
	latitude = models.FloatField(null=True, blank=True)
	longitude = models.FloatField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'foster_profiles'


class FosterPlacement(models.Model):
	OUTCOME_CHOICES = [
		('ONGOING', 'Ongoing'),
		('RETURNED', 'Returned'),
		('ADOPTED_FROM_FOSTER', 'Adopted from Foster'),
		('CAT_DECEASED', 'Cat Deceased'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	cat = models.ForeignKey('cats.Cat', on_delete=models.CASCADE)
	foster = models.ForeignKey(FosterProfile, on_delete=models.CASCADE)
	shelter = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE)
	placed_at = models.DateTimeField(auto_now_add=True)
	expected_return_at = models.DateField(null=True, blank=True)
	actual_return_at = models.DateTimeField(null=True, blank=True)
	outcome = models.CharField(max_length=30, choices=OUTCOME_CHOICES, default='ONGOING')
	check_in_notes = models.JSONField(default=list)
	placed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'foster_placements'
