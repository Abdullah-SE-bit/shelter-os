from rest_framework import serializers
from .models import InventoryItem, InventoryTransaction


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'shelter', 'name', 'category', 'unit', 'current_quantity',
            'minimum_threshold', 'unit_cost', 'supplier_info',
            'last_restocked_at', 'is_low_stock', 'created_at',
        ]

    def get_is_low_stock(self, obj):
        return float(obj.current_quantity) <= float(obj.minimum_threshold)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'item', 'transaction_type', 'quantity_change',
            'quantity_after', 'performed_at', 'notes',
        ]
