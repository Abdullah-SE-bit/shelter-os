import uuid
from django.db import models
from apps.accounts.models import User

SKILL_CHOICES = [
    ('RESCUE', 'Rescue'), ('TRANSPORT', 'Transport'), ('FOSTERING', 'Fostering'),
    ('FUNDRAISING', 'Fundraising'), ('MEDICAL_ASSIST', 'Medical Assist'), ('EVENT_SUPPORT', 'Event Support'),
]


class VolunteerProfile(models.Model):
    id                      = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user                    = models.OneToOneField(User, on_delete=models.CASCADE, related_name='volunteer_profile')
    shelter                 = models.ForeignKey('shelters.Shelter', null=True, blank=True, on_delete=models.SET_NULL)
    bio                     = models.TextField(blank=True)
    service_radius_km       = models.PositiveIntegerField(default=10)
    last_known_latitude     = models.FloatField(null=True, blank=True)
    last_known_longitude    = models.FloatField(null=True, blank=True)
    is_active               = models.BooleanField(default=True)
    total_rescues_completed = models.PositiveIntegerField(default=0)
    created_at              = models.DateTimeField(auto_now_add=True)
    updated_at              = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer_profiles'

    def __str__(self):
        return f"Volunteer: {self.user.email}"

    @property
    def is_available_now(self):
        """A volunteer is available right now if the current weekday/time falls
        inside one of their availability windows. A volunteer who hasn't set any
        schedule is treated as generally available."""
        from django.utils import timezone
        windows = list(self.availability.all())
        if not windows:
            return True
        now = timezone.localtime()
        weekday, current = now.weekday(), now.time()
        return any(
            w.day_of_week == weekday and w.start_time <= current <= w.end_time
            for w in windows
        )


class VolunteerSkill(models.Model):
    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE, related_name='skills')
    skill     = models.CharField(max_length=50, choices=SKILL_CHOICES)

    class Meta:
        db_table      = 'volunteer_skills'
        unique_together = ('volunteer', 'skill')


class VolunteerAvailability(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer   = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.IntegerField()  # 0=Monday, 6=Sunday
    start_time  = models.TimeField()
    end_time    = models.TimeField()

    class Meta:
        db_table = 'volunteer_availability'


class ShelterChangeRequest(models.Model):
    """F1: a volunteer's request to move to a different shelter, approved by a
    shelter admin. Volunteers cannot self-reassign; only an approved request
    updates VolunteerProfile.shelter."""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    volunteer    = models.ForeignKey(VolunteerProfile, on_delete=models.CASCADE,
                                     related_name='shelter_change_requests')
    from_shelter = models.ForeignKey('shelters.Shelter', null=True, blank=True,
                                     on_delete=models.SET_NULL, related_name='outgoing_change_requests')
    to_shelter   = models.ForeignKey('shelters.Shelter', on_delete=models.CASCADE,
                                     related_name='incoming_change_requests')
    status       = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reason       = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    decided_by   = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL,
                                     related_name='decided_shelter_change_requests')
    decided_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'shelter_change_requests'
        ordering = ['-requested_at']
