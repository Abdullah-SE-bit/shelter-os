from rest_framework import serializers
from .models import SystemConfig, LookupCategory, LookupValue


class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ['id', 'config_key', 'config_value', 'description', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class LookupValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = LookupValue
        fields = ['id', 'value', 'display_label', 'sort_order', 'metadata']


class LookupCategorySerializer(serializers.ModelSerializer):
    values = LookupValueSerializer(many=True, read_only=True)

    class Meta:
        model = LookupCategory
        fields = ['id', 'name', 'description', 'values']
