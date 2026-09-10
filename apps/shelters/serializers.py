from rest_framework import serializers
from .models import Shelter, ShelterStaff, IntakeRecord, DischargeRecord
from apps.core.phone import validate_pk_mobile, validate_pk_phone


class ShelterSerializer(serializers.ModelSerializer):
    current_occupancy = serializers.IntegerField(read_only=True)
    volunteer_count   = serializers.SerializerMethodField()
    available_slots   = serializers.SerializerMethodField()
    # Contact number is mandatory and always a Pakistani mobile number.
    phone             = serializers.CharField(required=True, allow_blank=False, max_length=20)

    class Meta:
        model = Shelter
        fields = [
            'id', 'name', 'registration_number', 'street', 'city', 'country',
            'latitude', 'longitude', 'phone', 'email', 'website',
            'capacity_total', 'current_occupancy', 'available_slots', 'volunteer_count',
            'is_active', 'admin', 'logo_url', 'description', 'created_at',
        ]
        # registration_number is system-generated, never supplied by the client.
        read_only_fields = ['id', 'created_at', 'registration_number',
                            'current_occupancy', 'volunteer_count', 'available_slots']

    def validate_phone(self, value):
        # Shelter contact number is mandatory: a Pakistani mobile OR landline.
        return validate_pk_phone(value, required=True)

    def get_volunteer_count(self, obj):
        from apps.volunteers.models import VolunteerProfile
        return VolunteerProfile.objects.filter(shelter=obj, is_active=True).count()

    def get_available_slots(self, obj):
        return max(0, (obj.capacity_total or 0) - obj.current_occupancy)

    def validate_latitude(self, value):
        # E1: sanity-check coordinates.
        if value is not None and not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if value is not None and not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_capacity_total(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Capacity must be a positive number.")
        return value


class ShelterSummarySerializer(serializers.ModelSerializer):
    current_occupancy = serializers.IntegerField(read_only=True)
    cat_count         = serializers.SerializerMethodField()
    volunteer_count   = serializers.SerializerMethodField()

    class Meta:
        model = Shelter
        fields = ['id', 'name', 'city', 'country', 'capacity_total', 'current_occupancy',
                  'cat_count', 'volunteer_count', 'is_active', 'logo_url', 'latitude', 'longitude']

    def get_cat_count(self, obj):
        # Total cats belonging to this shelter (any status), so a freshly added
        # cat shows up on the list card regardless of its status.
        return obj.cats.filter(is_deleted=False).count()

    def get_volunteer_count(self, obj):
        from apps.volunteers.models import VolunteerProfile
        return VolunteerProfile.objects.filter(shelter=obj, is_active=True).count()


class ShelterStaffSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ShelterStaff
        fields = ['id', 'user', 'user_email', 'role_in_shelter', 'joined_at', 'is_active']
        read_only_fields = ['id', 'joined_at']


class IntakeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntakeRecord
        fields = [
            'id', 'cat', 'shelter', 'intake_date', 'intake_source',
            'initial_health_status', 'quarantine_required', 'quarantine_until',
            'housing_assignment', 'intake_notes', 'processed_by',
            'surrenderer_name', 'surrenderer_phone',
        ]
        read_only_fields = ['id', 'intake_date']

    def validate_surrenderer_phone(self, value):
        # Optional, but if provided must be a valid Pakistani mobile number.
        return validate_pk_mobile(value, required=False)


class DischargeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = DischargeRecord
        fields = [
            'id', 'cat', 'shelter', 'discharge_date', 'discharge_type',
            'destination_shelter', 'processed_by', 'notes',
            'recipient_name', 'recipient_phone',
        ]
        read_only_fields = ['id', 'discharge_date']

    def validate_recipient_phone(self, value):
        # Optional, but if provided must be a valid Pakistani mobile number.
        return validate_pk_mobile(value, required=False)
