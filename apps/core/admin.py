from django.contrib import admin
from .models import SystemConfig, LookupCategory, LookupValue


@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ['config_key', 'config_value', 'updated_at']
    search_fields = ['config_key']


@admin.register(LookupCategory)
class LookupCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']


@admin.register(LookupValue)
class LookupValueAdmin(admin.ModelAdmin):
    list_display = ['category', 'value', 'display_label', 'sort_order', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['value', 'display_label']
