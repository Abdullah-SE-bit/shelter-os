from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.core.responses import success_response, created_response, error_response


class ConversationListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user_id = str(request.user.id)
		convs = [
			conv for conv in Conversation.objects.all().order_by('-last_message_at')
			if user_id in [str(pid) for pid in (conv.participant_ids or [])]
		]
		return success_response(ConversationSerializer(convs, many=True, context={'request': request}).data)

	def post(self, request):
		context_type = request.data.get('context_type', 'GENERAL')
		context_id = request.data.get('context_id')
		participants = [str(p) for p in request.data.get('participant_ids', [])]
		if str(request.user.id) not in participants:
			participants.append(str(request.user.id))

		if context_id:
			existing = Conversation.objects.filter(context_type=context_type, context_id=context_id).first()
			if existing:
				return success_response(ConversationSerializer(existing, context={'request': request}).data)

		conv = Conversation.objects.create(
			participant_ids=participants,
			context_type=context_type,
			context_id=context_id,
		)
		return created_response(ConversationSerializer(conv, context={'request': request}).data)


class MessageListCreateView(APIView):
	permission_classes = [IsAuthenticated]

	def _get_conv(self, pk, user):
		try:
			conv = Conversation.objects.get(pk=pk)
			if str(user.id) not in [str(pid) for pid in (conv.participant_ids or [])]:
				return None, error_response('ACCESS_DENIED', 'Not a participant', 403)
			return conv, None
		except Conversation.DoesNotExist:
			return None, error_response('NOT_FOUND', 'Conversation not found', 404)

	def get(self, request, pk):
		conv, err = self._get_conv(pk, request.user)
		if err:
			return err
		msgs = conv.messages.order_by('-sent_at')[:50]
		return success_response(MessageSerializer(msgs, many=True).data)

	def post(self, request, pk):
		conv, err = self._get_conv(pk, request.user)
		if err:
			return err
		body = request.data.get('body', '').strip()
		if not body:
			return error_response('VALIDATION_FAILED', 'Message body cannot be empty', 400)
		msg = Message.objects.create(conversation=conv, sender=request.user, body=body)
		conv.last_message_at = timezone.now()
		conv.save(update_fields=['last_message_at'])

		from apps.notifications.tasks import send_notification
		for pid in conv.participant_ids:
			if str(pid) != str(request.user.id):
				send_notification.delay(
					user_id=str(pid),
					title='New message',
					body=body[:80] + ('...' if len(body) > 80 else ''),
					category='MESSAGING',
				)
		return created_response(MessageSerializer(msg).data)


class MarkConversationReadView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		Message.objects.filter(conversation_id=pk).exclude(sender=request.user).update(is_read=True)
		return success_response(message='Marked as read')


class ConversationDetailView(APIView):
	permission_classes = [IsAuthenticated]

	def delete(self, request, pk):
		try:
			conv = Conversation.objects.get(pk=pk)
			if str(request.user.id) not in [str(pid) for pid in (conv.participant_ids or [])]:
				return error_response('ACCESS_DENIED', 'Not a participant', 403)
			conv.delete()
			return success_response(message='Conversation deleted successfully')
		except Conversation.DoesNotExist:
			return error_response('NOT_FOUND', 'Conversation not found', 404)

