from rest_framework import serializers
from .models import Donation, DonationCampaign, ExpenseRecord


class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    donor_email = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    notes = serializers.SerializerMethodField()
    received_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Donation
        fields = [
            'id', 'donor', 'shelter', 'campaign', 'donation_type',
            'amount', 'currency', 'is_anonymous', 'donated_at',
            'donor_name', 'donor_email', 'payment_method', 'notes', 'received_at',
        ]
    
    def _get_payment_reference_data(self, obj):
        """Parse payment_reference JSON to extract additional fields"""
        if obj.payment_reference:
            try:
                import json
                return json.loads(obj.payment_reference)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}
    
    def get_donor_name(self, obj):
        data = self._get_payment_reference_data(obj)
        return data.get('donor_name', '')
    
    def get_donor_email(self, obj):
        data = self._get_payment_reference_data(obj)
        return data.get('donor_email', '')
    
    def get_payment_method(self, obj):
        data = self._get_payment_reference_data(obj)
        return data.get('payment_method', '')
    
    def get_notes(self, obj):
        data = self._get_payment_reference_data(obj)
        return data.get('notes', '')
    
    def get_received_at(self, obj):
        data = self._get_payment_reference_data(obj)
        return data.get('received_at', obj.donated_at.strftime('%Y-%m-%d'))


class CampaignSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()
    shelter_name = serializers.SerializerMethodField()
    is_app_level = serializers.SerializerMethodField()

    class Meta:
        model = DonationCampaign
        fields = [
            'id', 'shelter', 'shelter_name', 'is_app_level', 'title', 'description',
            'target_amount', 'collected_amount', 'start_date', 'end_date', 'is_active',
            'status', 'closed_at', 'progress_percent', 'created_at',
        ]

    def get_progress_percent(self, obj):
        if obj.target_amount:
            return round(float(obj.collected_amount) / float(obj.target_amount) * 100, 1)
        return 0

    def get_shelter_name(self, obj):
        return obj.shelter.name if obj.shelter_id else None

    def get_is_app_level(self, obj):
        return obj.shelter_id is None


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseRecord
        fields = [
            'id', 'shelter', 'category', 'amount', 'currency',
            'description', 'expense_date', 'receipt_url', 'created_at',
        ]
