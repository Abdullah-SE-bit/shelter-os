import re

from rest_framework import serializers
from .models import (User, UserProfile, UserAddress, EmergencyContact, VetProfile,
                     VetAppeal, BlacklistedVetRegistration)
from apps.core.phone import validate_pk_mobile

MAX_APPEAL_DOC_MB = 10

BLOCKED_SELF_REGISTER_ROLES = ['SUPER_ADMIN', 'SHELTER_ADMIN']


def validate_auth_password(value):
    if len(value) < 8:
        raise serializers.ValidationError("Password must be at least 8 characters long.")
    if not re.search(r'[A-Z]', value):
        raise serializers.ValidationError("Password needs at least one uppercase letter.")
    if not re.search(r'\d', value):
        raise serializers.ValidationError("Password needs at least one digit.")
    if not re.search(r'[@$!%*?&]', value):
        raise serializers.ValidationError("Password needs at least one special character.")


class CamelCasePayloadMixin:
    payload_key_map = {}

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        for source_key, target_key in self.payload_key_map.items():
            if source_key in data and target_key not in data:
                data[target_key] = data[source_key]
        return super().to_internal_value(data)


class RegisterSerializer(CamelCasePayloadMixin, serializers.Serializer):
    payload_key_map = {
        'firstName': 'first_name',
        'lastName': 'last_name',
        'dob': 'date_of_birth',
        'dateOfBirth': 'date_of_birth',
        'roleDetails': 'role_details',
    }

    email         = serializers.EmailField(max_length=255)
    password      = serializers.CharField(min_length=8, write_only=True)
    first_name    = serializers.CharField(max_length=100)
    last_name     = serializers.CharField(max_length=100)
    date_of_birth = serializers.DateField(required=False, allow_null=True)  # A4
    role          = serializers.ChoiceField(choices=[
        'CAT_OWNER', 'ADOPTER', 'VOLUNTEER', 'VET'])
    # A1: optional bag of role-specific fields validated per role in validate().
    role_details  = serializers.DictField(required=False, default=dict)

    MIN_AGE = 13

    def validate_email(self, value):
        # A3: Accept any RFC-valid email domain (.edu, corporate, any TLD).
        # DRF's EmailField already enforces RFC 5322 format; we only normalize
        # to lowercase and enforce uniqueness here. No domain allow-list.
        normalized = value.lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("EMAIL_ALREADY_EXISTS")
        return normalized

    def validate_first_name(self, value):
        if not re.fullmatch(r"[A-Za-z\s-]+", value):
            raise serializers.ValidationError("First name may only contain letters, spaces, and hyphens.")
        return value

    def validate_last_name(self, value):
        if not re.fullmatch(r"[A-Za-z\s-]+", value):
            raise serializers.ValidationError("Last name may only contain letters, spaces, and hyphens.")
        return value

    def validate_role(self, value):
        if value in BLOCKED_SELF_REGISTER_ROLES:
            raise serializers.ValidationError("This role cannot self-register.")
        return value

    def validate_password(self, value):
        validate_auth_password(value)
        return value

    def validate_date_of_birth(self, value):
        # A4: DOB must be a past date; enforce a minimum age.
        if value is None:
            return value
        from datetime import date
        today = date.today()
        if value >= today:
            raise serializers.ValidationError("Date of birth must be in the past.")
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < self.MIN_AGE:
            raise serializers.ValidationError(f"You must be at least {self.MIN_AGE} years old to register.")
        return value

    def validate(self, attrs):
        # A1/F1: enforce role-specific requirements.
        role = attrs.get('role')
        details = attrs.get('role_details') or {}
        errors = {}

        if role == 'VOLUNTEER':
            # F1: volunteers must be bound to a shelter at signup. If no active
            # shelters exist, volunteer registration is blocked entirely.
            from apps.shelters.models import Shelter
            if not Shelter.objects.filter(is_deleted=False, is_active=True).exists():
                raise serializers.ValidationError(
                    {'role_details': {'shelter_id': [
                        'No active shelters are available, so volunteers cannot register yet.']}})
            shelter_id = details.get('shelter_id') or details.get('shelter')
            if not shelter_id:
                errors['shelter_id'] = ['Please select a shelter to join.']
            elif not Shelter.objects.filter(pk=shelter_id, is_deleted=False, is_active=True).exists():
                errors['shelter_id'] = ['Selected shelter was not found.']

        elif role == 'VET':
            # Registration number: fixed "RVMP" prefix followed by exactly 3 or 5 digits.
            reg = (details.get('registration_number')
                   or details.get('license_number') or '').strip().upper()
            if not reg:
                errors['registration_number'] = ['Registration number is required for veterinarians.']
            elif not re.fullmatch(r'RVMP\d{3}|RVMP\d{5}', reg):
                errors['registration_number'] = [
                    'Registration number must be "RVMP" followed by 3 or 5 digits '
                    '(e.g. RVMP123 or RVMP12345).']
            elif BlacklistedVetRegistration.objects.filter(registration_number=reg).exists():
                errors['registration_number'] = [
                    'This registration number has been blocked and can no longer be used to register.']

            # Practice type: clinic vs shelter.
            practice_type = (details.get('practice_type') or '').strip().upper()
            if practice_type not in (VetProfile.PRACTICE_CLINIC, VetProfile.PRACTICE_SHELTER):
                errors['practice_type'] = [
                    'Please choose whether you practise from a clinic or a shelter.']

            # Specializations: at least one (predefined or custom).
            specs = details.get('specializations') or details.get('specialization') or []
            if isinstance(specs, str):
                specs = [s.strip() for s in specs.split(',') if s.strip()]
            if not specs:
                errors['specializations'] = ['Please select at least one specialization.']

            if practice_type == VetProfile.PRACTICE_CLINIC:
                if not (details.get('clinic_location') or '').strip():
                    errors['clinic_location'] = ['Clinic location is required.']
                if not (details.get('clinic_registration_number') or '').strip():
                    errors['clinic_registration_number'] = ['Clinic registration number is required.']
            elif practice_type == VetProfile.PRACTICE_SHELTER:
                shelter_id = details.get('shelter_id') or details.get('shelter')
                if shelter_id:
                    from apps.shelters.models import Shelter
                    if not Shelter.objects.filter(pk=shelter_id, is_deleted=False, is_active=True).exists():
                        errors['shelter_id'] = ['Selected shelter was not found.']

        if errors:
            raise serializers.ValidationError({'role_details': errors})
        return attrs


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['first_name', 'last_name', 'phone', 'date_of_birth', 'profile_photo_url', 'bio']

    def validate_phone(self, value):
        # Optional, but if provided must be a valid Pakistani mobile number.
        return validate_pk_mobile(value, required=False)


class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserAddress
        fields = ['id', 'street', 'city', 'state', 'country', 'postal_code', 'is_primary']
        read_only_fields = ['id']


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EmergencyContact
        fields = ['id', 'name', 'relationship', 'phone', 'email']
        read_only_fields = ['id']

    def validate_phone(self, value):
        return validate_pk_mobile(value, required=True)


class VetAppealSerializer(serializers.ModelSerializer):
    has_document = serializers.SerializerMethodField()

    class Meta:
        model  = VetAppeal
        fields = [
            'id', 'explanation', 'submitted_at', 'has_document',
            'needs_super_review', 'needs_shelter_review',
            'super_status', 'super_decided_at', 'super_reject_details', 'super_reject_anomalies',
            'shelter_status', 'shelter_decided_at', 'shelter_reject_details', 'shelter_reject_anomalies',
            'super_final_status', 'super_final_decided_at', 'super_final_details', 'super_final_anomalies',
        ]

    def get_has_document(self, obj):
        return bool(obj.document)


class VetProfileSerializer(serializers.ModelSerializer):
    is_fully_approved = serializers.BooleanField(read_only=True)
    is_rejected       = serializers.BooleanField(read_only=True)
    is_blocked        = serializers.BooleanField(read_only=True)
    can_appeal        = serializers.BooleanField(read_only=True)
    approval_stage    = serializers.CharField(read_only=True)
    target_shelter_name = serializers.SerializerMethodField()
    latest_appeal     = serializers.SerializerMethodField()

    class Meta:
        model  = VetProfile
        fields = [
            'license_number', 'practice_type',
            'clinic_name', 'clinic_location', 'clinic_registration_number',
            'target_shelter', 'target_shelter_name', 'requires_shelter_approval',
            'specializations', 'specialization',
            'lifecycle_status',
            'super_admin_status', 'super_admin_decided_at', 'super_admin_reason',
            'shelter_admin_status', 'shelter_admin_decided_at', 'shelter_admin_reason',
            'rejection_reason', 'blocked_reason',
            'appeal_deadline', 'appeals_used',
            'is_fully_approved', 'is_rejected', 'is_blocked', 'can_appeal',
            'approval_stage', 'latest_appeal',
        ]

    def get_target_shelter_name(self, obj):
        return obj.target_shelter.name if obj.target_shelter else None

    def get_latest_appeal(self, obj):
        appeal = obj.latest_appeal
        return VetAppealSerializer(appeal).data if appeal else None


class VetAppealSubmitSerializer(serializers.Serializer):
    explanation = serializers.CharField(min_length=20, max_length=5000)
    document    = serializers.FileField()

    def validate_document(self, value):
        name = (getattr(value, 'name', '') or '').lower()
        if not name.endswith('.pdf'):
            raise serializers.ValidationError('Only PDF documents are allowed.')
        content_type = getattr(value, 'content_type', '') or ''
        if content_type and content_type not in ('application/pdf', 'application/x-pdf'):
            raise serializers.ValidationError('Only PDF documents are allowed.')
        if value.size > MAX_APPEAL_DOC_MB * 1024 * 1024:
            raise serializers.ValidationError(f'Document must be {MAX_APPEAL_DOC_MB} MB or smaller.')
        return value


class UserDetailSerializer(serializers.ModelSerializer):
    profile             = UserProfileSerializer(read_only=True)
    addresses           = UserAddressSerializer(many=True, read_only=True)
    emergency_contacts  = EmergencyContactSerializer(many=True, read_only=True)
    assigned_shelter_id = serializers.SerializerMethodField()
    vet_profile         = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'email', 'role', 'is_email_verified', 'is_active',
                  'last_login_at', 'last_activity_at', 'created_at', 'profile', 'addresses',
                  'emergency_contacts', 'assigned_shelter_id', 'vet_profile']
        read_only_fields = ['id', 'email', 'role', 'is_email_verified', 'is_active',
                            'last_login_at', 'last_activity_at', 'created_at']

    def get_vet_profile(self, obj):
        if obj.role != 'VET':
            return None
        vp = getattr(obj, 'vet_profile', None)
        return VetProfileSerializer(vp).data if vp else None

    def get_assigned_shelter_id(self, obj):
        # For a shelter admin, the id of the active shelter they already manage
        # (so they can't be assigned to a second one). None for everyone else.
        if obj.role != 'SHELTER_ADMIN':
            return None
        from apps.shelters.models import Shelter
        shelter = Shelter.objects.filter(admin=obj, is_deleted=False).first()
        return str(shelter.id) if shelter else None


class UserSearchSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'email', 'role', 'profile']



class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(CamelCasePayloadMixin, serializers.Serializer):
    payload_key_map = {'newPassword': 'new_password'}

    token        = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        validate_auth_password(value)
        return value
