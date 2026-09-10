from rest_framework import serializers
from .models import Notification, FCMToken, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'category', 'title', 'body', 'is_read',
            'sent_at', 'read_at', 'reference_type', 'reference_id',
        ]


class FCMTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCMToken
        fields = ['id', 'device_type', 'token', 'last_updated']


class PreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['id', 'category', 'email_enabled', 'push_enabled', 'in_app_enabled']
