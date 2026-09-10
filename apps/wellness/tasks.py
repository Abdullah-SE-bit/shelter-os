import datetime
from django.utils import timezone
from celery import shared_task


@shared_task
def check_weight_concern(cat_id):
	"""Check if a cat has significant weight changes"""
	from .models import WeightLog, HealthAlert
	from apps.cats.models import Cat
	
	try:
		cat = Cat.objects.get(pk=cat_id, is_deleted=False)
	except Cat.DoesNotExist:
		return
	
	logs = WeightLog.objects.filter(cat=cat).order_by('-recorded_at')[:2]
	if logs.count() < 2:
		return
	
	latest = float(logs[0].weight_kg)
	previous = float(logs[1].weight_kg)
	
	# Calculate percentage change
	if previous > 0:
		change_pct = ((latest - previous) / previous) * 100
		
		# Significant weight loss (>15%)
		if change_pct < -15:
			HealthAlert.objects.get_or_create(
				cat=cat,
				alert_type='WEIGHT_CONCERN',
				defaults={
					'severity': 'WARNING',
					'message': f'{cat.name} has lost {abs(change_pct):.1f}% of body weight. Please schedule a checkup.',
					'is_resolved': False,
				}
			)
		# Significant weight gain (>20%)
		elif change_pct > 20:
			HealthAlert.objects.get_or_create(
				cat=cat,
				alert_type='WEIGHT_CONCERN',
				defaults={
					'severity': 'WARNING',
					'message': f'{cat.name} has gained {change_pct:.1f}% of body weight. Consider adjusting diet.',
					'is_resolved': False,
				}
			)


@shared_task
def generate_vaccination_alerts():
	"""Generate alerts for overdue and upcoming vaccinations"""
	from .models import HealthAlert
	from apps.medical.models import Vaccination
	from apps.cats.models import Cat
	
	today = timezone.now().date()
	week_from_now = today + datetime.timedelta(days=7)
	
	# Get all cats that are not deleted
	cats = Cat.objects.filter(is_deleted=False)
	
	for cat in cats:
		# Get the most recent vaccination for this cat
		latest_vacc = Vaccination.objects.filter(
			cat=cat,
			is_deleted=False
		).order_by('-administered_at').first()
		
		if not latest_vacc or not latest_vacc.next_due_date:
			continue
		
		# Check if overdue (more than 30 days past due)
		if latest_vacc.next_due_date < today:
			days_overdue = (today - latest_vacc.next_due_date).days
			
			# Only create alert if significantly overdue
			if days_overdue > 30:
				HealthAlert.objects.get_or_create(
					cat=cat,
					alert_type='VACCINATION_OVERDUE',
					defaults={
						'severity': 'CRITICAL' if days_overdue > 90 else 'WARNING',
						'message': f'{cat.name} is {days_overdue} days overdue for {latest_vacc.vaccine_name} vaccination.',
						'is_resolved': False,
					}
				)
		# Check if due soon (within next 7 days)
		elif today <= latest_vacc.next_due_date <= week_from_now:
			# Clear any existing overdue alerts
			HealthAlert.objects.filter(
				cat=cat,
				alert_type='VACCINATION_OVERDUE',
				is_resolved=False
			).update(is_resolved=True, resolved_at=timezone.now())
			
			HealthAlert.objects.get_or_create(
				cat=cat,
				alert_type='VACCINATION_DUE',
				defaults={
					'severity': 'INFO',
					'message': f'{cat.name} is due for {latest_vacc.vaccine_name} vaccination on {latest_vacc.next_due_date}.',
					'is_resolved': False,
				}
			)


@shared_task
def generate_checkup_alerts():
	"""Generate alerts for cats that haven't had a checkup in 6+ months"""
	from .models import HealthAlert, Appointment
	from apps.cats.models import Cat
	
	today = timezone.now().date()
	six_months_ago = today - datetime.timedelta(days=180)
	
	# Get all cats that are not deleted
	cats = Cat.objects.filter(is_deleted=False)
	
	for cat in cats:
		# Get the most recent completed checkup appointment
		latest_checkup = Appointment.objects.filter(
			cat=cat,
			appointment_type='CHECKUP',
			status='COMPLETED',
			is_deleted=False
		).order_by('-scheduled_at').first()
		
		# If no checkup or last checkup was more than 6 months ago
		if not latest_checkup or latest_checkup.scheduled_at.date() < six_months_ago:
			days_since = (today - latest_checkup.scheduled_at.date()).days if latest_checkup else 365
			
			# Only create alert if no existing unresolved checkup alert
			existing = HealthAlert.objects.filter(
				cat=cat,
				alert_type='CHECKUP_DUE',
				is_resolved=False
			).exists()
			
			if not existing:
				HealthAlert.objects.create(
					cat=cat,
					alert_type='CHECKUP_DUE',
					severity='WARNING' if days_since > 270 else 'INFO',
					message=f'{cat.name} is due for a routine checkup. Last checkup was {days_since} days ago.',
					is_resolved=False,
				)


@shared_task
def generate_missed_dose_alerts():
	"""Generate alerts for cats with multiple missed medication doses"""
	from .models import HealthAlert
	from apps.medical.models import Prescription, DoseLog
	
	# Get all active prescriptions
	active_prescriptions = Prescription.objects.filter(
		is_completed=False,
		is_ongoing=True
	)
	
	for prescription in active_prescriptions:
		# Check last 3 doses
		recent_doses = DoseLog.objects.filter(
			prescription=prescription
		).order_by('-given_at')[:3]
		
		# If all 3 recent doses were missed
		if recent_doses.count() == 3 and all(not dose.was_given for dose in recent_doses):
			# Check if alert already exists
			existing = HealthAlert.objects.filter(
				cat=prescription.cat,
				alert_type='MISSED_DOSE',
				is_resolved=False
			).exists()
			
			if not existing:
				HealthAlert.objects.create(
					cat=prescription.cat,
					alert_type='MISSED_DOSE',
					severity='WARNING',
					message=f'{prescription.cat.name} has missed 3 consecutive doses of {prescription.drug_name}.',
					is_resolved=False,
				)


@shared_task
def generate_all_health_alerts():
	"""Master task that runs all health alert generators"""
	generate_vaccination_alerts()
	generate_checkup_alerts()
	generate_missed_dose_alerts()
	return 'Health alerts generated successfully'
