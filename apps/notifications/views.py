from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import Notification, FCMToken, NotificationPreference
from .serializers import NotificationSerializer, PreferenceSerializer
from apps.core.responses import success_response


class NotificationListView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		qs = Notification.objects.filter(recipient=request.user, type='IN_APP').order_by('-sent_at')[:50]
		return success_response(NotificationSerializer(qs, many=True).data)


class UnreadCountView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		count = Notification.objects.filter(recipient=request.user, is_read=False, type='IN_APP').count()
		return success_response({'count': count})


class MarkReadView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request, pk):
		Notification.objects.filter(pk=pk, recipient=request.user).update(is_read=True, read_at=timezone.now())
		return success_response(message='Marked as read')


class MarkAllReadView(APIView):
	permission_classes = [IsAuthenticated]

	def put(self, request):
		Notification.objects.filter(recipient=request.user, is_read=False).update(
			is_read=True, read_at=timezone.now()
		)
		return success_response(message='All notifications marked as read')


class FCMTokenView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		token = request.data.get('token')
		device_type = request.data.get('device_type', 'WEB')
		FCMToken.objects.update_or_create(
			user=request.user,
			device_type=device_type,
			defaults={'token': token},
		)
		return success_response(message='FCM token registered')


class PreferencesView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		prefs = NotificationPreference.objects.filter(user=request.user)
		return success_response(PreferenceSerializer(prefs, many=True).data)

	def put(self, request):
		data = request.data if isinstance(request.data, list) else [request.data]
		for item in data:
			NotificationPreference.objects.update_or_create(
				user=request.user,
				category=item.get('category'),
				defaults={
					'email_enabled': item.get('email_enabled', True),
					'push_enabled': item.get('push_enabled', True),
					'in_app_enabled': item.get('in_app_enabled', True),
				},
			)
		return success_response(message='Preferences updated')
