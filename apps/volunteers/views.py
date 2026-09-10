import math
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import VolunteerProfile, VolunteerSkill, VolunteerAvailability, ShelterChangeRequest
from .serializers import (VolunteerProfileSerializer, VolunteerProfileUpdateSerializer,
                          ShelterChangeRequestSerializer)
from apps.core.responses import success_response, created_response, error_response, no_content_response
from apps.core.permissions import IsShelterAdminOrSuperAdmin


def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


class RegisterVolunteerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'volunteer_profile'):
            return error_response("ALREADY_REGISTERED", "Volunteer profile already exists", 409)
        profile = VolunteerProfile.objects.create(user=request.user)
        # Save skills
        for skill in request.data.get('skills', []):
            VolunteerSkill.objects.get_or_create(volunteer=profile, skill=skill)
        # Save availability
        for avail in request.data.get('availability', []):
            VolunteerAvailability.objects.create(volunteer=profile, **avail)
        return created_response(VolunteerProfileSerializer(profile).data)


class MyVolunteerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer profile not found", 404)
        return success_response(VolunteerProfileSerializer(profile).data)

    def put(self, request):
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer profile not found", 404)
        s = VolunteerProfileUpdateSerializer(profile, data=request.data, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        s.save()
        return success_response(VolunteerProfileSerializer(profile).data)


class MyAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.rescue.models import RescueAssignment
        from apps.rescue.serializers import RescueAssignmentSerializer
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer profile not found", 404)
        assignments = RescueAssignment.objects.filter(
            volunteer=profile).select_related('rescue_report')
        return success_response(RescueAssignmentSerializer(assignments, many=True).data)


class NearbyVolunteersView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius_km', 20))
        if not lat or not lng:
            return error_response("MISSING_PARAMS", "lat and lng are required", 400)
        lat, lng = float(lat), float(lng)
        volunteers = VolunteerProfile.objects.filter(
            is_active=True,
            last_known_latitude__isnull=False,
            last_known_longitude__isnull=False,
        )
        nearby = [v for v in volunteers
                  if haversine(lat, lng, v.last_known_latitude, v.last_known_longitude) <= radius_km]
        return success_response(VolunteerProfileSerializer(nearby, many=True).data)


class VolunteerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure volunteer profiles exist for all volunteer users
        from apps.accounts.models import User
        volunteers_without_profile = User.objects.filter(role='VOLUNTEER', volunteer_profile__isnull=True)
        for u in volunteers_without_profile:
            VolunteerProfile.objects.create(user=u)

        volunteers = (VolunteerProfile.objects.filter(is_active=True)
                      .select_related('user', 'user__profile')
                      .prefetch_related('availability', 'skills'))
        
        # Filter by shelter
        shelter_id = request.query_params.get('shelter_id')
        if shelter_id:
            volunteers = volunteers.filter(shelter_id=shelter_id)
        
        # Filter by real login presence: only volunteers who are currently
        # online (account recorded activity within the online window). This is
        # true presence via last_activity_at, not the weekly availability schedule.
        online_now = request.query_params.get('online_now') or request.query_params.get('available_now')
        if online_now and str(online_now).lower() == 'true':
            from datetime import timedelta
            from django.utils import timezone
            cutoff = timezone.now() - timedelta(minutes=5)
            volunteers = volunteers.filter(user__last_activity_at__gte=cutoff)
        
        # Search by name or skills
        search = request.query_params.get('search')
        if search:
            from django.db.models import Q
            volunteers = volunteers.filter(
                Q(user__profile__first_name__icontains=search) |
                Q(user__profile__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total = volunteers.count()
        volunteers = volunteers[(page - 1) * page_size: page * page_size]
        
        return success_response({
            'results': VolunteerProfileSerializer(volunteers, many=True).data,
            'count': total,
            'page': page,
            'page_size': page_size,
        })


class VolunteerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = VolunteerProfile.objects.get(pk=pk)
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer not found", 404)
        return success_response(VolunteerProfileSerializer(profile).data)


class AcceptAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.rescue.models import RescueAssignment
        from django.utils import timezone
        try:
            assignment = RescueAssignment.objects.get(pk=pk, volunteer__user=request.user)
        except RescueAssignment.DoesNotExist:
            return error_response("NOT_FOUND", "Assignment not found", 404)
        if assignment.status != 'PENDING':
            return error_response("INVALID_STATUS", "Assignment is not pending", 400)
        assignment.status = 'ACCEPTED'
        assignment.accepted_at = timezone.now()
        assignment.save()
        return success_response({"status": assignment.status})


class DeclineAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.rescue.models import RescueAssignment
        try:
            assignment = RescueAssignment.objects.get(pk=pk, volunteer__user=request.user)
        except RescueAssignment.DoesNotExist:
            return error_response("NOT_FOUND", "Assignment not found", 404)
        assignment.status = 'DECLINED'
        assignment.notes = request.data.get('notes', '')
        assignment.save()
        return success_response({"status": assignment.status})


class CompleteAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        from apps.rescue.models import RescueAssignment
        from django.utils import timezone
        try:
            assignment = RescueAssignment.objects.get(pk=pk, volunteer__user=request.user)
        except RescueAssignment.DoesNotExist:
            return error_response("NOT_FOUND", "Assignment not found", 404)
        if assignment.status not in ['ACCEPTED', 'IN_PROGRESS']:
            return error_response("INVALID_STATUS", "Assignment cannot be completed at this stage", 400)
        assignment.status = 'COMPLETED'
        assignment.completed_at = timezone.now()
        assignment.save()
        # Increment volunteer rescue count
        vol = assignment.volunteer
        vol.total_rescues_completed += 1
        vol.save(update_fields=['total_rescues_completed'])
        return success_response({"status": assignment.status})


class ShelterChangeRequestView(APIView):
    """F1: a volunteer creates a request to move to a different shelter."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer profile not found", 404)

        to_shelter_id = request.data.get('to_shelter') or request.data.get('to_shelter_id')
        if not to_shelter_id:
            return error_response("VALIDATION_FAILED", "to_shelter is required", 400)

        from apps.shelters.models import Shelter
        to_shelter = Shelter.objects.filter(pk=to_shelter_id, is_deleted=False, is_active=True).first()
        if not to_shelter:
            return error_response("NOT_FOUND", "Target shelter not found", 404)
        if profile.shelter_id and str(profile.shelter_id) == str(to_shelter_id):
            return error_response("INVALID_REQUEST", "You are already assigned to this shelter", 400)
        if ShelterChangeRequest.objects.filter(volunteer=profile, status='PENDING').exists():
            return error_response("PENDING_EXISTS", "You already have a pending change request", 409)

        scr = ShelterChangeRequest.objects.create(
            volunteer=profile,
            from_shelter=profile.shelter,
            to_shelter=to_shelter,
            reason=request.data.get('reason', ''),
        )
        return created_response(ShelterChangeRequestSerializer(scr).data)

    def get(self, request):
        # A volunteer can see their own change requests.
        try:
            profile = request.user.volunteer_profile
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer profile not found", 404)
        qs = ShelterChangeRequest.objects.filter(volunteer=profile).select_related(
            'from_shelter', 'to_shelter')
        return success_response(ShelterChangeRequestSerializer(qs, many=True).data)


class ShelterChangeRequestListView(APIView):
    """F1: shelter admins (their shelter) / super admins (all) list change requests."""
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request):
        qs = ShelterChangeRequest.objects.select_related(
            'volunteer__user__profile', 'from_shelter', 'to_shelter')
        if request.user.role == 'SHELTER_ADMIN':
            from apps.shelters.models import Shelter
            shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
            qs = qs.filter(to_shelter=shelter) if shelter else qs.none()
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return success_response(ShelterChangeRequestSerializer(qs, many=True).data)


class ShelterChangeRequestDecisionView(APIView):
    """F1: shelter admin approves/rejects. On approve, reassign the volunteer."""
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def put(self, request, pk, decision):
        try:
            scr = ShelterChangeRequest.objects.select_related('volunteer', 'to_shelter').get(pk=pk)
        except ShelterChangeRequest.DoesNotExist:
            return error_response("NOT_FOUND", "Change request not found", 404)

        if request.user.role == 'SHELTER_ADMIN':
            from apps.shelters.models import Shelter
            shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
            if not shelter or scr.to_shelter_id != shelter.id:
                return error_response("ACCESS_DENIED", "You can only decide requests for your shelter", 403)

        if scr.status != 'PENDING':
            return error_response("ALREADY_DECIDED", "This request has already been decided", 400)

        if decision == 'approve':
            scr.status = 'APPROVED'
            scr.volunteer.shelter = scr.to_shelter
            scr.volunteer.save(update_fields=['shelter'])
        else:
            scr.status = 'REJECTED'
        scr.decided_by = request.user
        scr.decided_at = timezone.now()
        scr.save(update_fields=['status', 'decided_by', 'decided_at'])
        return success_response(ShelterChangeRequestSerializer(scr).data)
