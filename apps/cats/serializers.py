from rest_framework import serializers
from .models import Cat, CatPhoto


class CatPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CatPhoto
        fields = ['id', 'photo_url', 'is_primary', 'uploaded_at']


class CatSerializer(serializers.ModelSerializer):
    photos      = CatPhotoSerializer(many=True, read_only=True)
    breed_label = serializers.CharField(source='breed.display_label', read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    owner_name   = serializers.SerializerMethodField()

    class Meta:
        model  = Cat
        fields = [
            'id', 'name', 'breed', 'breed_label', 'gender', 'age_years',
            'age_months', 'color', 'pattern', 'is_microchipped', 'microchip_id',
            'current_status', 'shelter', 'shelter_name', 'owner', 'owner_name',
            'intake_date', 'is_neutered', 'is_vaccinated_core',
            'primary_photo_url', 'behavioral_notes', 'adoption_fee', 'adoption_requirements',
            'photos', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'breed_label', 'shelter_name', 'owner_name',
                            'current_status']

    def get_owner_name(self, obj):
        if obj.owner and hasattr(obj.owner, 'profile'):
            p = obj.owner.profile
            return f"{p.first_name} {p.last_name}"
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['photos'] = CatPhotoSerializer(instance.photos.filter(is_deleted=False), many=True).data
        return data

    def validate_microchip_id(self, value):
        if value:
            # Real pet microchips follow the ISO 11784/11785 (FDX-B) standard:
            # exactly 15 decimal digits. This is the format used on the market
            # today and the format the system generates for shelter cats.
            import re
            if not re.fullmatch(r'\d{15}', value):
                raise serializers.ValidationError(
                    "Microchip ID must be a 15-digit ISO 11784/11785 number.")
            qs = Cat.objects.filter(microchip_id=value, is_deleted=False)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError("MICROCHIP_ID_ALREADY_REGISTERED")
        return value

    def validate(self, attrs):
        is_microchipped = attrs.get('is_microchipped', getattr(self.instance, 'is_microchipped', False))
        microchip_id = attrs.get('microchip_id', getattr(self.instance, 'microchip_id', None))
        if is_microchipped and not microchip_id:
            raise serializers.ValidationError({'microchip_id': 'This field is required when is_microchipped is true.'})
        return attrs


class CatSummarySerializer(serializers.ModelSerializer):
    breed_label  = serializers.CharField(source='breed.display_label', read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    owner_name   = serializers.SerializerMethodField()

    class Meta:
        model  = Cat
        fields = [
            'id', 'name', 'breed_label', 'gender', 'age_years', 'age_months',
            'current_status', 'primary_photo_url', 'shelter_name', 'owner_name',
            'is_vaccinated_core',
        ]

    def get_owner_name(self, obj):
        """Display name for individually-owned cats (no shelter).

        Shown on cat cards in the place where the shelter name appears for
        shelter cats.
        """
        if obj.owner and hasattr(obj.owner, 'profile') and obj.owner.profile:
            p = obj.owner.profile
            return f"{p.first_name} {p.last_name}".strip() or None
        return None


class CatAdminSummarySerializer(serializers.ModelSerializer):
    """C6: super-admin cat listing that also exposes owner details.

    Kept separate from CatSummarySerializer so the public/limited DTO does not
    leak owner contact info.
    """
    breed_label   = serializers.CharField(source='breed.display_label', read_only=True)
    shelter_name  = serializers.CharField(source='shelter.name', read_only=True)
    owner_name    = serializers.SerializerMethodField()
    owner_email   = serializers.CharField(source='owner.email', read_only=True)
    owner_phone   = serializers.SerializerMethodField()

    class Meta:
        model  = Cat
        fields = [
            'id', 'name', 'breed_label', 'gender', 'age_years', 'age_months',
            'current_status', 'primary_photo_url', 'shelter_name', 'is_vaccinated_core',
            'owner', 'owner_name', 'owner_email', 'owner_phone',
        ]

    def get_owner_name(self, obj):
        if obj.owner and hasattr(obj.owner, 'profile') and obj.owner.profile:
            p = obj.owner.profile
            return f"{p.first_name} {p.last_name}".strip()
        return None

    def get_owner_phone(self, obj):
        if obj.owner and hasattr(obj.owner, 'profile') and obj.owner.profile:
            return obj.owner.profile.phone or None
        return None
