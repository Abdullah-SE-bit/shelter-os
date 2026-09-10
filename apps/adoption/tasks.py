from celery import shared_task
from django.db.models import F


@shared_task
def increment_views(listing_ids):
    from .models import AdoptionListing

    AdoptionListing.objects.filter(pk__in=listing_ids).update(views_count=F('views_count') + 1)
