import math
import random

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Shelter, ShelterStaff, IntakeRecord, DischargeRecord
from .serializers import (ShelterSerializer, ShelterSummarySerializer, ShelterStaffSerializer,
                           IntakeRecordSerializer, DischargeRecordSerializer)
from apps.core.responses import success_response, created_response, error_response, no_content_response
from apps.core.permissions import IsSuperAdmin, IsShelterAdminOrSuperAdmin


def _haversine_km(lat1, lng1, lat2, lng2):
    r = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    return r * 2 * math.asin(math.sqrt(a))


def generate_shelter_registration_number():
    """System-assigned, database-unique shelter registration number."""
    for _ in range(25):
        candidate = f"PK-SH-{random.randint(0, 999999):06d}"
        if not Shelter.objects.filter(registration_number=candidate).exists():
            return candidate
    raise RuntimeError("Could not generate a unique shelter registration number.")


class ShelterListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsSuperAdmin()]

    def get(self, request):
        shelters = Shelter.objects.filter(is_deleted=False, is_active=True)
        return success_response(ShelterSummarySerializer(shelters, many=True).data)

    def post(self, request):
        s = ShelterSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)

        # A shelter admin can manage at most one shelter.
        admin = s.validated_data.get('admin')
        if admin and Shelter.objects.filter(admin=admin, is_deleted=False).exists():
            return error_response(
                "ADMIN_ALREADY_ASSIGNED",
                "This shelter admin is already assigned to another shelter.", 400,
                {'admin': ['This admin already manages a shelter.']})

        # E1: city must be one of the controlled CITIES lookup values.
        from apps.core.models import LookupValue
        city = s.validated_data.get('city', '')
        city_lv = LookupValue.objects.filter(
            category__name='CITIES', is_active=True, display_label=city).first()
        if not city_lv:
            return error_response("VALIDATION_FAILED", "Validation error", 400,
                                  {'city': ['Please select a valid city from the list.']})

        # Location is mandatory and must be picked on the map.
        lat = s.validated_data.get('latitude')
        lng = s.validated_data.get('longitude')
        if lat is None or lng is None:
            return error_response("VALIDATION_FAILED", "Validation error", 400,
                                  {'location': ['Please pick the shelter location on the map.']})

        # The picked point must lie within the selected city's area. Cities
        # without a known centre (e.g. "Other") skip the distance check.
        meta = city_lv.metadata or {}
        c_lat, c_lng = meta.get('lat'), meta.get('lng')
        radius = meta.get('radius_km', 45)
        if c_lat is not None and c_lng is not None:
            if _haversine_km(c_lat, c_lng, lat, lng) > radius:
                return error_response(
                    "VALIDATION_FAILED", "Validation error", 400,
                    {'location': [f'The selected location is outside {city}. '
                                  f'Please pick a point within the city.']})

        shelter = s.save(registration_number=generate_shelter_registration_number())
        return created_response(ShelterSerializer(shelter).data)


class ShelterDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsShelterAdminOrSuperAdmin()]

    def _get_shelter(self, pk):
        try:
            return Shelter.objects.get(pk=pk, is_deleted=False)
        except Shelter.DoesNotExist:
            return None

    def get(self, request, pk):
        shelter = self._get_shelter(pk)
        if not shelter:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        return success_response(ShelterSerializer(shelter).data)

    def put(self, request, pk):
        shelter = self._get_shelter(pk)
        if not shelter:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        # Shelter admin can only edit their own shelter
        if request.user.role == 'SHELTER_ADMIN' and shelter.admin != request.user:
            return error_response("ACCESS_DENIED", "You can only edit your own shelter", 403)
        s = ShelterSerializer(shelter, data=request.data, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)

        # A shelter admin can manage at most one shelter (ignore this shelter itself).
        new_admin = s.validated_data.get('admin')
        if new_admin and Shelter.objects.filter(
                admin=new_admin, is_deleted=False).exclude(pk=shelter.pk).exists():
            return error_response(
                "ADMIN_ALREADY_ASSIGNED",
                "This shelter admin is already assigned to another shelter.", 400,
                {'admin': ['This admin already manages another shelter.']})

        s.save()
        return success_response(ShelterSerializer(shelter).data)

    def delete(self, request, pk):
        if request.user.role != 'SUPER_ADMIN':
            return error_response("ACCESS_DENIED", "Only SUPER_ADMIN can delete shelters", 403)
        shelter = self._get_shelter(pk)
        if not shelter:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        shelter.is_deleted = True
        shelter.save()
        return no_content_response()


class ShelterCapacityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            shelter = Shelter.objects.get(pk=pk, is_deleted=False)
        except Shelter.DoesNotExist:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        return success_response({
            "shelter_id": str(shelter.id),
            "capacity_total": shelter.capacity_total,
            "current_occupancy": shelter.current_occupancy,
            "available_slots": shelter.capacity_total - shelter.current_occupancy,
        })


class ShelterStaffView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request, pk):
        try:
            shelter = Shelter.objects.get(pk=pk, is_deleted=False)
        except Shelter.DoesNotExist:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        staff = ShelterStaff.objects.filter(shelter=shelter, is_active=True).select_related('user')
        return success_response(ShelterStaffSerializer(staff, many=True).data)

    def post(self, request, pk):
        try:
            shelter = Shelter.objects.get(pk=pk, is_deleted=False)
        except Shelter.DoesNotExist:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        s = ShelterStaffSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        if ShelterStaff.objects.filter(shelter=shelter, user_id=request.data.get('user')).exists():
            return error_response("ALREADY_STAFF", "User is already a staff member", 409)
        staff = s.save(shelter=shelter)
        return created_response(ShelterStaffSerializer(staff).data)


class ShelterStaffDetailView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def delete(self, request, pk, user_id):
        try:
            staff = ShelterStaff.objects.get(shelter_id=pk, user_id=user_id)
        except ShelterStaff.DoesNotExist:
            return error_response("NOT_FOUND", "Staff member not found", 404)
        staff.is_active = False
        staff.save()
        return no_content_response()


class ShelterCatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from apps.cats.models import Cat
        from apps.cats.serializers import CatSummarySerializer
        try:
            shelter = Shelter.objects.get(pk=pk, is_deleted=False)
        except Shelter.DoesNotExist:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        cats = Cat.objects.filter(shelter=shelter, is_deleted=False)
        status_filter = request.query_params.get('status')
        if status_filter:
            cats = cats.filter(current_status=status_filter)
        return success_response({
            'results': CatSummarySerializer(cats, many=True).data,
            'count': cats.count()
        })


class ShelterDashboardView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request, pk):
        from apps.cats.models import Cat
        try:
            shelter = Shelter.objects.get(pk=pk, is_deleted=False)
        except Shelter.DoesNotExist:
            return error_response("NOT_FOUND", "Shelter not found", 404)
        cats_qs = Cat.objects.filter(shelter=shelter, is_deleted=False)
        return success_response({
            "shelter_id": str(shelter.id),
            "shelter_name": shelter.name,
            "capacity_total": shelter.capacity_total,
            "current_occupancy": shelter.current_occupancy,
            "cats_by_status": {
                "in_shelter": cats_qs.filter(current_status='IN_SHELTER').count(),
                "fostered":   cats_qs.filter(current_status='FOSTERED').count(),
                "adopted":    cats_qs.filter(current_status='ADOPTED').count(),
                "lost":       cats_qs.filter(current_status='LOST').count(),
            },
            "staff_count": ShelterStaff.objects.filter(shelter=shelter, is_active=True).count(),
        })


class MyShelterDashboardView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request):
        from apps.accounts.models import User
        from apps.adoption.models import AdoptionApplication
        from apps.cats.models import Cat
        from apps.cats.serializers import CatSummarySerializer
        from apps.inventory.models import InventoryItem
        from apps.volunteers.models import VolunteerProfile

        # Get the shelter for this shelter admin
        if request.user.role == 'SUPER_ADMIN':
            # For super admin, try to get the first shelter (or return error)
            shelter = Shelter.objects.filter(is_deleted=False, is_active=True).first()
            if not shelter:
                return error_response("NO_SHELTER", "No shelters available", 404)
        elif request.user.role == 'SHELTER_ADMIN':
            # Get the shelter managed by this admin (using filter().first() to avoid MultipleObjectsReturned)
            shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
            if not shelter:
                return error_response("NO_SHELTER", "You are not assigned to any shelter", 404)
        else:
            return error_response("ACCESS_DENIED", "Invalid role for this endpoint", 403)

        # Basic shelter info
        cats_qs = Cat.objects.filter(shelter=shelter, is_deleted=False)
        cats_count = cats_qs.count()
        
        # Volunteers assigned to this shelter
        volunteer_count = VolunteerProfile.objects.filter(shelter=shelter, is_active=True).count()
        
        # Pending adoption applications for cats in this shelter
        pending_applications = AdoptionApplication.objects.filter(
            shelter=shelter,
            status='PENDING'
        ).count()
        
        # Low stock items (stock below 10)
        low_stock_count = InventoryItem.objects.filter(
            shelter=shelter,
            is_deleted=False,
            current_quantity__lt=10
        ).count()
        
        # Recent cats (last 10 intake)
        recent_cats_qs = cats_qs.filter(current_status='IN_SHELTER').order_by('-intake_date')[:10]
        recent_cats = CatSummarySerializer(recent_cats_qs, many=True).data
        
        # Pending applications with details
        pending_apps_qs = AdoptionApplication.objects.filter(
            shelter=shelter,
            status='PENDING'
        ).select_related('applicant', 'cat').order_by('-created_at')[:10]
        
        pending_apps = []
        for app in pending_apps_qs:
            pending_apps.append({
                'id': str(app.id),
                'applicant_name': f"{app.applicant.profile.first_name} {app.applicant.profile.last_name}" if hasattr(app.applicant, 'profile') else app.applicant.email,
                'cat_name': app.cat.name if app.cat else 'Unknown',
                'created_at': app.created_at.isoformat(),
            })

        return success_response({
            'shelter_id': str(shelter.id),
            'shelter_name': shelter.name,
            'city': shelter.city,
            'capacity': shelter.capacity_total,
            'cats_count': cats_count,
            'volunteer_count': volunteer_count,
            'pending_applications': pending_applications,
            'low_stock_count': low_stock_count,
            'recent_cats': recent_cats,
            'pending_apps': pending_apps,
        })


class IntakeView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request, shelter_id):
        if shelter_id == 'me':
            shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
            if not shelter:
                return error_response("NO_SHELTER", "You do not manage any shelter", 404)
            shelter_id = shelter.id
        records = IntakeRecord.objects.filter(shelter_id=shelter_id).select_related('cat', 'processed_by')
        return success_response(IntakeRecordSerializer(records, many=True).data)

    def post(self, request, shelter_id):
        from apps.cats.models import Cat
        if shelter_id == 'me':
            shelter = Shelter.objects.filter(admin=request.user, is_deleted=False).first()
            if not shelter:
                return error_response("NO_SHELTER", "You do not manage any shelter", 404)
        else:
            try:
                shelter = Shelter.objects.get(pk=shelter_id, is_deleted=False)
            except Shelter.DoesNotExist:
                return error_response("NOT_FOUND", "Shelter not found", 404)

        # Map form fields from IntakePage.jsx
        cat_name = request.data.get('cat_name', 'Unknown')
        microchip = request.data.get('microchip_number', '')
        
        # Create new Cat record first
        cat = Cat.objects.create(
            name=cat_name,
            current_status='IN_SHELTER',
            shelter=shelter,
            is_microchipped=bool(microchip),
            microchip_id=microchip or None,
            created_by=request.user,
        )

        data = request.data.copy()
        data['cat'] = str(cat.id)
        data['shelter'] = str(shelter.id)
        
        # Map intake reason (Frontend reason "STRAY" maps to backend intake_source "STRAY_FOUND")
        reason = request.data.get('reason', 'STRAY')
        if reason == 'STRAY':
            data['intake_source'] = 'STRAY_FOUND'
        else:
            data['intake_source'] = reason
            
        # Map health condition
        cond = request.data.get('condition_on_arrival', '').lower()
        if 'sick' in cond:
            data['initial_health_status'] = 'SICK'
        elif 'injur' in cond:
            data['initial_health_status'] = 'INJURED'
        elif 'health' in cond:
            data['initial_health_status'] = 'HEALTHY'
        else:
            data['initial_health_status'] = 'UNKNOWN'

        s = IntakeRecordSerializer(data=data)
        if not s.is_valid():
            # Clean up created cat if intake record fails
            cat.delete()
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        record = s.save(shelter=shelter, processed_by=request.user)
        return created_response(IntakeRecordSerializer(record).data)


class IntakeRecordDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            record = IntakeRecord.objects.get(pk=pk)
        except IntakeRecord.DoesNotExist:
            return error_response("NOT_FOUND", "Intake record not found", 404)
        return success_response(IntakeRecordSerializer(record).data)


class DischargeView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def _resolve_shelter(self, request, shelter_id):
        if shelter_id == 'me':
            return Shelter.objects.filter(admin=request.user, is_deleted=False).first()
        return Shelter.objects.filter(pk=shelter_id, is_deleted=False).first()

    def post(self, request, shelter_id):
        shelter = self._resolve_shelter(request, shelter_id)
        if not shelter:
            return error_response("NO_SHELTER", "You do not manage any shelter", 404)

        discharge_type = request.data.get('reason', 'ADOPTED')

        # G1: an ADOPTED discharge is driven entirely by an adoption request.
        # A registered adopter must have applied for the cat; the admin picks
        # that request and confirming here finalizes the adoption + discharge.
        if discharge_type == 'ADOPTED':
            return self._discharge_adopted(request, shelter)

        # Non-adoption discharges (transfer, deceased, returned to owner, …) do
        # not need an adopter — the admin selects one of the shelter's cats.
        return self._discharge_other(request, shelter, discharge_type)

    def _discharge_adopted(self, request, shelter):
        from django.db import transaction
        from apps.adoption.models import AdoptionApplication, AdoptionListing, AdoptionRecord

        app_id = request.data.get('application') or request.data.get('application_id')
        if not app_id:
            return error_response(
                'NO_ADOPTION_REQUEST',
                'A cat can only be discharged as adopted through an adoption request. '
                'A registered adopter must apply for the cat first, then select their '
                'request here.', 400)

        application = (AdoptionApplication.objects
                       .filter(pk=app_id).select_related('cat', 'applicant').first())
        if not application:
            return error_response('NOT_FOUND', 'Adoption request not found', 404)
        if application.shelter_id != shelter.id:
            return error_response('ACCESS_DENIED', 'This adoption request is not for your shelter', 403)
        if application.status in ['REJECTED', 'WITHDRAWN']:
            return error_response('INVALID_REQUEST', 'This adoption request is no longer active', 400)

        cat = application.cat
        applicant = application.applicant

        with transaction.atomic():
            # Finalize the adoption (idempotent if it was already approved).
            record, _created = AdoptionRecord.objects.get_or_create(
                cat=cat,
                defaults={
                    'adopter': applicant, 'shelter': shelter, 'application': application,
                    'adoption_fee_paid': request.data.get('adoption_fee_paid', 0) or 0,
                },
            )
            application.status = 'APPROVED'
            application.reviewed_by = request.user
            application.save(update_fields=['status', 'reviewed_by', 'updated_at'])

            cat.current_status = 'ADOPTED'
            cat.owner = applicant
            cat.save(update_fields=['current_status', 'owner', 'updated_at'])

            AdoptionListing.objects.filter(cat=cat).update(is_active=False)
            # Any other pending requests for this cat are now moot.
            AdoptionApplication.objects.filter(
                cat=cat, status__in=['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW_SCHEDULED'],
            ).exclude(pk=application.pk).update(status='REJECTED')

            discharge = DischargeRecord.objects.create(
                cat=cat, shelter=shelter, discharge_type='ADOPTED',
                processed_by=request.user, notes=request.data.get('discharge_notes', ''))

        try:
            from apps.notifications.tasks import send_notification
            send_notification.delay(
                str(applicant.id), 'Adoption finalized 🎉',
                f"You have adopted {cat.name or 'a cat'}! The shelter has discharged the cat to you.",
                'ADOPTION')
        except Exception:
            pass

        return created_response(DischargeRecordSerializer(discharge).data)

    def _discharge_other(self, request, shelter, discharge_type):
        from apps.cats.models import Cat

        cat_id = request.data.get('cat_id')
        if not cat_id:
            return error_response('VALIDATION_FAILED', 'Please select a cat to discharge.', 400)
        cat = Cat.objects.filter(pk=cat_id, shelter=shelter, is_deleted=False).first()
        if not cat:
            return error_response('NOT_FOUND', 'Cat not found in your shelter', 404)

        data = request.data.copy()
        data['cat'] = str(cat.id)
        data['shelter'] = str(shelter.id)
        data['discharge_type'] = discharge_type
        data['notes'] = request.data.get('discharge_notes', '')

        s = DischargeRecordSerializer(data=data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        record = s.save(shelter=shelter, processed_by=request.user)

        discharge_status_map = {
            'FOSTERED': 'FOSTERED',
            'TRANSFERRED': 'IN_SHELTER',
            'EUTHANIZED': 'DECEASED',
            'DECEASED': 'DECEASED',
            'RETURNED_TO_OWNER': 'ADOPTED',
            'ESCAPED': 'LOST',
            'OTHER': 'UNKNOWN',
        }
        new_status = discharge_status_map.get(record.discharge_type, 'UNKNOWN')
        cat.current_status = new_status
        if record.discharge_type == 'TRANSFERRED' and record.destination_shelter:
            cat.shelter = record.destination_shelter
        else:
            cat.shelter = None
        cat.save(update_fields=['current_status', 'shelter'])
        return created_response(DischargeRecordSerializer(record).data)
