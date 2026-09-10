from celery import shared_task
from django.utils import timezone
from .models import FosterPlacement
from apps.notifications.tasks import send_notification

@shared_task
def send_checkin_reminders():
    """Weekly reminder for foster caregivers to submit status updates for their cats."""
    active_placements = FosterPlacement.objects.filter(
        outcome='ONGOING',
        foster__user__is_active=True
    ).select_related('foster__user', 'cat')

    for placement in active_placements:
        user = placement.foster.user
        send_notification.delay(
            user_id=str(user.id),
            title="🐾 Foster check-in reminder",
            body=f"It is time to submit a status update for {placement.cat.name}. Please let us know how they are doing!",
            category='SYSTEM',
            reference_type='FosterPlacement',
            reference_id=placement.id
        )
