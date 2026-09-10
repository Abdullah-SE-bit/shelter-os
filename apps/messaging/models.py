import uuid
from django.db import models
from apps.accounts.models import User


class Conversation(models.Model):
	CONTEXT_CHOICES = [
		('SHELTER_VOLUNTEER', 'Shelter-Volunteer'),
		('SHELTER_ADOPTER', 'Shelter-Adopter'),
		('VET_OWNER', 'Vet-Owner'),
		('GENERAL', 'General'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	participant_ids = models.JSONField(default=list)
	context_type = models.CharField(max_length=30, choices=CONTEXT_CHOICES)
	context_id = models.UUIDField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	last_message_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'conversations'


class Message(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
	sender = models.ForeignKey(User, on_delete=models.CASCADE)
	body = models.TextField()
	sent_at = models.DateTimeField(auto_now_add=True)
	is_read = models.BooleanField(default=False)
	attachments = models.JSONField(default=list)

	class Meta:
		db_table = 'messages'
		ordering = ['sent_at']
