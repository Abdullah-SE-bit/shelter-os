from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_email', 'sender_name', 'body', 'sent_at', 'is_read', 'attachments']

    def get_sender_name(self, obj):
        profile = getattr(obj.sender, 'profile', None)
        if profile:
            name = f"{profile.first_name} {profile.last_name}".strip()
            if name:
                return name
        return obj.sender.email


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participant_ids', 'participants', 'context_type', 'context_id',
            'created_at', 'last_message_at', 'last_message', 'unread_count',
        ]

    def get_participants(self, obj):
        from apps.accounts.models import User
        users = User.objects.filter(id__in=obj.participant_ids).select_related('profile')
        res = []
        for user in users:
            name = ""
            profile = getattr(user, 'profile', None)
            if profile:
                name = f"{profile.first_name} {profile.last_name}".strip()
            res.append({
                "id": str(user.id),
                "email": user.email,
                "name": name or user.email,
                "role": user.role,
                "profile_photo": (profile.profile_photo_url if profile and profile.profile_photo_url else ""),
            })
        return res

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-sent_at').first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.messages.exclude(sender=request.user).filter(is_read=False).count()
        return 0


