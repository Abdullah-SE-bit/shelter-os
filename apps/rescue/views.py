import math
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import RescueReport, RescueAssignment
from .serializers import RescueReportSerializer, RescueAssignmentSerializer
from apps.core.responses import success_response, created_response, error_response, no_content_response
from apps.core.permissions import IsShelterAdminOrSuperAdmin


def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


class RescueReportListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Q
        qs = RescueReport.objects.filter(is_deleted=False).select_related(
            'reporter', 'reporter__profile', 'assigned_volunteer', 'assigned_volunteer__profile')
        role = request.user.role
        if role in ['SHELTER_ADMIN', 'SUPER_ADMIN', 'VET']:
            pass  # full visibility
        elif role == 'VOLUNTEER':
            # D2: volunteers see all open reports (regardless of reporter role,
            # including super-admin-created ones), plus their own and any
            # assigned to them — never filtered out by reporter role.
            qs = qs.filter(
                Q(status__in=['PENDING', 'ASSIGNED', 'IN_PROGRESS'])
                | Q(reporter=request.user)
                | Q(assigned_volunteer=request.user)
            )
        else:
            # CAT_OWNER / ADOPTER only see the reports they filed.
            qs = qs.filter(reporter=request.user)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        urgency_filter = request.query_params.get('urgency_level') or request.query_params.get('urgency')
        if urgency_filter:
            qs = qs.filter(urgency_level=urgency_filter)
        
        # Paginate results
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total = qs.count()
        reports = qs[(page - 1) * page_size: page * page_size]
        
        return success_response({
            'results': RescueReportSerializer(reports, many=True).data,
            'count': total,
        })

    def post(self, request):
        s = RescueReportSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        report = s.save(reporter=request.user)
        return created_response(RescueReportSerializer(report).data)


class NearbyRescueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius_km = float(request.query_params.get('radius_km', 10))
        if not lat or not lng:
            return error_response("MISSING_PARAMS", "lat and lng are required", 400)
        lat, lng = float(lat), float(lng)
        reports = RescueReport.objects.filter(is_deleted=False, status='PENDING')
        nearby = [r for r in reports if haversine(lat, lng, r.latitude, r.longitude) <= radius_km]
        return success_response(RescueReportSerializer(nearby, many=True).data)


class RescueReportDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_report(self, pk):
        try:
            return RescueReport.objects.get(pk=pk, is_deleted=False)
        except RescueReport.DoesNotExist:
            return None

    def get(self, request, pk):
        report = self._get_report(pk)
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        return success_response(RescueReportSerializer(report).data)

    def put(self, request, pk):
        report = self._get_report(pk)
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        if report.reporter != request.user and request.user.role not in ['SHELTER_ADMIN', 'SUPER_ADMIN']:
            return error_response("ACCESS_DENIED", "Insufficient permissions", 403)
        s = RescueReportSerializer(report, data=request.data, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        s.save()
        return success_response(RescueReportSerializer(report).data)

    def delete(self, request, pk):
        report = self._get_report(pk)
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        if report.reporter != request.user and request.user.role != 'SUPER_ADMIN':
            return error_response("ACCESS_DENIED", "Insufficient permissions", 403)
        report.is_deleted = True
        report.save()
        return no_content_response()


class AssignRescueView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def post(self, request, pk):
        from apps.volunteers.models import VolunteerProfile
        report = RescueReport.objects.filter(pk=pk, is_deleted=False).first()
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        volunteer_id = request.data.get('volunteer_id')
        try:
            volunteer = VolunteerProfile.objects.get(pk=volunteer_id, is_active=True)
        except VolunteerProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Volunteer not found", 404)
        assignment = RescueAssignment.objects.create(
            rescue_report=report, volunteer=volunteer)
        report.status = 'ASSIGNED'
        report.assigned_volunteer = volunteer.user  # D1: so the rescuer name shows
        report.save(update_fields=['status', 'assigned_volunteer'])
        return created_response(RescueAssignmentSerializer(assignment).data)


class UpdateRescueStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        report = RescueReport.objects.filter(pk=pk, is_deleted=False).first()
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        new_status = request.data.get('status')
        report.status = new_status
        report.save(update_fields=['status', 'updated_at'])
        return success_response(RescueReportSerializer(report).data)


class ResolveRescueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        report = RescueReport.objects.filter(pk=pk, is_deleted=False).first()
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        report.status = 'RESOLVED'
        report.resolved_at = timezone.now()
        report.resolution_notes = request.data.get('resolution_notes', '')
        report.save(update_fields=['status', 'resolved_at', 'resolution_notes'])
        return success_response(RescueReportSerializer(report).data)


class SuggestAssignmentView(APIView):
    """Suggest best volunteer for a rescue report based on proximity."""
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request, report_id):
        from apps.volunteers.models import VolunteerProfile
        report = RescueReport.objects.filter(pk=report_id, is_deleted=False).first()
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        volunteers = VolunteerProfile.objects.filter(
            is_active=True,
            last_known_latitude__isnull=False,
            last_known_longitude__isnull=False,
        )
        scored = []
        for v in volunteers:
            dist = haversine(report.latitude, report.longitude,
                             v.last_known_latitude, v.last_known_longitude)
            if dist <= v.service_radius_km:
                scored.append({'volunteer_id': str(v.id), 'distance_km': round(dist, 2),
                                'total_rescues': v.total_rescues_completed})
        scored.sort(key=lambda x: x['distance_km'])
        return success_response(scored[:5])


class AutoAssignView(APIView):
    """Auto-assign the nearest available volunteer."""
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def post(self, request, report_id):
        from apps.volunteers.models import VolunteerProfile
        report = RescueReport.objects.filter(pk=report_id, is_deleted=False).first()
        if not report:
            return error_response("NOT_FOUND", "Rescue report not found", 404)
        volunteers = VolunteerProfile.objects.filter(
            is_active=True,
            last_known_latitude__isnull=False,
            last_known_longitude__isnull=False,
        )
        best = None
        best_dist = float('inf')
        for v in volunteers:
            dist = haversine(report.latitude, report.longitude,
                             v.last_known_latitude, v.last_known_longitude)
            if dist <= v.service_radius_km and dist < best_dist:
                best = v
                best_dist = dist
        if not best:
            return error_response("NO_VOLUNTEER", "No available volunteer found nearby", 404)
        assignment = RescueAssignment.objects.create(rescue_report=report, volunteer=best)
        report.status = 'ASSIGNED'
        report.assigned_volunteer = best.user  # D1: so the rescuer name shows
        report.save(update_fields=['status', 'assigned_volunteer'])
        return created_response(RescueAssignmentSerializer(assignment).data)
