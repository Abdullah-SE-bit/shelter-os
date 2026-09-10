from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.CharField(source='actor.email', read_only=True)
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_email', 'actor_name', 'actor_role', 'action',
            'entity_type', 'entity_id', 'old_value', 'new_value', 'ip_address', 'performed_at',
        ]

    def get_actor_name(self, obj):
        # B3: surface the actor's display name (not just the UUID/email).
        actor = obj.actor
        if actor is not None and hasattr(actor, 'profile') and actor.profile:
            name = f"{actor.profile.first_name} {actor.profile.last_name}".strip()
            if name:
                return name
        return actor.email if actor else 'System'
