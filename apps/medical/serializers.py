from rest_framework import serializers
from .models import MedicalRecord, Allergy, Vaccination, Prescription, DoseLog


class MedicalRecordSerializer(serializers.ModelSerializer):
    # Read-only context pulled from the linked appointment so both the vet and
    # the person who booked it can see what the visit was for.
    appointment_type = serializers.SerializerMethodField()
    appointment_scheduled_at = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'cat', 'vet', 'appointment', 'appointment_type', 'appointment_scheduled_at',
            'record_type', 'title', 'description',
            'date', 'occurred_at', 'diagnosis', 'treatment', 'vet_name', 'clinic_name',
            'cost', 'weight_kg', 'follow_up_date', 'next_appointment',
            'is_confidential', 'notes', 'attachments', 'is_ongoing', 'created_at',
        ]
        # `appointment` is assigned server-side in the view, never trusted from the client.
        read_only_fields = ['id', 'vet', 'appointment', 'created_at']

    def get_appointment_type(self, obj):
        return obj.appointment.appointment_type if obj.appointment else None

    def get_appointment_scheduled_at(self, obj):
        return obj.appointment.scheduled_at if obj.appointment else None

    def validate(self, attrs):
        # Keep `date` and `occurred_at` in sync regardless of which one the client sent.
        from datetime import datetime, time
        from django.utils import timezone
        occurred = attrs.get('occurred_at')
        date_val = attrs.get('date')
        if occurred and not date_val:
            local_occurred = timezone.localtime(occurred) if timezone.is_aware(occurred) else occurred
            attrs['date'] = local_occurred.date()
        elif date_val and not occurred:
            attrs['occurred_at'] = timezone.make_aware(datetime.combine(date_val, time.min))
        return attrs


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = [
            'id', 'cat', 'allergen', 'reaction_description', 'severity',
            'discovered_at', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = [
            'id', 'cat', 'vaccine_name', 'vaccine_type', 'batch_number',
            'administered_at', 'valid_until', 'next_due_date', 'clinic_name',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'administered_by', 'created_at']


class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = [
            'id', 'cat', 'drug_name', 'dosage_amount', 'dosage_unit', 'frequency',
            'start_date', 'end_date', 'is_ongoing', 'instructions', 'is_completed', 'created_at',
        ]
        read_only_fields = ['id', 'prescribed_by', 'created_at']


class DoseLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoseLog
        fields = ['id', 'prescription', 'was_given', 'given_at', 'notes', 'missed_reason']
