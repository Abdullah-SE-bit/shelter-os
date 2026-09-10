import uuid
from django.db import models
from apps.accounts.models import User


class Notification(models.Model):
	TYPE_CHOICES = [('IN_APP', 'In App'), ('EMAIL', 'Email'), ('PUSH', 'Push')]
	CATEGORY_CHOICES = [
		('RESCUE', 'Rescue'),
		('ADOPTION', 'Adoption'),
		('MEDICAL', 'Medical'),
		('VACCINATION', 'Vaccination'),
		('SYSTEM', 'System'),
		('MESSAGING', 'Messaging'),
		('DONATION', 'Donation'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
	type = models.CharField(max_length=10, choices=TYPE_CHOICES)
	category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
	title = models.CharField(max_length=200)
	body = models.TextField()
	is_read = models.BooleanField(default=False)
	sent_at = models.DateTimeField(auto_now_add=True)
	read_at = models.DateTimeField(null=True, blank=True)
	reference_type = models.CharField(max_length=50, blank=True)
	reference_id = models.UUIDField(null=True, blank=True)

	class Meta:
		db_table = 'notifications'
		ordering = ['-sent_at']


class FCMToken(models.Model):
	DEVICE_CHOICES = [('ANDROID', 'Android'), ('IOS', 'iOS'), ('WEB', 'Web')]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='fcm_tokens')
	token = models.TextField()
	device_type = models.CharField(max_length=10, choices=DEVICE_CHOICES)
	last_updated = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = 'fcm_tokens'
		unique_together = ('user', 'device_type')


class NotificationPreference(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	category = models.CharField(max_length=20)
	email_enabled = models.BooleanField(default=True)
	push_enabled = models.BooleanField(default=True)
	in_app_enabled = models.BooleanField(default=True)

	class Meta:
		db_table = 'notification_preferences'
		unique_together = ('user', 'category')
