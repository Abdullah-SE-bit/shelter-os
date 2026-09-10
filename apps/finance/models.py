import uuid
from django.db import models
from apps.accounts.models import User


class DonationCampaign(models.Model):
	STATUS_CHOICES = [
		('ACTIVE', 'Active'),
		('COMPLETED', 'Completed'),
		('INCOMPLETE', 'Incomplete'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	# Nullable so a super admin can create an app-wide campaign (shelter = None)
	# in addition to a campaign scoped to a specific shelter.
	shelter = models.ForeignKey('shelters.Shelter', null=True, blank=True, on_delete=models.CASCADE)
	title = models.CharField(max_length=200)
	description = models.TextField(blank=True)
	target_amount = models.DecimalField(max_digits=12, decimal_places=2)
	collected_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	start_date = models.DateField()
	end_date = models.DateField()
	is_active = models.BooleanField(default=True)
	# Lifecycle: ACTIVE until the target is reached (COMPLETED) or the end date
	# passes without reaching it (INCOMPLETE). closed_at marks when it settled,
	# so the card can be shown briefly and then removed after a grace period.
	status = models.CharField(max_length=12, choices=STATUS_CHOICES, default='ACTIVE')
	closed_at = models.DateTimeField(null=True, blank=True)
	created_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'donation_campaigns'


class Donation(models.Model):
	DONATION_TYPE_CHOICES = [('MONETARY', 'Monetary'), ('ITEM', 'Item')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	donor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
	shelter = models.ForeignKey('shelters.Shelter', null=True, blank=True, on_delete=models.SET_NULL)
	campaign = models.ForeignKey(
		DonationCampaign,
		null=True,
		blank=True,
		on_delete=models.SET_NULL,
		related_name='donations',
	)
	donation_type = models.CharField(max_length=10, choices=DONATION_TYPE_CHOICES)
	amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
	currency = models.CharField(max_length=3, default='PKR')
	is_anonymous = models.BooleanField(default=False)
	acknowledgment_sent = models.BooleanField(default=False)
	payment_reference = models.TextField(blank=True)
	donated_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'donations'


class ItemDonation(models.Model):
	CONDITION_CHOICES = [('NEW', 'New'), ('GOOD', 'Good'), ('FAIR', 'Fair')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	donation = models.OneToOneField(Donation, on_delete=models.CASCADE)
	item_name = models.CharField(max_length=200)
	quantity = models.PositiveIntegerField()
	estimated_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
	received_at = models.DateTimeField(null=True, blank=True)
	condition = models.CharField(max_length=10, choices=CONDITION_CHOICES)

	class Meta:
		db_table = 'item_donations'


class ExpenseRecord(models.Model):
	CATEGORY_CHOICES = [
		('FOOD', 'Food'),
		('MEDICAL', 'Medical'),
		('UTILITIES', 'Utilities'),
		('STAFF', 'Staff'),
		('TRANSPORT', 'Transport'),
		('EQUIPMENT', 'Equipment'),
		('OTHER', 'Other'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	shelter = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE)
	category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	currency = models.CharField(max_length=3, default='PKR')
	description = models.TextField()
	expense_date = models.DateField()
	recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	receipt_url = models.URLField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'expense_records'
