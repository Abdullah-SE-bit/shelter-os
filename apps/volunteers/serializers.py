from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers
from .models import VolunteerProfile, VolunteerSkill, VolunteerAvailability, ShelterChangeRequest

# A volunteer is considered "online" if their account recorded activity within
# this window. last_activity_at is stamped on every authenticated request
# (throttled) by apps.core.authentication.JWTAuthenticationWithBlacklist.
VOLUNTEER_ONLINE_WINDOW = timedelta(minutes=5)


class VolunteerSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerSkill
        fields = ['id', 'skill']
        read_only_fields = ['id']


class VolunteerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerAvailability
        fields = ['id', 'day_of_week', 'start_time', 'end_time']
        read_only_fields = ['id']


class VolunteerProfileSerializer(serializers.ModelSerializer):
    skills       = serializers.SerializerMethodField()
    availability = VolunteerAvailabilitySerializer(many=True, read_only=True)
    user_email   = serializers.CharField(source='user.email', read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    first_name   = serializers.SerializerMethodField()
    last_name    = serializers.SerializerMethodField()
    profile_photo = serializers.SerializerMethodField()
    city         = serializers.SerializerMethodField()
    is_available_now = serializers.SerializerMethodField()
    is_online        = serializers.SerializerMethodField()
    last_activity_at = serializers.DateTimeField(source='user.last_activity_at', read_only=True)

    class Meta:
        model = VolunteerProfile
        fields = [
            'id', 'user', 'user_email', 'shelter', 'shelter_name', 'bio', 'service_radius_km',
            'last_known_latitude', 'last_known_longitude', 'is_active', 'is_available_now',
            'is_online', 'last_activity_at',
            'total_rescues_completed', 'skills', 'availability', 'created_at',
            'first_name', 'last_name', 'profile_photo', 'city',
        ]
        read_only_fields = ['id', 'user', 'total_rescues_completed', 'created_at']

    def get_skills(self, obj):
        return [s.skill for s in obj.skills.all()]

    def get_is_available_now(self, obj):
        return obj.is_available_now

    def get_is_online(self, obj):
        """Real login presence: True if the volunteer's account has recorded
        activity within the online window (i.e. they are actually logged in and
        using the app), independent of their weekly availability schedule."""
        last_activity = getattr(obj.user, 'last_activity_at', None)
        if not last_activity:
            return False
        return (timezone.now() - last_activity) <= VOLUNTEER_ONLINE_WINDOW

    def get_first_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.first_name if profile else ""

    def get_last_name(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.last_name if profile else ""

    def get_profile_photo(self, obj):
        profile = getattr(obj.user, 'profile', None)
        return profile.profile_photo_url if profile else ""

    def get_city(self, obj):
        addr = obj.user.addresses.filter(is_primary=True, is_deleted=False).first()
        if addr:
            return addr.city
        return ""


class VolunteerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerProfile
        fields = ['bio', 'service_radius_km', 'last_known_latitude', 'last_known_longitude', 'is_active']


class ShelterChangeRequestSerializer(serializers.ModelSerializer):
    volunteer_name    = serializers.SerializerMethodField()
    from_shelter_name = serializers.CharField(source='from_shelter.name', read_only=True)
    to_shelter_name   = serializers.CharField(source='to_shelter.name', read_only=True)

    class Meta:
        model = ShelterChangeRequest
        fields = [
            'id', 'volunteer', 'volunteer_name', 'from_shelter', 'from_shelter_name',
            'to_shelter', 'to_shelter_name', 'status', 'reason', 'requested_at', 'decided_at',
        ]
        read_only_fields = ['id', 'volunteer', 'from_shelter', 'status', 'requested_at', 'decided_at']

    def get_volunteer_name(self, obj):
        profile = getattr(obj.volunteer.user, 'profile', None)
        if profile:
            return f"{profile.first_name} {profile.last_name}".strip()
        return obj.volunteer.user.email
