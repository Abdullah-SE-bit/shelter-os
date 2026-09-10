import uuid
from django.db import models
from apps.accounts.models import User


class AuditLog(models.Model):
	ACTION_CHOICES = [
		('LOGIN', 'Login'),
		('LOGOUT', 'Logout'),
		('CREATE', 'Create'),
		('UPDATE', 'Update'),
		('DELETE', 'Delete'),
		('VIEW_SENSITIVE', 'View Sensitive'),
		('EXPORT', 'Export'),
		('ROLE_CHANGE', 'Role Change'),
		('USER_DEACTIVATED', 'User Deactivated'),
		('USER_ACTIVATED', 'User Activated'),
		('CAMPAIGN_COMPLETED', 'Campaign Complete'),
		('CAMPAIGN_INCOMPLETE', 'Campaign Not Complete'),
		('FAILED', 'Failed'),
	]

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
	actor_role = models.CharField(max_length=20, blank=True)
	action = models.CharField(max_length=30, choices=ACTION_CHOICES)
	entity_type = models.CharField(max_length=100, blank=True)
	entity_id = models.UUIDField(null=True, blank=True)
	old_value = models.JSONField(null=True, blank=True)
	new_value = models.JSONField(null=True, blank=True)
	ip_address = models.GenericIPAddressField(null=True, blank=True)
	user_agent = models.CharField(max_length=500, blank=True)
	performed_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = 'audit_logs'
		ordering = ['-performed_at']
