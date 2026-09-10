from celery import shared_task
from django.utils import timezone


@shared_task
def close_expired_campaigns():
    from .models import DonationCampaign

    expired = DonationCampaign.objects.filter(is_active=True, end_date__lt=timezone.now().date())
    for campaign in expired:
        campaign.is_active = False
        campaign.save(update_fields=['is_active'])
        if campaign.shelter and campaign.shelter.admin:
            from apps.notifications.tasks import send_notification

            send_notification.delay(
                user_id=str(campaign.shelter.admin.id),
                title=f"Campaign ended: {campaign.title}",
                body=f"Final collection: {campaign.collected_amount} / {campaign.target_amount}",
                category='DONATION',
            )
