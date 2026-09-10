from django.contrib import admin
from .models import RescueReport, RescueAssignment


@admin.register(RescueReport)
class RescueReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'reporter', 'urgency_level', 'status', 'reported_at']
    list_filter = ['urgency_level', 'status']
    search_fields = ['description']


@admin.register(RescueAssignment)
class RescueAssignmentAdmin(admin.ModelAdmin):
    list_display = ['rescue_report', 'volunteer', 'status', 'assigned_at']
    list_filter = ['status']
