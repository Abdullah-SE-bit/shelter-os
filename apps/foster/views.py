from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .models import FosterProfile, FosterPlacement
from .serializers import FosterProfileSerializer, FosterPlacementSerializer
from apps.core.permissions import IsShelterAdminOrSuperAdmin
from apps.core.responses import success_response, created_response, error_response


class RegisterFosterView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		profile = FosterProfile.objects.create(
			user=request.user,
			shelter_id=request.data.get('shelter'),
			max_capacity=int(request.data.get('max_capacity', 1)),
			preferred_ages=request.data.get('preferred_ages', []),
			can_handle_medical=request.data.get('can_handle_medical', False),
			can_handle_kittens=request.data.get('can_handle_kittens', False),
			address=request.data.get('address', ''),
		)
		return created_response(FosterProfileSerializer(profile).data)


class FosterProfileListView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request):
		qs = FosterProfile.objects.filter(is_available=True)
		if request.query_params.get('can_handle_medical') == 'true':
			qs = qs.filter(can_handle_medical=True)
		if request.query_params.get('can_handle_kittens') == 'true':
			qs = qs.filter(can_handle_kittens=True)
		return success_response(FosterProfileSerializer(qs, many=True).data)


class FosterProfileDetailView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, pk):
		try:
			profile = FosterProfile.objects.get(pk=pk)
			return success_response(FosterProfileSerializer(profile).data)
		except FosterProfile.DoesNotExist:
			return error_response('NOT_FOUND', 'Foster profile not found', 404)


class FosterPlacementCreateView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def post(self, request):
		cat_id = request.data.get('cat')
		foster_id = request.data.get('foster')
		shelter_id = request.data.get('shelter')

		try:
			foster = FosterProfile.objects.get(pk=foster_id)
		except FosterProfile.DoesNotExist:
			return error_response('NOT_FOUND', 'Foster profile not found', 404)

		if foster.current_capacity >= foster.max_capacity:
			return error_response('FOSTER_FULL', 'Foster family is at full capacity', 400)

		placement = FosterPlacement.objects.create(
			cat_id=cat_id,
			foster=foster,
			shelter_id=shelter_id,
			placed_by=request.user,
			expected_return_at=request.data.get('expected_return_at'),
		)
		foster.current_capacity += 1
		if foster.current_capacity >= foster.max_capacity:
			foster.is_available = False
		foster.save()

		from apps.cats.models import Cat
		Cat.objects.filter(pk=cat_id).update(current_status='FOSTERED')

		from apps.notifications.tasks import send_notification
		send_notification.delay(
			user_id=str(foster.user.id),
			title='New foster placement',
			body='A cat has been placed in your care.',
			category='SYSTEM',
		)
		return created_response(FosterPlacementSerializer(placement).data)


class MyFosterPlacementsView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		try:
			profile = FosterProfile.objects.get(user=request.user)
			placements = FosterPlacement.objects.filter(foster=profile).order_by('-placed_at')
			return success_response(FosterPlacementSerializer(placements, many=True).data)
		except FosterProfile.DoesNotExist:
			return success_response([])


class FosterCheckinView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def put(self, request, pk):
		try:
			placement = FosterPlacement.objects.get(pk=pk, outcome='ONGOING')
		except FosterPlacement.DoesNotExist:
			return error_response('NOT_FOUND', 'Placement not found', 404)

		notes = list(placement.check_in_notes or [])
		notes.append(
			{
				'note': request.data.get('note', ''),
				'timestamp': str(timezone.now()),
				'by': str(request.user.id),
			}
		)
		placement.check_in_notes = notes
		placement.save(update_fields=['check_in_notes'])
		return success_response(FosterPlacementSerializer(placement).data)


class ReturnToShelterView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def put(self, request, pk):
		try:
			placement = FosterPlacement.objects.get(pk=pk, outcome='ONGOING')
		except FosterPlacement.DoesNotExist:
			return error_response('NOT_FOUND', 'Placement not found', 404)

		placement.outcome = 'RETURNED'
		placement.actual_return_at = timezone.now()
		placement.save(update_fields=['outcome', 'actual_return_at', 'updated_at'])

		foster = placement.foster
		foster.current_capacity = max(0, foster.current_capacity - 1)
		foster.is_available = True
		foster.save()

		from apps.cats.models import Cat
		Cat.objects.filter(pk=placement.cat.id).update(current_status='IN_SHELTER', shelter=placement.shelter)
		return success_response(FosterPlacementSerializer(placement).data)


class ShelterFosterPlacementsView(APIView):
	permission_classes = [IsShelterAdminOrSuperAdmin]

	def get(self, request, shelter_id):
		qs = FosterPlacement.objects.filter(shelter_id=shelter_id)
		outcome = request.query_params.get('outcome')
		if outcome:
			qs = qs.filter(outcome=outcome)
		return success_response(FosterPlacementSerializer(qs.order_by('-placed_at'), many=True).data)
