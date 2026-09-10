import uuid
from django.db import models
from apps.accounts.models import User


class Shelter(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name                = models.CharField(max_length=200)
    registration_number = models.CharField(max_length=100, unique=True)
    street              = models.CharField(max_length=255, blank=True)
    city                = models.CharField(max_length=100)
    country             = models.CharField(max_length=100, default='Pakistan')
    latitude            = models.FloatField(null=True, blank=True)
    longitude           = models.FloatField(null=True, blank=True)
    phone               = models.CharField(max_length=20, blank=True)
    email               = models.EmailField(blank=True)
    website             = models.URLField(blank=True)
    capacity_total      = models.PositiveIntegerField()
    is_active           = models.BooleanField(default=True)
    admin               = models.ForeignKey(User, on_delete=models.SET_NULL, null=True,
                                            related_name='managed_shelter')
    logo_url            = models.URLField(blank=True)
    description         = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
    is_deleted          = models.BooleanField(default=False)

    class Meta:
        db_table = 'shelters'

    def __str__(self):
        return self.name

    @property
    def current_occupancy(self):
        return self.cats.filter(current_status='IN_SHELTER', is_deleted=False).count()


class ShelterStaff(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shelter         = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name='staff')
    user            = models.ForeignKey(User, on_delete=models.CASCADE)
    role_in_shelter = models.CharField(max_length=50, blank=True)
    joined_at       = models.DateTimeField(auto_now_add=True)
    is_active       = models.BooleanField(default=True)

    class Meta:
        db_table = 'shelter_staff'
        unique_together = ('shelter', 'user')


class IntakeRecord(models.Model):
    INTAKE_SOURCE_CHOICES = [
        ('RESCUE', 'Rescue'), ('SURRENDER', 'Surrender'), ('TRANSFER', 'Transfer'),
        ('STRAY_FOUND', 'Stray Found'), ('BORN_IN_SHELTER', 'Born in Shelter'),
    ]
    HEALTH_STATUS_CHOICES = [
        ('HEALTHY', 'Healthy'), ('SICK', 'Sick'), ('INJURED', 'Injured'), ('UNKNOWN', 'Unknown'),
    ]
    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cat                   = models.ForeignKey('cats.Cat', on_delete=models.CASCADE,
                                              related_name='intake_records')
    shelter               = models.ForeignKey(Shelter, on_delete=models.CASCADE)
    intake_date           = models.DateTimeField(auto_now_add=True)
    intake_source         = models.CharField(max_length=30, choices=INTAKE_SOURCE_CHOICES)
    initial_health_status = models.CharField(max_length=20, choices=HEALTH_STATUS_CHOICES,
                                              default='UNKNOWN')
    quarantine_required   = models.BooleanField(default=False)
    quarantine_until      = models.DateField(null=True, blank=True)
    housing_assignment    = models.CharField(max_length=200, blank=True)
    intake_notes          = models.TextField(blank=True)
    surrenderer_name      = models.CharField(max_length=100, blank=True, default='')
    surrenderer_phone     = models.CharField(max_length=20, blank=True, default='')
    processed_by          = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'intake_records'


class DischargeRecord(models.Model):
    DISCHARGE_TYPE_CHOICES = [
        ('ADOPTED', 'Adopted'), ('TRANSFERRED', 'Transferred'), ('FOSTERED', 'Fostered'),
        ('EUTHANIZED', 'Euthanized'), ('RETURNED_TO_OWNER', 'Returned to Owner'), ('DECEASED', 'Deceased'),
        ('ESCAPED', 'Escaped'), ('OTHER', 'Other'),
    ]
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cat                 = models.ForeignKey('cats.Cat', on_delete=models.CASCADE)
    shelter             = models.ForeignKey(Shelter, on_delete=models.CASCADE)
    discharge_date      = models.DateTimeField(auto_now_add=True)
    discharge_type      = models.CharField(max_length=30, choices=DISCHARGE_TYPE_CHOICES)
    destination_shelter = models.ForeignKey(Shelter, null=True, blank=True,
                                            on_delete=models.SET_NULL,
                                            related_name='incoming_transfers')
    processed_by        = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes               = models.TextField(blank=True)
    recipient_name      = models.CharField(max_length=100, blank=True, default='')
    recipient_phone     = models.CharField(max_length=20, blank=True, default='')

    class Meta:
        db_table = 'discharge_records'
