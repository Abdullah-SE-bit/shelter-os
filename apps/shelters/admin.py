from django.contrib import admin
from .models import Shelter, ShelterStaff, IntakeRecord, DischargeRecord


@admin.register(Shelter)
class ShelterAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'capacity_total', 'is_active', 'admin']
    list_filter = ['is_active', 'country']
    search_fields = ['name', 'registration_number']


@admin.register(ShelterStaff)
class ShelterStaffAdmin(admin.ModelAdmin):
    list_display = ['shelter', 'user', 'role_in_shelter', 'is_active']
    list_filter = ['shelter', 'is_active']


@admin.register(IntakeRecord)
class IntakeRecordAdmin(admin.ModelAdmin):
    list_display = ['cat', 'shelter', 'intake_source', 'initial_health_status', 'intake_date']
    list_filter = ['intake_source', 'initial_health_status']


@admin.register(DischargeRecord)
class DischargeRecordAdmin(admin.ModelAdmin):
    list_display = ['cat', 'shelter', 'discharge_type', 'discharge_date']
    list_filter = ['discharge_type']
