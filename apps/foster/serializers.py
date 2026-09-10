from rest_framework import serializers
from .models import FosterProfile, FosterPlacement


class FosterProfileSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = FosterProfile
        fields = [
            'id', 'user', 'user_name', 'shelter', 'max_capacity', 'current_capacity',
            'preferred_ages', 'can_handle_medical', 'can_handle_kittens',
            'is_available', 'address', 'created_at',
        ]

    def get_user_name(self, obj):
        if hasattr(obj.user, 'profile'):
            return f"{obj.user.profile.first_name} {obj.user.profile.last_name}"
        return obj.user.email


class FosterPlacementSerializer(serializers.ModelSerializer):
    cat_name = serializers.CharField(source='cat.name', read_only=True, default='')
    foster_name = serializers.SerializerMethodField()

    class Meta:
        model = FosterPlacement
        fields = [
            'id', 'cat', 'cat_name', 'foster', 'foster_name', 'shelter',
            'placed_at', 'expected_return_at', 'actual_return_at',
            'outcome', 'check_in_notes',
        ]

    def get_foster_name(self, obj):
        if hasattr(obj.foster.user, 'profile'):
            profile = obj.foster.user.profile
            return f"{profile.first_name} {profile.last_name}"
        return obj.foster.user.email
