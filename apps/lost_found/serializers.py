from rest_framework import serializers
from .models import LostCatAlert, FoundCatReport, MatchResult
from apps.core.phone import validate_pk_mobile


class LostCatAlertSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()
    cat_name = serializers.CharField(source='cat.name', read_only=True, default=None)
    match_count = serializers.SerializerMethodField()

    class Meta:
        model = LostCatAlert
        fields = [
            'id', 'cat', 'cat_name', 'reporter', 'reporter_name',
            'title', 'description', 'last_seen_at',
            'last_seen_latitude', 'last_seen_longitude',
            'photos', 'behavioral_notes', 'contact_phone', 'contact_email',
            'status', 'resolved_at', 'created_at', 'match_count',
        ]
        read_only_fields = ['id', 'reporter', 'created_at', 'photos']

    def get_match_count(self, obj):
        # J1: surface how many candidate matches are pending for this alert.
        return obj.matches.filter(status='PENDING').count()

    def get_reporter_name(self, obj):
        if obj.reporter and hasattr(obj.reporter, 'profile'):
            profile = obj.reporter.profile
            return f"{profile.first_name} {profile.last_name}"
        return None

    def validate_contact_phone(self, value):
        # Optional, but if provided must be a valid Pakistani mobile number.
        return validate_pk_mobile(value, required=False)

    def validate_contact_email(self, value):
        import re
        if value:
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', value):
                raise serializers.ValidationError("Invalid email address.")
        return value


class FoundCatReportSerializer(serializers.ModelSerializer):
    color = serializers.CharField(write_only=True, required=False)
    reporter_name = serializers.SerializerMethodField()
    shelter_name = serializers.CharField(source='shelter.name', read_only=True, default=None)
    match_count = serializers.SerializerMethodField()

    class Meta:
        model = FoundCatReport
        fields = [
            'id', 'reporter', 'reporter_name', 'description', 'found_at',
            'found_latitude', 'found_longitude',
            'photos', 'color_tags', 'breed_guess', 'status', 'created_at',
            'color', 'contact_phone', 'contact_email',
            'shelter', 'shelter_name', 'resolved_cat', 'match_count',
        ]
        read_only_fields = ['id', 'reporter', 'created_at', 'status', 'shelter', 'resolved_cat', 'photos']

    def create(self, validated_data):
        color = validated_data.pop('color', None)
        if color:
            validated_data['color_tags'] = [color]
        return super().create(validated_data)

    def get_reporter_name(self, obj):
        profile = getattr(obj.reporter, 'profile', None)
        if profile:
            name = f"{profile.first_name} {profile.last_name}".strip()
            if name:
                return name
        return obj.reporter.email if obj.reporter else None

    def get_match_count(self, obj):
        return MatchResult.objects.filter(found_report=obj, status='PENDING').count()

    def validate_contact_phone(self, value):
        # Optional, but if provided must be a valid Pakistani mobile number.
        return validate_pk_mobile(value, required=False)

    def validate_contact_email(self, value):
        import re
        if value:
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', value):
                raise serializers.ValidationError("Invalid email address.")
        return value


class MatchResultSerializer(serializers.ModelSerializer):
    lost_alert = LostCatAlertSerializer(read_only=True)
    found_report = FoundCatReportSerializer(read_only=True)
    score_pct = serializers.SerializerMethodField()

    class Meta:
        model = MatchResult
        fields = ['id', 'lost_alert', 'found_report', 'score', 'score_pct',
                  'status', 'matched_at', 'confirmed_by']

    def get_score_pct(self, obj):
        return round((obj.score or 0) * 100)

