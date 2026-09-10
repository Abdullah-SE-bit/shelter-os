from django.db.models import F
from django.utils import timezone
from rest_framework.views import APIView

from .models import InventoryItem, InventoryTransaction
from .serializers import InventoryItemSerializer, TransactionSerializer
from apps.core.permissions import IsShelterAdminOrSuperAdmin
from apps.core.responses import success_response, created_response, error_response


class InventoryListCreateView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		qs = InventoryItem.objects.filter(shelter_id=shelter_id, is_deleted=False)
		category = request.query_params.get('category')
		if category:
			qs = qs.filter(category=category)
		return success_response(InventoryItemSerializer(qs, many=True).data)

	def post(self, request, shelter_id):
		qty = float(request.data.get('current_quantity', 0))
		item = InventoryItem.objects.create(
			shelter_id=shelter_id,
			name=request.data.get('name', ''),
			category=request.data.get('category', 'OTHER'),
			unit=request.data.get('unit', 'units'),
			current_quantity=qty,
			minimum_threshold=float(request.data.get('minimum_threshold', 0)),
			unit_cost=request.data.get('unit_cost'),
			supplier_info=request.data.get('supplier_info', ''),
		)
		if qty > 0:
			InventoryTransaction.objects.create(
				item=item,
				transaction_type='IN',
				quantity_change=qty,
				quantity_after=qty,
				performed_by=request.user,
				notes='Opening stock',
			)
		return created_response(InventoryItemSerializer(item).data)


class LowStockView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		items = InventoryItem.objects.filter(
			shelter_id=shelter_id,
			is_deleted=False,
			current_quantity__lte=F('minimum_threshold'),
		).order_by('current_quantity')
		return success_response(InventoryItemSerializer(items, many=True).data)


class InventoryItemDetailView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def put(self, request, pk):
		try:
			item = InventoryItem.objects.get(pk=pk, is_deleted=False)
		except InventoryItem.DoesNotExist:
			return error_response('NOT_FOUND', 'Item not found', 404)
		for field in ['name', 'unit_cost', 'minimum_threshold', 'supplier_info']:
			if field in request.data:
				setattr(item, field, request.data[field])
		item.save()
		return success_response(InventoryItemSerializer(item).data)


class RestockView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request, pk):
		try:
			item = InventoryItem.objects.get(pk=pk, is_deleted=False)
		except InventoryItem.DoesNotExist:
			return error_response('NOT_FOUND', 'Item not found', 404)
		qty = float(request.data.get('quantity_added', 0))
		if qty <= 0:
			return error_response('VALIDATION_FAILED', 'quantity_added must be positive', 400)
		item.current_quantity = float(item.current_quantity) + qty
		item.last_restocked_at = timezone.now()
		item.save(update_fields=['current_quantity', 'last_restocked_at'])
		InventoryTransaction.objects.create(
			item=item,
			transaction_type='IN',
			quantity_change=qty,
			quantity_after=item.current_quantity,
			performed_by=request.user,
			notes=request.data.get('notes', ''),
		)
		return success_response(InventoryItemSerializer(item).data)


class UseStockView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request, pk):
		try:
			item = InventoryItem.objects.get(pk=pk, is_deleted=False)
		except InventoryItem.DoesNotExist:
			return error_response('NOT_FOUND', 'Item not found', 404)

		qty = float(request.data.get('quantity_used', 0))
		if qty <= 0:
			return error_response('VALIDATION_FAILED', 'quantity_used must be positive', 400)
		if float(item.current_quantity) < qty:
			return error_response('INSUFFICIENT_STOCK', f'Only {item.current_quantity} {item.unit} available', 400)

		item.current_quantity = float(item.current_quantity) - qty
		item.save(update_fields=['current_quantity'])
		InventoryTransaction.objects.create(
			item=item,
			transaction_type='OUT',
			quantity_change=-qty,
			quantity_after=item.current_quantity,
			performed_by=request.user,
			notes=request.data.get('notes', ''),
			reference_id=request.data.get('prescription_id'),
		)

		if float(item.current_quantity) <= float(item.minimum_threshold):
			from apps.notifications.tasks import send_notification

			shelter = item.shelter
			if shelter.admin:
				send_notification.delay(
					user_id=str(shelter.admin.id),
					title=f'Low Stock: {item.name}',
					body=f'Current: {item.current_quantity} {item.unit}. Threshold: {item.minimum_threshold}',
					category='SYSTEM',
				)

		return success_response(InventoryItemSerializer(item).data)


class TransactionHistoryView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, pk):
		txs = InventoryTransaction.objects.filter(item_id=pk).order_by('-performed_at')
		return success_response(TransactionSerializer(txs, many=True).data)
