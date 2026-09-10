import uuid
from django.db import models
from apps.accounts.models import User


class Cat(models.Model):
    STATUS_CHOICES = [
        ('UNKNOWN', 'Unknown'), ('IN_SHELTER', 'In Shelter'),
        ('FOSTERED', 'Fostered'), ('ADOPTED', 'Adopted'),
        ('LOST', 'Lost'), ('DECEASED', 'Deceased'),
    ]
    GENDER_CHOICES = [('MALE', 'Male'), ('FEMALE', 'Female'), ('UNKNOWN', 'Unknown')]

    id                 = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name               = models.CharField(max_length=100, blank=True)
    breed              = models.ForeignKey('core.LookupValue', null=True, blank=True,
                                           on_delete=models.SET_NULL, related_name='cats')
    gender             = models.CharField(max_length=10, choices=GENDER_CHOICES, default='UNKNOWN')
    age_years          = models.PositiveIntegerField(default=0)
    age_months         = models.PositiveIntegerField(default=0)
    color              = models.CharField(max_length=100, blank=True)
    pattern            = models.CharField(max_length=100, blank=True)
    is_microchipped    = models.BooleanField(default=False)
    microchip_id       = models.CharField(max_length=50, blank=True, unique=True, null=True)
    current_status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UNKNOWN')
    shelter            = models.ForeignKey('shelters.Shelter', null=True, blank=True,
                                           on_delete=models.SET_NULL, related_name='cats')
    owner              = models.ForeignKey(User, null=True, blank=True,
                                           on_delete=models.SET_NULL, related_name='owned_cats')
    intake_date        = models.DateField(null=True, blank=True)
    is_neutered        = models.BooleanField(default=False)
    is_vaccinated_core = models.BooleanField(default=False)
    primary_photo_url  = models.URLField(blank=True)
    behavioral_notes   = models.TextField(blank=True)
    adoption_fee          = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    adoption_requirements = models.TextField(blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)
    created_by         = models.ForeignKey(User, null=True, on_delete=models.SET_NULL,
                                           related_name='created_cats')
    is_deleted         = models.BooleanField(default=False)

    class Meta:
        db_table = 'cats'

    def __str__(self):
        return self.name or str(self.id)


class CatPhoto(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cat         = models.ForeignKey(Cat, on_delete=models.CASCADE, related_name='photos')
    photo       = models.ImageField(upload_to='cats/')
    photo_url   = models.URLField(blank=True)
    is_primary  = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, null=True, on_delete=models.SET_NULL)
    is_deleted  = models.BooleanField(default=False)

    class Meta:
        db_table = 'cat_photos'
