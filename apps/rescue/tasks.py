import math
from celery import shared_task


def _haversine_km(lat1, lng1, lat2, lng2):
	radius = 6371
	dlat = math.radians(lat2 - lat1)
	dlng = math.radians(lng2 - lng1)
	a = (
		math.sin(dlat / 2) ** 2
		+ math.cos(math.radians(lat1))
		* math.cos(math.radians(lat2))
		* math.sin(dlng / 2) ** 2
	)
	return radius * 2 * math.asin(math.sqrt(a))


@shared_task
def notify_nearby_shelter_admins(report_id):
	from .models import RescueReport
	from apps.shelters.models import Shelter
	from apps.notifications.tasks import send_notification

	report = RescueReport.objects.filter(pk=report_id, is_deleted=False).first()
	if not report:
		return

	shelters = Shelter.objects.filter(
		is_active=True,
		is_deleted=False,
		latitude__isnull=False,
		longitude__isnull=False,
		admin__isnull=False,
	)

	for shelter in shelters:
		distance = _haversine_km(report.latitude, report.longitude, shelter.latitude, shelter.longitude)
		if distance <= 20:
			send_notification.delay(
				user_id=str(shelter.admin.id),
				title='Nearby rescue report',
				body=f'A {report.urgency_level} rescue report was submitted near your shelter.',
				category='RESCUE',
			)


@shared_task
def auto_assign_critical(report_id):
	from .models import RescueReport, RescueAssignment
	from apps.volunteers.models import VolunteerProfile
	from apps.notifications.tasks import send_notification

	report = RescueReport.objects.filter(pk=report_id, is_deleted=False).first()
	if not report or report.urgency_level != 'CRITICAL':
		return

	volunteers = VolunteerProfile.objects.filter(
		is_active=True,
		last_known_latitude__isnull=False,
		last_known_longitude__isnull=False,
	)

	best = None
	best_distance = float('inf')
	for volunteer in volunteers:
		active_assignments = RescueAssignment.objects.filter(
			volunteer=volunteer,
			status__in=['PENDING', 'ACCEPTED', 'IN_PROGRESS'],
		).count()
		if active_assignments >= 3:
			continue

		distance = _haversine_km(
			report.latitude,
			report.longitude,
			volunteer.last_known_latitude,
			volunteer.last_known_longitude,
		)
		if distance <= volunteer.service_radius_km and distance < best_distance:
			best = volunteer
			best_distance = distance

	if not best:
		return

	RescueAssignment.objects.create(
		rescue_report=report,
		volunteer=best,
		status='PENDING',
	)
	report.assigned_volunteer = best.user
	report.status = 'ASSIGNED'
	report.save(update_fields=['assigned_volunteer', 'status', 'updated_at'])

	send_notification.delay(
		user_id=str(best.user.id),
		title='Critical rescue assignment',
		body='You have been auto-assigned to a critical rescue report.',
		category='RESCUE',
	)
