from rest_framework import serializers
from .models import WeightLog, NutritionPlan, Appointment, HealthAlert


class WeightLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightLog
        fields = ['id', 'cat', 'weight_kg', 'recorded_at', 'notes']


class NutritionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = NutritionPlan
        fields = [
            'id', 'cat', 'food_brand', 'daily_amount_grams',
            'feeding_frequency', 'is_active', 'active_since',
        ]


class AppointmentSerializer(serializers.ModelSerializer):
    vet_name = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    cat_name = serializers.CharField(source='cat.name', read_only=True, default='')

    class Meta:
        model = Appointment
        fields = [
            'id', 'cat', 'cat_name', 'vet', 'vet_name', 'owner', 'owner_name', 'owner_email', 'shelter',
            'appointment_type', 'scheduled_at', 'duration_minutes',
            'location_type', 'clinic_name', 'status', 'notes',
            'outcome_summary', 'cancellation_reason', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_vet_name(self, obj):
        if obj.vet and hasattr(obj.vet, 'profile'):
            full = f"{obj.vet.profile.first_name} {obj.vet.profile.last_name}".strip()
            return full or obj.vet.email
        return obj.vet.email if obj.vet else None

    def get_owner_name(self, obj):
        if obj.owner and hasattr(obj.owner, 'profile'):
            full = f"{obj.owner.profile.first_name} {obj.owner.profile.last_name}".strip()
            return full or obj.owner.email
        return obj.owner.email if obj.owner else None

    def get_owner_email(self, obj):
        return obj.owner.email if obj.owner else None


class HealthAlertSerializer(serializers.ModelSerializer):
    cat_name = serializers.CharField(source='cat.name', read_only=True, default='')
    resolved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = HealthAlert
        fields = [
            'id', 'cat', 'cat_name', 'alert_type', 'severity', 'message',
            'is_resolved', 'resolved_at', 'resolved_by_name', 'triggered_at',
        ]

    def get_resolved_by_name(self, obj):
        u = obj.resolved_by
        if not u:
            return None
        if hasattr(u, 'profile'):
            full = f"{u.profile.first_name} {u.profile.last_name}".strip()
            if full:
                return full
        return u.email
