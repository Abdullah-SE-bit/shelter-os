from django.contrib import admin
from .models import VolunteerProfile, VolunteerSkill, VolunteerAvailability


@admin.register(VolunteerProfile)
class VolunteerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'shelter', 'is_active', 'total_rescues_completed', 'service_radius_km']
    list_filter = ['is_active', 'shelter']
    search_fields = ['user__email']


@admin.register(VolunteerSkill)
class VolunteerSkillAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'skill']
    list_filter = ['skill']


@admin.register(VolunteerAvailability)
class VolunteerAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'day_of_week', 'start_time', 'end_time']
