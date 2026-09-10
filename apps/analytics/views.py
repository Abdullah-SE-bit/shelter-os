import csv
import datetime
import io
from django.db.models import Count
from django.db.models.functions import TruncWeek
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from apps.core.permissions import IsShelterAdminOrSuperAdmin, IsSuperAdmin
from apps.core.responses import success_response


class PlatformOverviewView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from apps.accounts.models import User
		from apps.adoption.models import AdoptionApplication
		from apps.audit.models import AuditLog
		from apps.cats.models import Cat
		from apps.lost_found.models import LostCatAlert
		from apps.rescue.models import RescueReport
		from apps.shelters.models import Shelter

		now = timezone.now()
		thirty_ago = now - datetime.timedelta(days=30)

		# Main counts
		total_cats = Cat.objects.filter(is_deleted=False).count()
		total_shelters = Shelter.objects.filter(is_active=True, is_deleted=False).count()
		total_volunteers = User.objects.filter(role='VOLUNTEER', is_active=True).count()
		open_rescues = RescueReport.objects.filter(status__in=['PENDING', 'ASSIGNED', 'IN_PROGRESS']).count()
		pending_adoptions = AdoptionApplication.objects.filter(status='PENDING').count()
		active_lost_alerts = LostCatAlert.objects.filter(status='ACTIVE', is_deleted=False).count()

		# Cat status breakdown (live aggregation over cats.current_status)
		status_map = {
			row['current_status']: row['count']
			for row in Cat.objects.filter(is_deleted=False).values('current_status').annotate(count=Count('id'))
		}
		cats_in_shelter = status_map.get('IN_SHELTER', 0)
		cats_fostered = status_map.get('FOSTERED', 0)
		cats_adopted = status_map.get('ADOPTED', 0)
		cats_lost = status_map.get('LOST', 0)
		cats_deceased = status_map.get('DECEASED', 0)

		# B2: per-role user counts for the super-admin dashboard.
		users_by_role = {
			row['role']: row['count']
			for row in User.objects.filter(is_deleted=False).values('role').annotate(count=Count('id'))
		}

		# Recent activity from audit log
		recent_logs = AuditLog.objects.select_related('actor').order_by('-performed_at')[:10]
		recent_activity = []
		for log in recent_logs:
			actor_email = log.actor.email if log.actor else 'System'
			description = f"{actor_email} performed {log.get_action_display()} on {log.entity_type or 'entity'}"
			recent_activity.append({
				'description': description,
				'timestamp': log.performed_at.isoformat(),
			})

		return success_response(
			{
				'total_cats': total_cats,
				'total_shelters': total_shelters,
				'total_volunteers': total_volunteers,
				'open_rescues': open_rescues,
				'pending_adoptions': pending_adoptions,
				'active_lost_alerts': active_lost_alerts,
				'cats_in_shelter': cats_in_shelter,
				'cats_fostered': cats_fostered,
				'cats_adopted': cats_adopted,
				'cats_lost': cats_lost,
				'cats_deceased': cats_deceased,
				'users_by_role': users_by_role,
				'recent_activity': recent_activity,
			}
		)


class ShelterDashboardView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		from apps.shelters.views import ShelterDashboardView as SDV
		return SDV().get(request, shelter_id)


class ReportSummaryView(APIView):
	"""K1: live aggregates for the Reports screen, scoped to the shelter admin's
	shelter (super admin sees all or a chosen shelter), honoring a time period."""
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from django.db.models import Count, Sum
		from apps.cats.models import Cat
		from apps.adoption.models import AdoptionApplication, AdoptionRecord
		from apps.rescue.models import RescueReport
		from apps.finance.models import Donation
		from apps.volunteers.models import VolunteerProfile
		from apps.shelters.models import Shelter

		shelter_id = request.query_params.get('shelter_id')
		# Shelter admins are always scoped to their own shelter (data isolation).
		if request.user.role == 'SHELTER_ADMIN':
			own = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
			shelter_id = str(own.id) if own else None

		period = request.query_params.get('period', 'month')
		now = timezone.now()
		since = None
		if period == 'week':
			since = now - datetime.timedelta(days=7)
		elif period == 'month':
			since = now - datetime.timedelta(days=30)
		elif period == 'year':
			since = now - datetime.timedelta(days=365)

		cats = Cat.objects.filter(is_deleted=False)
		adoptions_qs = AdoptionRecord.objects.all()
		rescues_qs = RescueReport.objects.filter(status='RESOLVED', resolved_at__isnull=False)
		donations_qs = Donation.objects.filter(donation_type='MONETARY')
		apps_qs = AdoptionApplication.objects.all()
		volunteers_qs = VolunteerProfile.objects.filter(is_active=True)

		if shelter_id:
			cats = cats.filter(shelter_id=shelter_id)
			adoptions_qs = adoptions_qs.filter(shelter_id=shelter_id)
			rescues_qs = rescues_qs.filter(assigned_shelter_id=shelter_id)
			donations_qs = donations_qs.filter(shelter_id=shelter_id)
			apps_qs = apps_qs.filter(shelter_id=shelter_id)
			volunteers_qs = volunteers_qs.filter(shelter_id=shelter_id)

		if since:
			adoptions_qs = adoptions_qs.filter(adoption_date__gte=since)
			rescues_qs = rescues_qs.filter(resolved_at__gte=since)
			donations_qs = donations_qs.filter(donated_at__gte=since)
			apps_time = apps_qs.filter(created_at__gte=since)
		else:
			apps_time = apps_qs

		status_counts = {
			row['current_status']: row['count']
			for row in cats.values('current_status').annotate(count=Count('id'))
		}
		breed_counts = {}
		for row in cats.values('breed__display_label').annotate(count=Count('id')):
			breed_counts[row['breed__display_label'] or 'Unknown'] = row['count']

		total_donations = donations_qs.aggregate(total=Sum('amount'))['total'] or 0

		return success_response({
			'total_cats': cats.count(),
			'adoptions': adoptions_qs.count(),
			'rescues_resolved': rescues_qs.count(),
			'active_volunteers': volunteers_qs.count(),
			'total_donations': float(total_donations),
			'cats_by_status': status_counts,
			'cats_by_breed': breed_counts,
			'total_applications': apps_time.count(),
			'reviewed_applications': apps_time.exclude(status__in=['SUBMITTED', 'WITHDRAWN']).count(),
			'interviews_done': apps_time.filter(status__in=['INTERVIEW_SCHEDULED', 'APPROVED']).count(),
			'approved_applications': apps_time.filter(status='APPROVED').count(),
		})


class AdoptionTrendsView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from apps.adoption.models import AdoptionRecord

		shelter_id = request.query_params.get('shelter_id')
		qs = AdoptionRecord.objects.all()
		if shelter_id:
			qs = qs.filter(shelter_id=shelter_id)
		data = (
			qs.annotate(week=TruncWeek('adoption_date'))
			.values('week')
			.annotate(count=Count('id'))
			.order_by('week')[:26]
		)
		return success_response(
			[{'label': str(item['week'].date()) if item['week'] else '', 'value': item['count']} for item in data]
		)


class RescueMetricsView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from apps.rescue.models import RescueReport

		qs = RescueReport.objects.filter(status='RESOLVED', resolved_at__isnull=False)
		shelter = request.query_params.get('shelter_id')
		if shelter:
			qs = qs.filter(assigned_shelter_id=shelter)
		by_urgency = list(qs.values('urgency_level').annotate(count=Count('id')))
		total = qs.count()
		return success_response({'total_resolved': total, 'by_urgency': by_urgency})


class AdoptionReportView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from apps.adoption.models import AdoptionRecord
		from apps.adoption.serializers import AdoptionRecordSerializer

		qs = AdoptionRecord.objects.select_related('cat', 'adopter', 'shelter')
		shelter = request.query_params.get('shelter_id')
		if shelter:
			qs = qs.filter(shelter_id=shelter)
		return success_response({'results': AdoptionRecordSerializer(qs[:100], many=True).data, 'count': qs.count()})


class RescueReportView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from apps.rescue.models import RescueReport

		qs = RescueReport.objects.all().order_by('-reported_at')
		shelter = request.query_params.get('shelter_id')
		if shelter:
			qs = qs.filter(assigned_shelter_id=shelter)
		return success_response(
			{
				'results': [
					{
						'id': str(r.id),
						'description': r.description,
						'urgency_level': r.urgency_level,
						'status': r.status,
						'reported_at': r.reported_at,
						'resolved_at': r.resolved_at,
					}
					for r in qs[:200]
				],
				'count': qs.count(),
			}
		)


class DonationReportView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from apps.finance.models import Donation

		qs = Donation.objects.all().order_by('-donated_at')
		shelter = request.query_params.get('shelter_id')
		if shelter:
			qs = qs.filter(shelter_id=shelter)
		return success_response(
			{
				'results': [
					{
						'id': str(d.id),
						'donation_type': d.donation_type,
						'amount': d.amount,
						'currency': d.currency,
						'is_anonymous': d.is_anonymous,
						'donated_at': d.donated_at,
					}
					for d in qs[:200]
				],
				'count': qs.count(),
			}
		)


class ExportReportView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, report_type):
		shelter = request.query_params.get('shelter_id')
		# K1: shelter admins can only export their own shelter's data.
		if request.user.role == 'SHELTER_ADMIN':
			from apps.shelters.models import Shelter
			own = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
			shelter = str(own.id) if own else None
		output = io.StringIO()
		writer = csv.writer(output)

		if report_type == 'adoptions':
			from apps.adoption.models import AdoptionRecord

			qs = AdoptionRecord.objects.select_related('cat', 'adopter')
			if shelter:
				qs = qs.filter(shelter_id=shelter)
			writer.writerow(['Cat Name', 'Adopter Email', 'Adoption Date', 'Fee'])
			for record in qs:
				writer.writerow([record.cat.name, record.adopter.email, record.adoption_date, record.adoption_fee_paid])
		elif report_type == 'rescues':
			from apps.rescue.models import RescueReport

			qs = RescueReport.objects.all()
			if shelter:
				qs = qs.filter(assigned_shelter_id=shelter)
			writer.writerow(['Description', 'Urgency', 'Status', 'Reported At', 'Resolved At'])
			for report in qs:
				writer.writerow([
					report.description[:80],
					report.urgency_level,
					report.status,
					report.reported_at,
					report.resolved_at,
				])
		elif report_type == 'donations':
			from apps.finance.models import Donation

			qs = Donation.objects.all()
			if shelter:
				qs = qs.filter(shelter_id=shelter)
			writer.writerow(['Type', 'Amount', 'Currency', 'Anonymous', 'Date'])
			for donation in qs:
				writer.writerow([
					donation.donation_type,
					donation.amount,
					donation.currency,
					donation.is_anonymous,
					donation.donated_at,
				])
		else:
			return HttpResponse('Unknown report type', status=400)

		response = HttpResponse(output.getvalue(), content_type='text/csv')
		response['Content-Disposition'] = f'attachment; filename="{report_type}_report.csv"'
		return response


class VaccinationComplianceView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		return success_response({'message': 'See wellness app for compliance data'})


class VolunteerActivityView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		from django.db.models import Q
		from apps.rescue.models import RescueAssignment

		qs = (
			RescueAssignment.objects.values('volunteer__user__email')
			.annotate(total=Count('id'), completed=Count('id', filter=Q(status='COMPLETED')))
			.order_by('-completed')[:20]
		)
		return success_response(list(qs))
