from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db import transaction
from .models import Cat, CatPhoto
from .serializers import (CatSerializer, CatSummarySerializer, CatAdminSummarySerializer,
                          CatPhotoSerializer)
from apps.core.responses import success_response, created_response, error_response, no_content_response
from apps.core.permissions import IsShelterAdminOrSuperAdmin, IsVetOrShelterAdmin
from apps.audit.utils import log_audit

ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png']
MAX_PHOTO_BYTES = 5 * 1024 * 1024  # 5MB


def get_managed_shelter(user):
    """Return the shelter a SHELTER_ADMIN manages (handles FK reverse manager)."""
    shelter = getattr(user, 'managed_shelter', None)
    if hasattr(shelter, 'first'):
        return shelter.first()
    return shelter


def get_volunteer_shelter(user):
    """Return the shelter a VOLUNTEER is affiliated with, or None.

    Reverse one-to-one access (``volunteer_profile``) raises a DoesNotExist that
    Django makes a subclass of AttributeError, so ``hasattr`` is safe here — the
    same pattern used elsewhere in the codebase.
    """
    if hasattr(user, 'volunteer_profile'):
        return user.volunteer_profile.shelter
    return None


def validate_photo_files(photos):
    """C4: validate uploaded cat photos (JPEG/PNG, <=5MB). Returns error dict or None."""
    for pf in photos:
        content_type = getattr(pf, 'content_type', '')
        if content_type and content_type not in ALLOWED_PHOTO_TYPES:
            return {'photo': ['Only JPEG or PNG images are allowed.']}
        if getattr(pf, 'size', 0) > MAX_PHOTO_BYTES:
            return {'photo': ['Each image must be 5MB or smaller.']}
    return None

VALID_TRANSITIONS = {
    'UNKNOWN':    ['IN_SHELTER', 'LOST'],
    'IN_SHELTER': ['FOSTERED', 'ADOPTED', 'LOST', 'DECEASED'],
    'FOSTERED':   ['IN_SHELTER', 'ADOPTED', 'LOST', 'DECEASED'],
    'ADOPTED':    ['LOST', 'DECEASED', 'IN_SHELTER'],
    'LOST':       ['IN_SHELTER', 'DECEASED'],
}


def clean_request_data(data):
    mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
    for field in ['shelter', 'owner', 'breed']:
        if field in mutable_data:
            val = mutable_data[field]
            if hasattr(val, 'strip'):
                val = val.strip()
            if val == '' or val == 'null' or val == 'None' or val is None:
                mutable_data[field] = None

    breed_val = mutable_data.get('breed')
    if breed_val:
        import uuid
        is_uuid = False
        try:
            uuid.UUID(str(breed_val))
            is_uuid = True
        except ValueError:
            pass
            
        if not is_uuid:
            from apps.core.models import LookupCategory, LookupValue
            category, _ = LookupCategory.objects.get_or_create(name='BREED')
            lv, _ = LookupValue.objects.get_or_create(
                category=category,
                value=str(breed_val).upper(),
                defaults={'display_label': str(breed_val).replace('_', ' ').title()}
            )
            mutable_data['breed'] = str(lv.id)
    return mutable_data


class CatListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _get_managed_shelter(self, user):
        return get_managed_shelter(user)

    def get(self, request):
        """
        GET /cats/
        
        Returns cats based on user role:
        - SHELTER_ADMIN: Only cats in their managed shelter
        - CAT_OWNER / ADOPTER: Only cats they own (owner=request.user)
        - Others: All cats (filtered by query params)
        
        Query params: gender, status, shelter_id, breed_id, page, page_size
        """
        qs = Cat.objects.filter(is_deleted=False).select_related('breed', 'shelter', 'owner__profile')
        if request.query_params.get('gender'):
            qs = qs.filter(gender=request.query_params['gender'])
        status_param = request.query_params.get('status') or request.query_params.get('current_status')
        if status_param:
            qs = qs.filter(current_status=status_param)
        if request.query_params.get('shelter_id'):
            qs = qs.filter(shelter_id=request.query_params['shelter_id'])
        if request.query_params.get('breed_id'):
            qs = qs.filter(breed_id=request.query_params['breed_id'])
        
        # CRITICAL: Role-based filtering for data isolation
        # Scope SHELTER_ADMIN to their shelter
        if request.user.role == 'SHELTER_ADMIN':
            managed = self._get_managed_shelter(request.user)
            if managed:
                qs = qs.filter(shelter=managed)
        # Scope CAT_OWNER and ADOPTER to the cats they own ONLY
        elif request.user.role in ('CAT_OWNER', 'ADOPTER'):
            qs = qs.filter(owner=request.user)
        
        page      = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total     = qs.count()
        cats      = qs[(page - 1) * page_size: page * page_size]
        # C6: super admin sees owner details on each cat.
        serializer_cls = CatAdminSummarySerializer if request.user.role == 'SUPER_ADMIN' else CatSummarySerializer
        return success_response({
            "results":   serializer_cls(cats, many=True).data,
            "count":     total,
            "page":      page,
            "page_size": page_size,
        })

    def post(self, request):
        # C1: cat creation is available to every authenticated role (except the
        # read-only GUEST pseudo-role). Ownership/shelter context is set per role.
        if request.user.role == 'GUEST':
            return error_response("ACCESS_DENIED", "Guests cannot create cats", 403)

        data = clean_request_data(request.data)
        s = CatSerializer(data=data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)

        # C4: a primary photo is mandatory at registration.
        photos = request.FILES.getlist('photos') or request.FILES.getlist('photo')
        if not photos:
            return error_response("VALIDATION_FAILED", "Validation error", 400,
                                  {'photo': ['A cat photo is required.']})
        photo_error = validate_photo_files(photos)
        if photo_error:
            return error_response("VALIDATION_FAILED", "Validation error", 400, photo_error)

        role = request.user.role
        shelter = s.validated_data.get('shelter')
        owner = None
        status = 'UNKNOWN'

        # A shelter volunteer can add cats to THEIR OWN shelter (same form as a
        # shelter admin) when they use the shelter add-cat flow, which sends
        # this flag. Without it, a volunteer registers a personally-owned cat.
        add_to_shelter = str(request.data.get('add_to_shelter', '')).lower() in ('true', '1', 'yes', 'on')

        if role in ['SHELTER_ADMIN', 'VET', 'SUPER_ADMIN']:
            if role == 'SHELTER_ADMIN':
                managed = self._get_managed_shelter(request.user)
                if not managed:
                    return error_response("ACCESS_DENIED", "Shelter admin is not assigned to a shelter", 403)
                if shelter and shelter != managed:
                    return error_response("ACCESS_DENIED", "Cannot create cats for another shelter", 403)
                shelter = managed
            if role == 'VET' and shelter is None:
                return error_response("VALIDATION_FAILED", "Shelter is required for vet-created cats", 400)
            status = 'IN_SHELTER' if shelter else 'UNKNOWN'
        elif role == 'VOLUNTEER' and add_to_shelter:
            # Bind strictly to the volunteer's OWN shelter — they cannot choose
            # an arbitrary one. This creates a shelter cat (system-assigned
            # microchip below), not a personally-owned cat.
            vol_shelter = get_volunteer_shelter(request.user)
            if not vol_shelter:
                return error_response(
                    "ACCESS_DENIED",
                    "You are not affiliated with a shelter, so you cannot add shelter cats.",
                    403,
                )
            shelter = vol_shelter
            owner = None
            status = 'IN_SHELTER'
        else:
            # CAT_OWNER, ADOPTER, VOLUNTEER (personal cats), etc. — cats they own.
            owner = request.user
            shelter = None
            status = 'OWNED'

        # Microchip policy:
        #   • Shelter cats — the system assigns a standards-compliant 15-digit
        #     ISO 11784/11785 chip (a physical microchip writer may do this in
        #     future via MicrochipGenerateView). Any client-supplied value is
        #     ignored for shelter cats.
        #   • Owned / independent cats — honor the owner-supplied chip, which the
        #     serializer has already validated (asked only when microchipped).
        microchip_kwargs = {}
        if shelter is not None:
            from .microchip import generate_microchip_id
            microchip_kwargs = {
                'is_microchipped': True,
                'microchip_id': generate_microchip_id(),
            }

        with transaction.atomic():
            cat = s.save(
                created_by=request.user,
                owner=owner,
                shelter=shelter,
                current_status=status,
                **microchip_kwargs,
            )
            for index, photo_file in enumerate(photos):
                is_primary = (index == 0)
                cp = CatPhoto(cat=cat, is_primary=is_primary,
                              uploaded_by=request.user)
                # Store the file first (assigns the final name) so we can set
                # photo_url up front and persist the row in a single INSERT
                # instead of an INSERT followed by an UPDATE.
                cp.photo.save(photo_file.name, photo_file, save=False)
                cp.photo_url = request.build_absolute_uri(cp.photo.url)
                cp.save()
                if is_primary:
                    cat.primary_photo_url = cp.photo_url
                    cat.save(update_fields=['primary_photo_url'])
        log_audit(request, 'CREATE', cat)
        return created_response(CatSerializer(cat).data)


class MicrochipGenerateView(APIView):
    """Generate a fresh, unused 15-digit ISO 11784/11785 microchip number.

    Exposed as a standalone endpoint so a physical microchip writer/scanner can
    be integrated later without touching the cat-creation flow. The returned
    number is not reserved until it is persisted on a cat.
    """
    permission_classes = [IsVetOrShelterAdmin]

    def post(self, request):
        from .microchip import generate_microchip_id
        return created_response({'microchip_id': generate_microchip_id()})


class CatDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_cat(self, pk):
        try:
            return Cat.objects.get(pk=pk, is_deleted=False)
        except Cat.DoesNotExist:
            return None

    def get(self, request, pk):
        cat = self._get_cat(pk)
        if not cat:
            return error_response("NOT_FOUND", "Cat not found", 404)
        return success_response(CatSerializer(cat).data)

    def put(self, request, pk):
        cat = self._get_cat(pk)
        if not cat:
            return error_response("NOT_FOUND", "Cat not found", 404)
        if request.user.role == 'SHELTER_ADMIN':
            managed = get_managed_shelter(request.user)
            if managed and cat.shelter_id != managed.id:
                return error_response("ACCESS_DENIED", "Cannot edit cats outside your shelter", 403)
        data = clean_request_data(request.data)
        s = CatSerializer(cat, data=data, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        s.save()
        return success_response(CatSerializer(cat).data)

    def delete(self, request, pk):
        """
        DELETE /cats/{id}/
        
        Behavior by role:
        - CAT_OWNER: Can only unlink cats they own (sets owner=None, cat remains in system)
        - SHELTER_ADMIN/SUPER_ADMIN: Can soft-delete cats (sets is_deleted=True)
        
        This prevents CAT_OWNERs from deleting system cats or cats they don't own.
        """
        cat = self._get_cat(pk)
        if not cat:
            return error_response("NOT_FOUND", "Cat not found", 404)
        
        # CAT_OWNER: Can only unlink cats they own
        if request.user.role == 'CAT_OWNER':
            # Strict ownership check
            if cat.owner != request.user:
                return error_response("ACCESS_DENIED", "You do not own this cat", 403)
            
            # Additional safety: verify the cat is actually owned (not shelter cat)
            if cat.current_status not in ['OWNED', 'LOST'] or cat.shelter is not None:
                return error_response("ACCESS_DENIED", "Cannot unlink shelter cats", 403)
            
            # Unlink ownership (cat remains in system)
            cat.owner = None
            cat.current_status = 'UNKNOWN'  # Reset status when unlinked
            cat.save(update_fields=['owner', 'current_status', 'updated_at'])
            return no_content_response()

        # Only admins can proceed beyond this point
        if request.user.role not in ['SHELTER_ADMIN', 'SUPER_ADMIN']:
            return error_response("ACCESS_DENIED", "Insufficient permissions", 403)

        # Prevent deletion of adopted cats
        if cat.current_status == 'ADOPTED':
            return error_response("CAT_HAS_OWNER",
                                  "Cannot delete an adopted cat. Transfer ownership first.", 400)
        
        # Soft delete
        cat.is_deleted = True
        cat.save()
        return no_content_response()


class CatStatusView(APIView):
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def put(self, request, pk):
        try:
            cat = Cat.objects.get(pk=pk, is_deleted=False)
        except Cat.DoesNotExist:
            return error_response("NOT_FOUND", "Cat not found", 404)
        new_status = request.data.get('status')
        allowed    = VALID_TRANSITIONS.get(cat.current_status, [])
        if new_status not in allowed:
            return error_response("INVALID_TRANSITION",
                                  f"Cannot move from {cat.current_status} to {new_status}", 400)
        cat.current_status = new_status
        cat.save(update_fields=['current_status', 'updated_at'])
        
        # Auto-create adoption listing when cat enters shelter
        if new_status == 'IN_SHELTER' and cat.shelter:
            from apps.adoption.models import AdoptionListing
            AdoptionListing.objects.get_or_create(
                cat=cat,
                defaults={
                    'shelter': cat.shelter,
                    'is_active': True,
                    'adoption_fee': 0
                }
            )
        
        if new_status == 'LOST':
            from apps.lost_found.tasks import auto_create_lost_alert
            auto_create_lost_alert.delay(str(cat.id), str(request.user.id))
        
        # Deactivate listings when cat is no longer available
        if new_status in ['ADOPTED', 'FOSTERED', 'LOST', 'DECEASED']:
            from apps.adoption.models import AdoptionListing
            AdoptionListing.objects.filter(cat=cat).update(is_active=False)
        
        return success_response(CatSerializer(cat).data)


class CatPublicListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Cat.objects.filter(
            is_deleted=False, current_status='IN_SHELTER'
        ).select_related('breed', 'shelter')
        page      = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        total     = qs.count()
        cats      = qs[(page - 1) * page_size: page * page_size]
        return success_response({
            "results": CatSummarySerializer(cats, many=True).data,
            "count":   total,
        })


class CatPhotoView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            cat = Cat.objects.get(pk=pk, is_deleted=False)
        except Cat.DoesNotExist:
            return error_response("NOT_FOUND", "Cat not found", 404)
        if request.user.role == 'SHELTER_ADMIN':
            managed = get_managed_shelter(request.user)
            if managed and cat.shelter_id != managed.id:
                return error_response("ACCESS_DENIED", "Cannot modify cats outside your shelter", 403)
        existing_count = CatPhoto.objects.filter(cat=cat, is_deleted=False).count()
        if existing_count >= 10:
            return error_response("MAX_PHOTOS", "A cat can have at most 10 photos", 400)
        photos = request.FILES.getlist('photos')
        results = []
        with transaction.atomic():
            for photo_file in photos:
                is_primary = (existing_count == 0 and len(results) == 0)
                cp = CatPhoto.objects.create(
                    cat=cat, photo=photo_file, is_primary=is_primary,
                    uploaded_by=request.user)
                cp.photo_url = request.build_absolute_uri(cp.photo.url)
                cp.save(update_fields=['photo_url'])
                if is_primary:
                    cat.primary_photo_url = cp.photo_url
                    cat.save(update_fields=['primary_photo_url'])
                results.append(CatPhotoSerializer(cp).data)
        return created_response(results)

    def delete(self, request, pk, photo_pk):
        try:
            photo = CatPhoto.objects.get(pk=photo_pk, cat_id=pk, is_deleted=False)
        except CatPhoto.DoesNotExist:
            return error_response("NOT_FOUND", "Photo not found", 404)
        photo.is_deleted = True
        photo.save()
        if photo.is_primary:
            next_photo = CatPhoto.objects.filter(
                cat_id=pk, is_deleted=False).order_by('uploaded_at').first()
            cat = Cat.objects.get(pk=pk)
            if next_photo:
                next_photo.is_primary = True
                next_photo.save()
                cat.primary_photo_url = next_photo.photo_url
            else:
                cat.primary_photo_url = ''
            cat.save(update_fields=['primary_photo_url'])
        return no_content_response()
