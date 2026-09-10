from datetime import timedelta

from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from .models import Donation, DonationCampaign, ItemDonation, ExpenseRecord
from .serializers import DonationSerializer, CampaignSerializer, ExpenseSerializer
from apps.core.permissions import IsShelterAdminOrSuperAdmin
from apps.core.responses import success_response, created_response, error_response
from apps.audit.utils import log_audit


# Settled campaigns (completed or expired) stay visible on the donate view for
# this grace window, then drop off the listing so the card is "removed".
CAMPAIGN_CLOSED_GRACE = timedelta(hours=24)


def _campaign_audit_payload(campaign, message):
    return {
        'message': message,
        'title': campaign.title,
        'collected_amount': str(campaign.collected_amount),
        'target_amount': str(campaign.target_amount),
    }


def _complete_campaign(campaign, request=None):
    """Mark a campaign completed once its target is reached and log it.

    The is_active publish flag is left untouched; lifecycle is tracked via
    `status` so a completed card can still render (green, 100%) until the
    grace window elapses.
    """
    if campaign.status == 'COMPLETED':
        return
    campaign.status = 'COMPLETED'
    campaign.closed_at = timezone.now()
    campaign.save(update_fields=['status', 'closed_at'])
    log_audit(request, 'CAMPAIGN_COMPLETED', campaign,
              new_value=_campaign_audit_payload(campaign, f'Campaign complete: {campaign.title}'))


def _mark_campaign_incomplete(campaign, request=None):
    """Mark a past-due campaign that never reached its target and log it."""
    if campaign.status != 'ACTIVE':
        return
    campaign.status = 'INCOMPLETE'
    campaign.closed_at = timezone.now()
    campaign.save(update_fields=['status', 'closed_at'])
    log_audit(request, 'CAMPAIGN_INCOMPLETE', campaign,
              new_value=_campaign_audit_payload(campaign, f'Campaign not complete: {campaign.title}'))


def _reconcile_campaigns(request=None):
    """Settle campaigns: complete those that hit target, expire past-due ones."""
    today = timezone.now().date()
    for campaign in DonationCampaign.objects.filter(status='ACTIVE'):
        if campaign.target_amount and campaign.collected_amount >= campaign.target_amount:
            _complete_campaign(campaign, request)
        elif campaign.end_date and campaign.end_date < today:
            _mark_campaign_incomplete(campaign, request)


class DonationCreateView(APIView):
	def get_permissions(self):
		# Anyone may view; only shelter admins and super admins may register a donation.
		return [AllowAny()] if self.request.method == 'GET' else [IsShelterAdminOrSuperAdmin()]

	def get(self, request):
		"""
		GET /donations/
		
		Lists donations with pagination and filtering.
		Super Admin sees all, Shelter Admin sees their shelter's donations.
		"""
		qs = Donation.objects.all().select_related('shelter', 'donor', 'campaign').order_by('-donated_at')
		
		# Filter by role
		if request.user.is_authenticated:
			if request.user.role == 'SHELTER_ADMIN':
				from apps.shelters.models import Shelter
				shelter = Shelter.objects.filter(admin=request.user).first()
				if shelter:
					qs = qs.filter(shelter=shelter)
			# SUPER_ADMIN sees all
		
		# Apply filters
		shelter_id = request.query_params.get('shelter_id')
		if shelter_id:
			qs = qs.filter(shelter_id=shelter_id)
		
		donation_type = request.query_params.get('donation_type')
		if donation_type:
			qs = qs.filter(donation_type=donation_type)
		
		# Pagination
		page = int(request.query_params.get('page', 1))
		page_size = int(request.query_params.get('page_size', 20))
		total = qs.count()
		donations = qs[(page - 1) * page_size: page * page_size]
		
		return success_response({
			'results': DonationSerializer(donations, many=True).data,
			'count': total,
			'page': page,
			'page_size': page_size,
		})

	def post(self, request):
		"""
		POST /donations/
		
		Creates a new donation record.
		Supports both authenticated and anonymous donations.
		"""
		# Extract donation data from request
		amount = request.data.get('amount')
		if not amount:
			return error_response('VALIDATION_FAILED', 'Amount is required', 400)
		
		# Handle donor information
		# If authenticated, use the logged-in user
		# If not authenticated or anonymous, store donor info in payment_reference as JSON
		donor = request.user if request.user.is_authenticated else None
		
		# Build donation record.
		# SHELTER_ADMIN donations are always scoped to their own shelter.
		# SUPER_ADMIN may register a donation for a specific shelter or app-wide
		# (no shelter) depending on what the form sends.
		from apps.shelters.models import Shelter
		shelter_id = request.data.get('shelter')
		if request.user.role == 'SHELTER_ADMIN':
			own = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
			shelter_id = own.id if own else None
		elif request.user.role == 'SUPER_ADMIN':
			is_app_level = request.data.get('is_app_level')
			if isinstance(is_app_level, str):
				is_app_level = is_app_level.strip().lower() in ('true', '1', 'yes')
			if is_app_level:
				shelter_id = None

		donation_data = {
			'donor': donor,
			'shelter_id': shelter_id,
			'campaign_id': request.data.get('campaign'),
			'donation_type': request.data.get('donation_type', 'MONETARY'),
			'amount': amount,
			'currency': request.data.get('currency', 'PKR'),
			'is_anonymous': request.data.get('is_anonymous', False),
		}
		
		# Store additional info (donor_name, donor_email, payment_method, notes) in payment_reference
		# as JSON for tracking purposes
		import json
		additional_info = {}
		if request.data.get('donor_name'):
			additional_info['donor_name'] = request.data.get('donor_name')
		if request.data.get('donor_email'):
			additional_info['donor_email'] = request.data.get('donor_email')
		if request.data.get('payment_method'):
			additional_info['payment_method'] = request.data.get('payment_method')
		if request.data.get('notes'):
			additional_info['notes'] = request.data.get('notes')
		if request.data.get('received_at'):
			additional_info['received_at'] = request.data.get('received_at')
		
		if additional_info:
			donation_data['payment_reference'] = json.dumps(additional_info)
		
		donation = Donation.objects.create(**donation_data)

		if donation.donation_type == 'ITEM':
			ItemDonation.objects.create(
				donation=donation,
				item_name=request.data.get('item_name', ''),
				quantity=int(request.data.get('quantity', 1)),
				condition=request.data.get('condition', 'GOOD'),
			)

		if donation.campaign:
			total = Donation.objects.filter(campaign=donation.campaign, donation_type='MONETARY').aggregate(
				Sum('amount')
			)['amount__sum'] or 0
			donation.campaign.collected_amount = total
			donation.campaign.save(update_fields=['collected_amount'])
			# Reaching (or exceeding) the goal completes the campaign. The full
			# donation is still recorded normally; only the campaign is closed.
			if donation.campaign.target_amount and total >= donation.campaign.target_amount:
				_complete_campaign(donation.campaign, request)

		if not donation.is_anonymous and request.user.is_authenticated:
			from apps.notifications.tasks import send_notification
			send_notification.delay(
				user_id=str(request.user.id),
				title='Thank you for your donation',
				body=f"Your donation of {donation.amount} {donation.currency} has been received.",
				category='DONATION',
			)

		return created_response(DonationSerializer(donation).data)


class MyDonationsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		qs = Donation.objects.filter(donor=request.user).order_by('-donated_at')
		return success_response(DonationSerializer(qs, many=True).data)


class ShelterDonationsView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		qs = Donation.objects.filter(shelter_id=shelter_id).order_by('-donated_at')
		donation_type = request.query_params.get('type')
		if donation_type:
			qs = qs.filter(donation_type=donation_type)
		total = qs.filter(donation_type='MONETARY').aggregate(Sum('amount'))['amount__sum'] or 0
		return success_response({'results': DonationSerializer(qs, many=True).data, 'total_monetary': str(total)})


class CampaignListCreateView(APIView):
	def get_permissions(self):
		return [AllowAny()] if self.request.method == 'GET' else [IsShelterAdminOrSuperAdmin()]

	def get(self, request):
		# Settle any campaigns that hit their goal or ran past their end date
		# before listing, so the cards reflect the latest state.
		_reconcile_campaigns(request)

		# Newest first so a just-created campaign is visible on page 1.
		qs = DonationCampaign.objects.all().select_related('shelter').order_by('-created_at')

		# Managers see every shelter/status; the public donate view sees only
		# published (is_active) campaigns.
		user = request.user if request.user.is_authenticated else None
		if user and user.role == 'SUPER_ADMIN':
			pass  # all shelters
		elif user and user.role == 'SHELTER_ADMIN':
			from apps.shelters.models import Shelter
			own = Shelter.objects.filter(admin=user, is_deleted=False).first()
			qs = qs.filter(shelter=own) if own else qs.none()
		else:
			qs = qs.filter(is_active=True)

		shelter = request.query_params.get('shelter_id')
		if shelter:
			qs = qs.filter(shelter_id=shelter)

		# Keep active campaigns plus recently-settled ones; older completed or
		# incomplete campaigns drop off the listing after the grace window.
		cutoff = timezone.now() - CAMPAIGN_CLOSED_GRACE
		qs = qs.filter(Q(status='ACTIVE') | Q(closed_at__gte=cutoff))

		# Paginated shape expected by the frontend (results/count).
		page = int(request.query_params.get('page', 1))
		page_size = int(request.query_params.get('page_size', 20))
		total = qs.count()
		campaigns = qs[(page - 1) * page_size: page * page_size]
		return success_response({
			'results': CampaignSerializer(campaigns, many=True).data,
			'count': total,
			'page': page,
			'page_size': page_size,
		})

	def post(self, request):
		# H1: Both SHELTER_ADMIN and SUPER_ADMIN may create campaigns.
		# A shelter admin can only create for THEIR OWN shelter; a super admin
		# must specify which shelter the campaign belongs to.
		from apps.shelters.models import Shelter

		if request.user.role == 'SUPER_ADMIN':
			# A super admin chooses the scope: an app-wide campaign (no shelter)
			# or one tied to a specific shelter picked from the dropdown.
			is_app_level = request.data.get('is_app_level')
			if isinstance(is_app_level, str):
				is_app_level = is_app_level.strip().lower() in ('true', '1', 'yes')

			if is_app_level:
				shelter = None
			else:
				shelter_id = request.data.get('shelter') or request.data.get('shelter_id')
				if not shelter_id:
					return error_response('VALIDATION_FAILED', 'shelter is required', 400,
										   {'shelter': ['Select a shelter, or mark the campaign as app-wide.']})
				shelter = Shelter.objects.filter(pk=shelter_id, is_deleted=False).first()
				if not shelter:
					return error_response('NOT_FOUND', 'Shelter not found', 404)
		else:
			# SHELTER_ADMIN — scope to their own shelter, reject cross-shelter.
			shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
			if not shelter:
				return error_response('ACCESS_DENIED', 'You are not assigned to a shelter', 403)
			requested = request.data.get('shelter') or request.data.get('shelter_id')
			if requested and str(requested) != str(shelter.id):
				return error_response('ACCESS_DENIED', 'Cannot create a campaign for another shelter', 403)

		# Field validation
		errors = {}
		title = (request.data.get('title') or '').strip()
		if not title:
			errors['title'] = ['This field is required.']
		start_date = request.data.get('start_date')
		if not start_date:
			errors['start_date'] = ['This field is required.']
		end_date = request.data.get('end_date')
		if not end_date:
			errors['end_date'] = ['This field is required.']
		try:
			target_amount = float(request.data.get('target_amount', 0) or 0)
			if target_amount <= 0:
				errors['target_amount'] = ['Target amount must be greater than zero.']
		except (TypeError, ValueError):
			errors['target_amount'] = ['Enter a valid amount.']
		if start_date and end_date and str(end_date) < str(start_date):
			errors['end_date'] = ['End date must be on or after the start date.']
		if errors:
			return error_response('VALIDATION_FAILED', 'Validation error', 400, errors)

		# Honor the "Activate immediately" toggle (defaults to active).
		is_active = request.data.get('is_active', True)
		if isinstance(is_active, str):
			is_active = is_active.strip().lower() not in ('false', '0', 'no', '')

		campaign = DonationCampaign.objects.create(
			shelter=shelter,
			title=title,
			description=request.data.get('description', ''),
			target_amount=target_amount,
			start_date=start_date,
			end_date=end_date,
			is_active=bool(is_active),
			created_by=request.user,
		)
		return created_response(CampaignSerializer(campaign).data)


class CampaignDetailView(APIView):
	def get_permissions(self):
		return [AllowAny()] if self.request.method == 'GET' else [IsShelterAdminOrSuperAdmin()]

	def get(self, request, pk):
		try:
			campaign = DonationCampaign.objects.get(pk=pk)
			data = CampaignSerializer(campaign).data
			data['progress_percent'] = (
				round(float(campaign.collected_amount) / float(campaign.target_amount) * 100, 1)
				if campaign.target_amount
				else 0
			)
			return success_response(data)
		except DonationCampaign.DoesNotExist:
			return error_response('NOT_FOUND', 'Campaign not found', 404)

	def put(self, request, pk):
		try:
			campaign = DonationCampaign.objects.get(pk=pk)
			if 'title' in request.data:
				campaign.title = request.data['title']
			if 'description' in request.data:
				campaign.description = request.data['description']
			if 'end_date' in request.data:
				campaign.end_date = request.data['end_date']
			campaign.save()
			return success_response(CampaignSerializer(campaign).data)
		except DonationCampaign.DoesNotExist:
			return error_response('NOT_FOUND', 'Campaign not found', 404)


class ExpenseListCreateView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		qs = ExpenseRecord.objects.filter(shelter_id=shelter_id).order_by('-expense_date')
		category = request.query_params.get('category')
		if category:
			qs = qs.filter(category=category)
		return success_response(ExpenseSerializer(qs, many=True).data)

	def post(self, request, shelter_id):
		exp = ExpenseRecord.objects.create(
			shelter_id=shelter_id,
			category=request.data.get('category', 'OTHER'),
			amount=request.data.get('amount', 0),
			currency=request.data.get('currency', 'PKR'),
			description=request.data.get('description', ''),
			expense_date=request.data.get('expense_date'),
			recorded_by=request.user,
		)
		return created_response(ExpenseSerializer(exp).data)


class FinancialSummaryView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		month = int(request.query_params.get('month', timezone.now().month))
		year = int(request.query_params.get('year', timezone.now().year))

		income = Donation.objects.filter(
			shelter_id=shelter_id,
			donated_at__month=month,
			donated_at__year=year,
			donation_type='MONETARY',
		).aggregate(Sum('amount'))['amount__sum'] or 0

		expenses_qs = ExpenseRecord.objects.filter(
			shelter_id=shelter_id,
			expense_date__month=month,
			expense_date__year=year,
		)
		total_exp = expenses_qs.aggregate(Sum('amount'))['amount__sum'] or 0
		by_cat = list(expenses_qs.values('category').annotate(total=Sum('amount')))

		return success_response(
			{
				'month': month,
				'year': year,
				'total_income': str(income),
				'total_expenses': str(total_exp),
				'net_balance': str(float(income) - float(total_exp)),
				'breakdown': by_cat,
			}
		)


class FinancialReportView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		month = int(request.query_params.get('month', timezone.now().month))
		year = int(request.query_params.get('year', timezone.now().year))
		return success_response(
			{
				'message': 'PDF generation requires iText integration',
				'download_url': (
					f'/api/v1/reports/export/donations?shelter_id={shelter_id}&month={month}&year={year}'
				),
			}
		)
