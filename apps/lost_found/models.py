import uuid
from django.db import models
from django.utils import timezone
from apps.accounts.models import User


class LostCatAlert(models.Model):
    STATUS_CHOICES = [('ACTIVE', 'Active'), ('RESOLVED', 'Resolved'), ('EXPIRED', 'Expired')]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cat                 = models.ForeignKey('cats.Cat', null=True, blank=True, on_delete=models.SET_NULL)
    reporter            = models.ForeignKey(User, on_delete=models.CASCADE)
    title               = models.CharField(max_length=200)
    description         = models.TextField()
    last_seen_at        = models.DateTimeField(null=True, blank=True)
    last_seen_latitude  = models.FloatField(null=True, blank=True)
    last_seen_longitude = models.FloatField(null=True, blank=True)
    photos              = models.JSONField(default=list)
    behavioral_notes    = models.TextField(blank=True)
    contact_phone       = models.CharField(max_length=20, blank=True)
    contact_email       = models.EmailField(blank=True)
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    resolved_at         = models.DateTimeField(null=True, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
    is_deleted          = models.BooleanField(default=False)

    class Meta:
        db_table = 'lost_cat_alerts'

    def __str__(self):
        return self.title


class FoundCatReport(models.Model):
    STATUS_CHOICES = [
        ('OPEN', 'Open'),           # awaiting a match or shelter intake
        ('MATCHED', 'Matched'),     # a candidate lost alert was confirmed/linked
        ('REUNITED', 'Reunited'),   # returned to the lost cat's owner
        ('SHELTERED', 'Sheltered'), # taken in by a shelter
        ('CLOSED', 'Closed'),
    ]

    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter        = models.ForeignKey(User, on_delete=models.CASCADE)
    description     = models.TextField()
    found_at        = models.DateTimeField(default=timezone.now)
    found_latitude  = models.FloatField(null=True, blank=True)
    found_longitude = models.FloatField(null=True, blank=True)
    photos          = models.JSONField(default=list)
    color_tags      = models.JSONField(default=list)
    breed_guess     = models.CharField(max_length=100, blank=True)
    contact_phone   = models.CharField(max_length=20, blank=True)
    contact_email   = models.EmailField(blank=True)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    # Set when a shelter takes the cat in.
    shelter         = models.ForeignKey('shelters.Shelter', null=True, blank=True,
                                        on_delete=models.SET_NULL, related_name='found_intakes')
    # The Cat record created on shelter intake, or the reunited lost cat.
    resolved_cat    = models.ForeignKey('cats.Cat', null=True, blank=True,
                                        on_delete=models.SET_NULL, related_name='found_reports')
    created_at      = models.DateTimeField(auto_now_add=True)
    is_deleted      = models.BooleanField(default=False)

    class Meta:
        db_table = 'found_cat_reports'


class MatchResult(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'), ('CONFIRMED', 'Confirmed'),
        ('REJECTED', 'Rejected'), ('CLOSED', 'Closed'),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lost_alert   = models.ForeignKey(LostCatAlert, on_delete=models.CASCADE, related_name='matches')
    found_report = models.ForeignKey(FoundCatReport, on_delete=models.CASCADE)
    score        = models.FloatField()
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    matched_at   = models.DateTimeField(auto_now_add=True)
    confirmed_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        db_table = 'match_results'
        unique_together = ('lost_alert', 'found_report')
