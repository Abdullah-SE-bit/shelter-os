from django.contrib import admin
from .models import Cat, CatPhoto


@admin.register(Cat)
class CatAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender', 'current_status', 'shelter', 'owner', 'is_deleted']
    list_filter = ['current_status', 'gender', 'is_neutered', 'is_vaccinated_core']
    search_fields = ['name', 'microchip_id']


@admin.register(CatPhoto)
class CatPhotoAdmin(admin.ModelAdmin):
    list_display = ['cat', 'is_primary', 'uploaded_at', 'is_deleted']
