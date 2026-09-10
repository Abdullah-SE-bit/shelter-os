from rest_framework import serializers
from .models import AdoptionListing, AdoptionApplication, AdoptionRecord


class AdoptionListingSerializer(serializers.ModelSerializer):
    cat_name = serializers.CharField(source='cat.name', read_only=True)
    cat_photo = serializers.CharField(source='cat.primary_photo_url', read_only=True)
    name = serializers.CharField(source='cat.name', read_only=True)
    primary_photo_url = serializers.CharField(source='cat.primary_photo_url', read_only=True)
    description = serializers.CharField(source='cat.behavioral_notes', read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    breed_label = serializers.CharField(source='cat.breed.display_label', read_only=True, default='')
    gender = serializers.CharField(source='cat.gender', read_only=True)
    age_years = serializers.IntegerField(source='cat.age_years', read_only=True)
    age_months = serializers.IntegerField(source='cat.age_months', read_only=True)
    is_neutered = serializers.BooleanField(source='cat.is_neutered', read_only=True)
    is_vaccinated_core = serializers.BooleanField(source='cat.is_vaccinated_core', read_only=True)
    adoption_requirements = serializers.CharField(source='cat.adoption_requirements', read_only=True, default='')
    color = serializers.CharField(source='cat.color', read_only=True, default='')
    photos = serializers.SerializerMethodField()

    def get_photos(self, obj):
        urls = [p.photo_url for p in obj.cat.photos.filter(is_deleted=False) if p.photo_url]
        if obj.cat.primary_photo_url and obj.cat.primary_photo_url not in urls:
            urls.insert(0, obj.cat.primary_photo_url)
        return urls

    class Meta:
        model = AdoptionListing
        fields = [
            'id', 'cat', 'cat_name', 'cat_photo', 'name', 'primary_photo_url', 'description', 'photos',
            'shelter', 'shelter_name', 'breed_label', 'gender', 'age_years', 'age_months', 'color',
            'is_neutered', 'is_vaccinated_core', 'adoption_requirements',
            'is_active', 'adoption_fee', 'posted_at', 'expires_at', 'views_count',
        ]


class ApplicationSerializer(serializers.ModelSerializer):
    cat_name = serializers.CharField(source='cat.name', read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    applicant_email = serializers.CharField(source='applicant.email', read_only=True)
    applicant_name = serializers.SerializerMethodField()

    class Meta:
        model = AdoptionApplication
        fields = [
            'id', 'cat', 'cat_name', 'applicant', 'applicant_email', 'applicant_name',
            'shelter', 'shelter_name', 'status', 'submitted_at',
            'rejection_reason', 'created_at', 'updated_at',
        ]

    def get_applicant_name(self, obj):
        profile = getattr(obj.applicant, 'profile', None)
        if profile:
            name = f"{profile.first_name} {profile.last_name}".strip()
            if name:
                return name
        return obj.applicant.email if obj.applicant else None


class AdoptionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdoptionRecord
        fields = [
            'id', 'cat', 'adopter', 'shelter', 'adoption_date',
            'adoption_fee_paid', 'follow_up_date',
        ]
