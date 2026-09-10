from rest_framework import serializers
from .models import RescueReport, RescueAssignment


class RescueReportSerializer(serializers.ModelSerializer):
    reporter_email          = serializers.CharField(source='reporter.email', read_only=True)
    reporter_name           = serializers.SerializerMethodField()
    assigned_volunteer_name = serializers.SerializerMethodField()
    assigned_shelter_name   = serializers.CharField(source='assigned_shelter.name', read_only=True)

    class Meta:
        model = RescueReport
        fields = [
            'id', 'reporter', 'reporter_email', 'reporter_name', 'description',
            'latitude', 'longitude', 'urgency_level', 'status', 'photos',
            'cat_condition_notes', 'reported_at', 'assigned_volunteer',
            'assigned_volunteer_name', 'assigned_shelter', 'assigned_shelter_name',
            'resolved_at', 'resolution_notes', 'linked_cat', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'reporter', 'reported_at', 'created_at', 'updated_at']

    def _display_name(self, user):
        if not user:
            return None
        profile = getattr(user, 'profile', None)
        if profile:
            name = f"{profile.first_name} {profile.last_name}".strip()
            if name:
                return name
        return user.email

    def get_reporter_name(self, obj):
        # D1: surface the reporter's display name, not just the UUID/email.
        return self._display_name(obj.reporter)

    def get_assigned_volunteer_name(self, obj):
        return self._display_name(obj.assigned_volunteer)


class RescueAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RescueAssignment
        fields = [
            'id', 'rescue_report', 'volunteer', 'assigned_at',
            'accepted_at', 'completed_at', 'status', 'notes',
        ]
        read_only_fields = ['id', 'assigned_at', 'accepted_at', 'completed_at']
