import uuid
from django.db import models
from apps.accounts.models import User


class InventoryItem(models.Model):
	CATEGORY_CHOICES = [
		('FOOD', 'Food'),
		('MEDICINE', 'Medicine'),
		('EQUIPMENT', 'Equipment'),
		('CLEANING', 'Cleaning'),
		('BEDDING', 'Bedding'),
		('OTHER', 'Other'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	shelter = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE, related_name='inventory')
	name = models.CharField(max_length=200)
	category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
	unit = models.CharField(max_length=50)
	current_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	minimum_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0)
	unit_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
	supplier_info = models.TextField(blank=True)
	last_restocked_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)
	is_deleted = models.BooleanField(default=False)

	class Meta:
		db_table = 'inventory_items'


class InventoryTransaction(models.Model):
	TX_TYPE_CHOICES = [('IN', 'In'), ('OUT', 'Out'), ('ADJUSTMENT', 'Adjustment')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='transactions')
	transaction_type = models.CharField(max_length=15, choices=TX_TYPE_CHOICES)
	quantity_change = models.DecimalField(max_digits=10, decimal_places=2)
	quantity_after = models.DecimalField(max_digits=10, decimal_places=2)
	performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
	performed_at = models.DateTimeField(auto_now_add=True)
	notes = models.TextField(blank=True)
	reference_id = models.UUIDField(null=True, blank=True)

	class Meta:
		db_table = 'inventory_transactions'
