from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (User, UserProfile, UserAddress, EmergencyContact, EmailVerification,
                     PasswordReset, RefreshToken, VetProfile, VetAppeal,
                     BlacklistedVetRegistration)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'role', 'is_active', 'is_email_verified', 'created_at']
    list_filter = ['role', 'is_active', 'is_email_verified']
    search_fields = ['email']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Role & Status', {'fields': ('role', 'is_active', 'is_staff', 'is_email_verified', 'is_deleted')}),
        ('Permissions', {'fields': ('is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('last_login_at',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'first_name', 'last_name', 'phone']
    search_fields = ['first_name', 'last_name', 'user__email']


@admin.register(UserAddress)
class UserAddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'country', 'is_primary', 'is_deleted']
    list_filter = ['country', 'is_primary']


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'relationship', 'phone']
    search_fields = ['name', 'user__email']


@admin.register(EmailVerification)
class EmailVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used']


@admin.register(PasswordReset)
class PasswordResetAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'is_used', 'created_at']
    list_filter = ['is_used']


@admin.register(RefreshToken)
class RefreshTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'expires_at', 'is_revoked', 'last_used_at', 'created_at']
    list_filter = ['is_revoked']


@admin.register(VetProfile)
class VetProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'license_number', 'practice_type', 'lifecycle_status',
                    'super_admin_status', 'shelter_admin_status', 'requires_shelter_approval']
    list_filter = ['lifecycle_status', 'practice_type', 'requires_shelter_approval']
    search_fields = ['license_number', 'user__email']


@admin.register(VetAppeal)
class VetAppealAdmin(admin.ModelAdmin):
    list_display = ['vet_profile', 'submitted_at', 'super_status', 'shelter_status', 'super_final_status']
    list_filter = ['super_status', 'shelter_status', 'super_final_status']


@admin.register(BlacklistedVetRegistration)
class BlacklistedVetRegistrationAdmin(admin.ModelAdmin):
    list_display = ['registration_number', 'email', 'reason', 'created_at']
    list_filter = ['reason']
    search_fields = ['registration_number', 'email']
