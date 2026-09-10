import uuid
from django.db import models
from apps.accounts.models import User


class RescueReport(models.Model):
    URGENCY_CHOICES = [('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')]
    STATUS_CHOICES  = [
        ('PENDING', 'Pending'), ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'), ('RESOLVED', 'Resolved'), ('CANCELLED', 'Cancelled'),
    ]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rescue_reports')
    description         = models.TextField()
    latitude            = models.FloatField()
    longitude           = models.FloatField()
    urgency_level       = models.CharField(max_length=10, choices=URGENCY_CHOICES)
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    photos              = models.JSONField(default=list)
    cat_condition_notes = models.TextField(blank=True)
    reported_at         = models.DateTimeField(auto_now_add=True)
    assigned_volunteer  = models.ForeignKey(User, null=True, blank=True,
                                            on_delete=models.SET_NULL,
                                            related_name='assigned_rescues')
    assigned_shelter    = models.ForeignKey('shelters.Shelter', null=True, blank=True,
                                            on_delete=models.SET_NULL)
    resolved_at         = models.DateTimeField(null=True, blank=True)
    resolution_notes    = models.TextField(blank=True)
    linked_cat          = models.ForeignKey('cats.Cat', null=True, blank=True,
                                            on_delete=models.SET_NULL)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
    is_deleted          = models.BooleanField(default=False)

    class Meta:
        db_table = 'rescue_reports'

    def __str__(self):
        return f"Rescue {self.id} - {self.urgency_level}"


class RescueAssignment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'), ('ACCEPTED', 'Accepted'),
        ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed'), ('DECLINED', 'Declined'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rescue_report = models.ForeignKey(RescueReport, on_delete=models.CASCADE,
                                      related_name='assignments')
    volunteer     = models.ForeignKey('volunteers.VolunteerProfile', on_delete=models.CASCADE)
    assigned_at   = models.DateTimeField(auto_now_add=True)
    accepted_at   = models.DateTimeField(null=True, blank=True)
    completed_at  = models.DateTimeField(null=True, blank=True)
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    notes         = models.TextField(blank=True)

    class Meta:
        db_table = 'rescue_assignments'
