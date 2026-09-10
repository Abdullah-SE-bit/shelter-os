from celery import shared_task


@shared_task
def send_notification(user_id, title, body, category='SYSTEM', reference_type=None, reference_id=None):
    """Create in-app notification and optionally deliver push/email."""
    from apps.accounts.models import User
    from .models import Notification, FCMToken, NotificationPreference

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return

    pref = NotificationPreference.objects.filter(user=user, category=category).first()

    if not pref or pref.in_app_enabled:
        Notification.objects.create(
            recipient=user,
            type='IN_APP',
            category=category,
            title=title,
            body=body,
            reference_type=reference_type or '',
            reference_id=reference_id,
        )

    if not pref or pref.push_enabled:
        tokens = FCMToken.objects.filter(user=user)
        for token in tokens:
            _send_fcm(token.token, title, body)

    if not pref or pref.email_enabled:
        from django.conf import settings
        from django.core.mail import send_mail

        send_mail(
            subject=f"PawTrack: {title}",
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@pawtrack.com'),
            recipient_list=[user.email],
            fail_silently=True,
        )


def _send_fcm(token, title, body):
    try:
        import firebase_admin.messaging as fcm_messaging

        msg = fcm_messaging.Message(
            notification=fcm_messaging.Notification(title=title, body=body),
            token=token,
        )
        fcm_messaging.send(msg)
    except Exception:
        pass
