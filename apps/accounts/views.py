import uuid
import hashlib
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import AccessToken

from .models import User, UserProfile, UserAddress, EmergencyContact, EmailVerification, PasswordReset, RefreshToken
from .serializers import (RegisterSerializer, LoginSerializer, UserDetailSerializer,
                           UserProfileSerializer, UserAddressSerializer,
                           EmergencyContactSerializer, PasswordResetRequestSerializer,
                           PasswordResetConfirmSerializer, UserSearchSerializer,
                           VetProfileSerializer, VetAppealSubmitSerializer)
from apps.core.responses import success_response, created_response, error_response, no_content_response
from apps.core.permissions import IsSuperAdmin, IsShelterAdminOrSuperAdmin
from apps.audit.utils import log_audit
from . import vet_workflow


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


ACCESS_TOKEN_LIFETIME = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME']
REFRESH_TOKEN_LIFETIME = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME']
JWT_ALGORITHM = settings.SIMPLE_JWT['ALGORITHM']


def login_attempts_key(email: str) -> str:
    return f'login_attempts:{email.lower()}'


def login_lockout_key(email: str) -> str:
    return f'login_lockout:{email.lower()}'


def verification_rate_key(user_id: str) -> str:
    return f'verification_resend:{user_id}'


def reset_rate_key(email: str) -> str:
    return f'password_reset_request:{email.lower()}'


def set_login_attempts(email: str, attempts: int) -> None:
    cache.set(login_attempts_key(email), attempts, timeout=int(REFRESH_TOKEN_LIFETIME.total_seconds()))


def issue_access_token(user: User) -> str:
    token = AccessToken.for_user(user)
    token.set_exp(lifetime=ACCESS_TOKEN_LIFETIME)
    token['sub'] = str(user.id)
    token['role'] = user.role
    return str(token)


def create_refresh_token_record(user: User, device_info=None) -> str:
    raw_refresh_token = str(uuid.uuid4())
    refresh_jti = str(uuid.uuid4())
    RefreshToken.objects.create(
        user=user,
        token_hash=sha256(raw_refresh_token),
        token_jti=refresh_jti,
        device_info=device_info or {},
        expires_at=timezone.now() + REFRESH_TOKEN_LIFETIME,
    )
    return raw_refresh_token


def set_refresh_cookie(response, token_value: str) -> None:
    response.set_cookie(
        'refresh_token',
        token_value,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Strict',
        max_age=int(REFRESH_TOKEN_LIFETIME.total_seconds()),
        path='/',
    )


def revoke_all_refresh_tokens(user: User) -> None:
    RefreshToken.objects.filter(user=user, is_revoked=False).update(is_revoked=True, revoked_at=timezone.now())


def extract_refresh_token(request):
    return (
        request.COOKIES.get('refresh_token')
        or request.data.get('refreshToken')
        or request.data.get('refresh_token')
        or request.data.get('refresh')
    )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400,
                                  details=s.errors)
        data = s.validated_data
        role = data['role']
        details = data.get('role_details') or {}

        # Normalize/validate the (optional) contact phone — e.g. a CAT_OWNER's.
        phone_value = (details.get('phone') or '').strip()
        if phone_value:
            from apps.core.phone import normalize_pk_mobile
            try:
                phone_value = normalize_pk_mobile(phone_value)
            except ValueError as exc:
                return error_response("VALIDATION_FAILED", "Validation error", 400,
                                      {'role_details': {'phone': [str(exc)]}})

        with transaction.atomic():
            user = User.objects.create_user(
                email=data['email'], password=data['password'], role=role)
            UserProfile.objects.create(
                user=user,
                first_name=data['first_name'],
                last_name=data['last_name'],
                date_of_birth=data.get('date_of_birth'),
                phone=phone_value,
            )
            set_login_attempts(user.email, 0)
            # A1: create the role-specific profile so no role gets an empty account.
            self._create_role_profile(user, role, details)
        # B3: record account-creation activity (actor is the new user).
        log_audit(request, 'CREATE', user, actor=user)
        # Send verification email (Celery task)
        from .tasks import send_verification_email
        send_verification_email.delay(str(user.id))
        return created_response({"user_id": str(user.id)},
                                 "Account created. Please verify your email.")

    def _create_role_profile(self, user, role, details):
        if role == 'VOLUNTEER':
            from apps.volunteers.models import VolunteerProfile, VolunteerSkill
            from apps.shelters.models import Shelter
            shelter_id = details.get('shelter_id') or details.get('shelter')
            shelter = Shelter.objects.filter(pk=shelter_id).first() if shelter_id else None
            vp = VolunteerProfile.objects.create(
                user=user,
                shelter=shelter,
                bio=details.get('bio', '') or '',
                service_radius_km=int(details.get('service_radius_km') or 10),
            )
            for skill in (details.get('skills') or []):
                VolunteerSkill.objects.get_or_create(volunteer=vp, skill=skill)
        elif role == 'VET':
            from .models import VetProfile
            from apps.shelters.models import Shelter

            reg = (details.get('registration_number')
                   or details.get('license_number') or '').strip().upper()
            practice_type = (details.get('practice_type') or VetProfile.PRACTICE_CLINIC).strip().upper()
            if practice_type not in (VetProfile.PRACTICE_CLINIC, VetProfile.PRACTICE_SHELTER):
                practice_type = VetProfile.PRACTICE_CLINIC

            specs = details.get('specializations') or details.get('specialization') or []
            if isinstance(specs, str):
                specs = [s.strip() for s in specs.split(',') if s.strip()]
            specs = [str(s).strip() for s in specs if str(s).strip()]

            shelter = None
            clinic_name = clinic_location = clinic_reg = ''
            if practice_type == VetProfile.PRACTICE_SHELTER:
                shelter_id = details.get('shelter_id') or details.get('shelter')
                shelter = Shelter.objects.filter(pk=shelter_id).first() if shelter_id else None
            else:
                clinic_name = details.get('clinic_name', '') or ''
                clinic_location = details.get('clinic_location', '') or ''
                clinic_reg = details.get('clinic_registration_number', '') or ''

            vp = VetProfile.objects.create(
                user=user,
                license_number=reg,
                practice_type=practice_type,
                clinic_name=clinic_name,
                clinic_location=clinic_location,
                clinic_registration_number=clinic_reg,
                target_shelter=shelter,
                specializations=specs,
                specialization=', '.join(specs),
            )
            # Set the initial approval state (shelter approval only if a shelter
            # was chosen) and route the request to the relevant reviewers.
            vet_workflow.initialize_vet_approval(vp)
            vet_workflow.notify_new_request(vp)
        elif role == 'ADOPTER':
            from .models import AdopterProfile
            AdopterProfile.objects.create(
                user=user,
                housing_type=details.get('housing_type', '') or '',
                has_other_pets=bool(details.get('has_other_pets', False)),
                household_info=details.get('household_info', '') or '',
            )
        elif role == 'CAT_OWNER':
            street = (details.get('address') or details.get('street') or '').strip()
            city = (details.get('city') or '').strip()
            if street and city:
                UserAddress.objects.create(
                    user=user,
                    street=street,
                    city=city,
                    country=(details.get('country') or 'Pakistan'),
                    postal_code=(details.get('postal_code') or ''),
                    is_primary=True,
                )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400)
        email    = s.validated_data['email'].lower()
        password = s.validated_data['password']
        if cache.get(login_lockout_key(email)):
            return error_response("ACCOUNT_TEMPORARILY_LOCKED", "Account is temporarily locked", 403)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            attempts = int(cache.get(login_attempts_key(email), 0)) + 1
            set_login_attempts(email, attempts)
            if attempts >= 5:
                cache.set(login_lockout_key(email), True, timeout=15 * 60)
            return error_response("INVALID_CREDENTIALS", "Invalid email or password", 401)
        if not user.is_active:
            return error_response("ACCOUNT_DISABLED", "Account is disabled", 403)
        if not user.check_password(password):
            attempts = int(cache.get(login_attempts_key(email), 0)) + 1
            set_login_attempts(email, attempts)
            if attempts >= 5:
                cache.set(login_lockout_key(email), True, timeout=15 * 60)
            return error_response("INVALID_CREDENTIALS", "Invalid email or password", 401)

        # Vets: enforce the appeal deadline lazily. If the 5-day window has
        # lapsed the account is flagged (deactivated) here and login is denied.
        if user.role == 'VET':
            vp = getattr(user, 'vet_profile', None)
            if vp:
                vet_workflow.enforce_deadline(vp)
                user.refresh_from_db(fields=['is_active'])
                if not user.is_active:
                    set_login_attempts(email, 0)
                    return error_response(
                        "ACCOUNT_DISABLED",
                        "Your veterinarian account is no longer active. Please contact support.",
                        403,
                    )

        # Require a verified email before login. Super admins are exempt; admin-
        # provisioned accounts (e.g. shelter admins) are auto-verified at creation.
        if not user.is_email_verified and user.role != 'SUPER_ADMIN':
            set_login_attempts(email, 0)
            return error_response(
                "EMAIL_NOT_VERIFIED",
                "Please verify your email before logging in. Check your inbox for the verification link.",
                403,
            )

        access_token = issue_access_token(user)
        refresh_token = create_refresh_token_record(
            user,
            device_info={
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'ip_address': request.META.get('REMOTE_ADDR', ''),
            },
        )
        set_login_attempts(email, 0)
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])
        log_audit(request, 'LOGIN', user)
        response = success_response({
            "access": access_token,
            "refreshToken": refresh_token,
            "refresh": refresh_token,
            "role": user.role,
            "emailVerified": user.is_email_verified,
            "email_verified": user.is_email_verified,
            "userId": str(user.id),
            "user_id": str(user.id),
        })
        set_refresh_cookie(response, refresh_token)
        return response


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw_refresh_token = extract_refresh_token(request)
        if not raw_refresh_token:
            return error_response("INVALID_REFRESH_TOKEN", "Refresh token is required", 401)

        token_hash = sha256(raw_refresh_token)
        now = timezone.now()
        try:
            rt = RefreshToken.objects.get(token_hash=token_hash, revoked_at__isnull=True, expires_at__gt=now)
            new_access = issue_access_token(rt.user)
            return success_response({"access": new_access})
        except RefreshToken.DoesNotExist:
            return error_response("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token", 401)


class GuestSessionView(APIView):
    """Create a limited guest session for public browsing"""
    permission_classes = [AllowAny]

    def post(self, request):
        # Create or get guest user
        guest_email = f"guest-{uuid.uuid4().hex[:8]}@pawtrack.local"
        
        try:
            # Try to get existing guest user or create new one
            import secrets
            from django.contrib.auth.hashers import make_password
            guest_user, created = User.objects.get_or_create(
                email=guest_email,
                defaults={
                    'role': 'GUEST',
                    'is_active': True,
                    'is_email_verified': False,
                    'password': make_password(secrets.token_urlsafe(32)),  # Random password, not usable
                }
            )
            
            # Create user profile if it doesn't exist
            if created:
                UserProfile.objects.create(
                    user=guest_user,
                    first_name='Guest',
                    last_name='User',
                )
            
            # Generate access token (24-hour expiration for guests)
            access_token = issue_access_token(guest_user)
            
            return success_response({
                "access": access_token,
                "role": "GUEST",
                "is_guest": True,
                "userId": str(guest_user.id),
                "message": "Guest session created. You have read-only access.",
            })
        except Exception as e:
            return error_response("GUEST_SESSION_FAILED", f"Failed to create guest session: {str(e)}", 500)


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw_refresh_token = extract_refresh_token(request)
        if not raw_refresh_token:
            return error_response("INVALID_REFRESH_TOKEN", "Refresh token is required", 401)

        token_hash = sha256(raw_refresh_token)
        now = timezone.now()
        try:
            stored_token = RefreshToken.objects.select_related('user').get(token_hash=token_hash)
        except RefreshToken.DoesNotExist:
            return error_response("INVALID_REFRESH_TOKEN", "Refresh token is invalid", 401)

        if stored_token.is_revoked:
            revoke_all_refresh_tokens(stored_token.user)
            return error_response("INVALID_REFRESH_TOKEN", "Refresh token is invalid", 401)

        if stored_token.expires_at <= now:
            stored_token.is_revoked = True
            stored_token.revoked_at = now
            stored_token.save(update_fields=['is_revoked', 'revoked_at'])
            return error_response("INVALID_REFRESH_TOKEN", "Refresh token is invalid", 401)

        if not stored_token.user.is_active:
            stored_token.is_revoked = True
            stored_token.revoked_at = now
            stored_token.save(update_fields=['is_revoked', 'revoked_at'])
            return error_response("ACCOUNT_DISABLED", "Account is disabled", 403)

        with transaction.atomic():
            stored_token.is_revoked = True
            stored_token.revoked_at = now
            stored_token.last_used_at = now
            stored_token.save(update_fields=['is_revoked', 'revoked_at', 'last_used_at'])

            new_access_token = issue_access_token(stored_token.user)
            new_refresh_token = create_refresh_token_record(
                stored_token.user,
                device_info=stored_token.device_info,
            )

        response = success_response({
            "access": new_access_token,
            "refreshToken": new_refresh_token,
            "refresh": new_refresh_token,
        })
        set_refresh_cookie(response, new_refresh_token)
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        auth_token = request.auth or {}
        if auth_token.get('jti') and auth_token.get('exp'):
            remaining_seconds = max(0, int(auth_token['exp'] - timezone.now().timestamp()))
            if remaining_seconds > 0:
                cache.set(f"blacklisted_token:{auth_token['jti']}", True, timeout=remaining_seconds)

        refresh_token = extract_refresh_token(request)
        if refresh_token:
            RefreshToken.objects.filter(token_hash=sha256(refresh_token), is_revoked=False).update(
                is_revoked=True,
                revoked_at=timezone.now(),
            )
        # B3: record the logout event for the super-admin activity feed.
        log_audit(request, 'LOGOUT', request.user)
        response = no_content_response()
        response.delete_cookie('refresh_token', path='/')
        return response


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return error_response("MISSING_TOKEN", "Token is required", 400)
        token_hash = sha256(token)
        now = timezone.now()
        ev = EmailVerification.objects.filter(token_hash=token_hash).first()
        if not ev:
            return error_response("INVALID_VERIFICATION_TOKEN", "Token is invalid", 400)
        if ev.is_used:
            return error_response("VERIFICATION_TOKEN_ALREADY_USED", "Token has already been used", 400)
        if ev.expires_at <= now:
            return error_response("VERIFICATION_TOKEN_EXPIRED", "Token has expired", 400)
        ev.is_used = True
        ev.save()
        ev.user.is_email_verified = True
        ev.user.save(update_fields=['is_email_verified'])
        return success_response(message="Email verified successfully.")


class ResendVerificationView(APIView):
    # AllowAny so a user who is blocked from logging in (unverified) can still
    # request a fresh link by email. Logged-in users are handled too.
    permission_classes = [AllowAny]

    def post(self, request):
        user = request.user if getattr(request, 'user', None) and request.user.is_authenticated else None

        if user is None:
            email = (request.data.get('email') or '').strip().lower()
            if not email:
                return error_response("MISSING_EMAIL", "Email is required", 400)
            user = User.objects.filter(email__iexact=email).first()
            # Don't reveal whether the account exists or is already verified.
            if not user or user.is_email_verified:
                return success_response(
                    message="If an unverified account exists for that email, a verification link has been sent.")
        elif user.is_email_verified:
            return error_response("EMAIL_ALREADY_VERIFIED", "Email is already verified", 400)

        rate_key = verification_rate_key(str(user.id))
        attempts = int(cache.get(rate_key, 0)) + 1
        if attempts > 3:
            return error_response("RATE_LIMITED", "Too many verification requests. Please try again later.", 429)
        cache.set(rate_key, attempts, timeout=60 * 60)
        EmailVerification.objects.filter(user=user, is_used=False).update(is_used=True)
        from .tasks import send_verification_email
        send_verification_email.delay(str(user.id))
        return success_response(message="Verification email sent.")


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data['email'].lower()
        rate_key = reset_rate_key(email)
        attempts = int(cache.get(rate_key, 0)) + 1
        if attempts > 1:
            return error_response("RATE_LIMITED", "Please wait before requesting another reset", 429)
        cache.set(rate_key, attempts, timeout=60)
        # Always return 200 regardless of whether email exists
        try:
            user = User.objects.get(email=email, is_deleted=False)
            PasswordReset.objects.filter(user=user, is_used=False).update(is_used=True)
            from .tasks import send_password_reset_email
            send_password_reset_email.delay(str(user.id))
        except User.DoesNotExist:
            pass
        return success_response(message="If that email is registered, a reset link has been sent.")


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = PasswordResetConfirmSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        token_hash = sha256(s.validated_data['token'])
        now = timezone.now()
        pr = PasswordReset.objects.filter(token_hash=token_hash).first()
        if not pr or pr.is_used or pr.expires_at <= now:
            return error_response("INVALID_OR_EXPIRED_RESET_TOKEN", "Token is invalid or expired", 400)
        user = pr.user
        if user.check_password(s.validated_data['new_password']):
            return error_response("PASSWORD_SAME_AS_CURRENT", "New password must be different from the current password", 400)
        with transaction.atomic():
            user.set_password(s.validated_data['new_password'])
            user.save(update_fields=['password'])
            pr.is_used = True
            pr.save(update_fields=['is_used'])
            revoke_all_refresh_tokens(user)
        from .tasks import send_password_changed_email
        send_password_changed_email.delay(str(user.id))
        return success_response(message="Password reset successful.")


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        # Vets: enforce the appeal deadline so a lapsed window flags the account
        # and the returned profile reflects the up-to-date lifecycle state.
        if request.user.role == 'VET':
            vp = getattr(request.user, 'vet_profile', None)
            if vp:
                vet_workflow.enforce_deadline(vp)
        return success_response(UserDetailSerializer(request.user).data)

    def put(self, request):
        # B6: canonical profile edit. Handles name/phone/bio/DOB and an optional
        # uploaded profile photo; the updated profile is the single source of
        # truth read everywhere (dashboard header, activity feed, etc.).
        # Super admins created via createsuperuser have no UserProfile row, so
        # provision one on demand instead of 500-ing.
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        payload = {}
        for field in ['first_name', 'last_name', 'phone', 'bio', 'date_of_birth']:
            if field in request.data and request.data.get(field) not in [None, '']:
                payload[field] = request.data.get(field)

        photo = request.FILES.get('profile_photo') or request.FILES.get('profile_photo_url')
        if photo:
            path = default_storage.save(f'profiles/{request.user.id}/{photo.name}', photo)
            payload['profile_photo_url'] = request.build_absolute_uri(default_storage.url(path))
        elif request.data.get('profile_photo_url'):
            payload['profile_photo_url'] = request.data.get('profile_photo_url')

        s = UserProfileSerializer(profile, data=payload, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        s.save()
        log_audit(request, 'UPDATE', profile)
        return success_response(UserDetailSerializer(request.user).data)


class AddressListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        addrs = UserAddress.objects.filter(user=request.user, is_deleted=False)
        return success_response(UserAddressSerializer(addrs, many=True).data)

    def post(self, request):
        s = UserAddressSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        if s.validated_data.get('is_primary'):
            UserAddress.objects.filter(user=request.user).update(is_primary=False)
        # First address is always primary
        is_first = not UserAddress.objects.filter(user=request.user, is_deleted=False).exists()
        addr = s.save(user=request.user, is_primary=s.validated_data.get('is_primary') or is_first)
        return created_response(UserAddressSerializer(addr).data)


class AddressDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_address(self, pk, user):
        try:
            return UserAddress.objects.get(pk=pk, user=user, is_deleted=False)
        except UserAddress.DoesNotExist:
            return None

    def put(self, request, pk):
        addr = self._get_address(pk, request.user)
        if not addr:
            return error_response("NOT_FOUND", "Address not found", 404)
        s = UserAddressSerializer(addr, data=request.data, partial=True)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        if s.validated_data.get('is_primary'):
            UserAddress.objects.filter(user=request.user).update(is_primary=False)
        s.save()
        return success_response(UserAddressSerializer(addr).data)

    def delete(self, request, pk):
        addr = self._get_address(pk, request.user)
        if not addr:
            return error_response("NOT_FOUND", "Address not found", 404)
        if addr.is_primary and UserAddress.objects.filter(
                user=request.user, is_deleted=False).count() > 1:
            return error_response("CANNOT_DELETE_PRIMARY",
                                  "Set another address as primary before deleting this one", 400)
        addr.is_deleted = True
        addr.save()
        return no_content_response()


class EmergencyContactView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contacts = EmergencyContact.objects.filter(user=request.user, is_deleted=False)
        return success_response(EmergencyContactSerializer(contacts, many=True).data)

    def post(self, request):
        if EmergencyContact.objects.filter(user=request.user, is_deleted=False).count() >= 3:
            return error_response("MAX_CONTACTS", "Maximum 3 emergency contacts allowed", 400)
        s = EmergencyContactSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        contact = s.save(user=request.user)
        return created_response(EmergencyContactSerializer(contact).data)


class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(is_deleted=False, is_active=True).select_related('profile')
        
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
            
        search = request.query_params.get('search') or request.query_params.get('q')
        if search:
            from django.db.models import Q
            users = users.filter(
                Q(email__icontains=search) |
                Q(profile__first_name__icontains=search) |
                Q(profile__last_name__icontains=search)
            )
            
        # Exclude self from search/list
        users = users.exclude(id=request.user.id)
            
        return success_response(UserSearchSerializer(users[:20], many=True).data)


class AdminUserListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        users = User.objects.filter(is_deleted=False).select_related('profile')
        role = request.query_params.get('role')
        if role:
            users = users.filter(role=role)
        return success_response(UserDetailSerializer(users, many=True).data)


class AdminUserRoleView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        if str(request.user.id) == str(user_id):
            return error_response("SELF_MODIFICATION", "Cannot change your own role", 403)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return error_response("NOT_FOUND", "User not found", 404)
        user.role = request.data.get('role', user.role)
        user.save(update_fields=['role'])
        return success_response({"user_id": str(user.id), "role": user.role})


class AdminUserStatusView(APIView):
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        if str(request.user.id) == str(user_id):
            return error_response("SELF_MODIFICATION", "Cannot change your own status", 403)
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return error_response("NOT_FOUND", "User not found", 404)
        user.is_active = request.data.get('is_active', user.is_active)
        user.save(update_fields=['is_active'])
        return success_response({"user_id": str(user.id), "is_active": user.is_active})


class AdminUserVerifyView(APIView):
    """Super-admin fallback: manually mark a user's email as verified (or revoke
    verification). Useful for accounts created before the verification gate, or
    when the user can't receive the emailed link."""
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return error_response("NOT_FOUND", "User not found", 404)
        is_verified = bool(request.data.get('is_verified', True))
        user.is_email_verified = is_verified
        user.save(update_fields=['is_email_verified'])
        if is_verified:
            # Consume outstanding verification tokens so old links can't be reused.
            EmailVerification.objects.filter(user=user, is_used=False).update(is_used=True)
        log_audit(request, 'UPDATE', user)
        return success_response({"user_id": str(user.id), "is_email_verified": user.is_email_verified})


class AdminUserCreateView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = (request.data.get('phone') or '').strip()
        role = request.data.get('role', 'SHELTER_ADMIN')

        if not email or not password or not first_name or not last_name or not phone:
            return error_response("MISSING_FIELDS", "Email, password, first name, last name, and phone are required", 400)

        # Contact number must be a valid Pakistani mobile.
        from apps.core.phone import normalize_pk_mobile
        try:
            phone = normalize_pk_mobile(phone)
        except ValueError as exc:
            return error_response("VALIDATION_FAILED", "Validation error", 400, {'phone': [str(exc)]})

        if User.objects.filter(email__iexact=email).exists():
            return error_response("EMAIL_ALREADY_EXISTS", "User with this email already exists", 400)

        with transaction.atomic():
            user = User.objects.create_user(email=email, password=password, role=role)
            user.is_email_verified = True  # Admin-created users can be auto-verified
            user.save()
            UserProfile.objects.create(user=user, first_name=first_name, last_name=last_name, phone=phone)

        return created_response({"user_id": str(user.id)}, "User created successfully")



# ---------------------------------------------------------------------------
# Veterinarian approval workflow (see apps/accounts/vet_workflow.py)
# ---------------------------------------------------------------------------

def _serialize_vet_row(vp):
    u = vp.user
    p = getattr(u, 'profile', None)
    return {
        'user_id': str(u.id),
        'email': u.email,
        'first_name': getattr(p, 'first_name', '') if p else '',
        'last_name': getattr(p, 'last_name', '') if p else '',
        'phone': getattr(p, 'phone', '') if p else '',
        'is_email_verified': u.is_email_verified,
        'is_active': u.is_active,
        'vet_profile': VetProfileSerializer(vp).data,
        'created_at': u.created_at,
    }


class VetApprovalListView(APIView):
    """List vet registration requests for Super Admins and Shelter Admins.

    Each row carries the full approval state (round-1 statuses, lifecycle, and
    the latest appeal with its per-admin decisions) so the UI can render the
    correct action for the viewer's role and the current stage.
    """
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request):
        from .models import VetProfile
        qs = (VetProfile.objects
              .select_related('user', 'user__profile', 'target_shelter')
              .prefetch_related('appeals')
              .filter(user__is_deleted=False)
              .order_by('-created_at'))

        # Lazily flag any lapsed appeal windows before serialising.
        for vp in qs:
            vet_workflow.enforce_deadline(vp)

        # Shelter admins only see requests that involve their shelter (or, as a
        # fallback when a shelter has no bound admin, any shelter-bound request).
        if request.user.role == 'SHELTER_ADMIN':
            managed_ids = list(
                request.user.managed_shelter.filter(is_deleted=False).values_list('id', flat=True)
            )
            qs = [vp for vp in qs if vp.requires_shelter_approval and (
                vp.target_shelter_id in managed_ids
                or (vp.target_shelter and not vp.target_shelter.admin_id)
            )]

        active_states = (VetProfile.LIFECYCLE_PENDING, VetProfile.LIFECYCLE_REJECTED,
                         VetProfile.LIFECYCLE_APPEAL_REVIEW, VetProfile.LIFECYCLE_SUPER_FINAL_REVIEW)
        if request.query_params.get('status') == 'pending':
            qs = [vp for vp in qs if vp.lifecycle_status in active_states]

        return success_response([_serialize_vet_row(vp) for vp in qs])


class VetSuperDecisionView(APIView):
    """Super Admin decision — stage-aware (round 1, appeal, or final review)."""
    permission_classes = [IsSuperAdmin]

    def put(self, request, user_id):
        from .models import VetProfile
        try:
            vp = VetProfile.objects.select_related('user', 'target_shelter').get(user_id=user_id)
        except VetProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Vet profile not found", 404)

        decision = (request.data.get('decision') or '').strip().upper()
        if decision not in ('APPROVED', 'REJECTED'):
            return error_response("INVALID_DECISION", "Decision must be APPROVED or REJECTED", 400)
        details = (request.data.get('details') or request.data.get('reason') or '').strip()
        anomalies = (request.data.get('anomalies') or '').strip()
        if decision == 'REJECTED' and not details:
            return error_response("REASON_REQUIRED",
                                  "A reason / details must be provided when rejecting.", 400)

        try:
            vet_workflow.apply_super_decision(vp, request.user, decision, details, anomalies)
        except vet_workflow.WorkflowError as exc:
            return error_response("INVALID_STATE", str(exc), 400)
        log_audit(request, 'UPDATE', vp.user)
        vp.refresh_from_db()
        return success_response(VetProfileSerializer(vp).data)


class VetShelterDecisionView(APIView):
    """Shelter Admin decision — stage-aware (round 1 or appeal)."""
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def put(self, request, user_id):
        from .models import VetProfile
        try:
            vp = VetProfile.objects.select_related('user', 'target_shelter').get(user_id=user_id)
        except VetProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Vet profile not found", 404)

        # A shelter admin may only act on requests tied to a shelter they manage.
        if request.user.role == 'SHELTER_ADMIN':
            managed_ids = list(
                request.user.managed_shelter.filter(is_deleted=False).values_list('id', flat=True))
            bound_here = vp.target_shelter_id in managed_ids
            unbound_admin = vp.target_shelter and not vp.target_shelter.admin_id
            if not (bound_here or unbound_admin):
                return error_response("FORBIDDEN", "This request is not for your shelter.", 403)

        decision = (request.data.get('decision') or '').strip().upper()
        if decision not in ('APPROVED', 'REJECTED'):
            return error_response("INVALID_DECISION", "Decision must be APPROVED or REJECTED", 400)
        details = (request.data.get('details') or request.data.get('reason') or '').strip()
        anomalies = (request.data.get('anomalies') or '').strip()
        if decision == 'REJECTED' and not details:
            return error_response("REASON_REQUIRED",
                                  "A reason / details must be provided when rejecting.", 400)

        try:
            vet_workflow.apply_shelter_decision(vp, request.user, decision, details, anomalies)
        except vet_workflow.WorkflowError as exc:
            return error_response("INVALID_STATE", str(exc), 400)
        log_audit(request, 'UPDATE', vp.user)
        vp.refresh_from_db()
        return success_response(VetProfileSerializer(vp).data)


class VetAppealSubmitView(APIView):
    """A rejected vet submits their single appeal with extra PDF proof."""
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser]

    def post(self, request):
        if request.user.role != 'VET':
            return error_response("FORBIDDEN", "Only veterinarians can submit an appeal.", 403)
        vp = getattr(request.user, 'vet_profile', None)
        if not vp:
            return error_response("NOT_FOUND", "Vet profile not found", 404)

        vet_workflow.enforce_deadline(vp)
        s = VetAppealSubmitSerializer(data=request.data)
        if not s.is_valid():
            return error_response("VALIDATION_FAILED", "Validation error", 400, s.errors)
        try:
            vet_workflow.submit_appeal(vp, s.validated_data['explanation'], s.validated_data['document'])
        except vet_workflow.WorkflowError as exc:
            return error_response("INVALID_STATE", str(exc), 400)
        log_audit(request, 'CREATE', vp.user)
        vp.refresh_from_db()
        return created_response(VetProfileSerializer(vp).data, "Appeal submitted for review.")


class VetAppealDocumentView(APIView):
    """Stream a vet's latest appeal PDF to an authorised admin."""
    permission_classes = [IsShelterAdminOrSuperAdmin]

    def get(self, request, user_id):
        from .models import VetProfile
        try:
            vp = VetProfile.objects.get(user_id=user_id)
        except VetProfile.DoesNotExist:
            return error_response("NOT_FOUND", "Vet profile not found", 404)
        appeal = vp.latest_appeal
        if not appeal or not appeal.document:
            return error_response("NOT_FOUND", "No appeal document found", 404)

        # Shelter admins may only view documents for their own shelter's requests.
        if request.user.role == 'SHELTER_ADMIN':
            managed_ids = list(
                request.user.managed_shelter.filter(is_deleted=False).values_list('id', flat=True))
            if vp.target_shelter_id not in managed_ids and not (
                    vp.target_shelter and not vp.target_shelter.admin_id):
                return error_response("FORBIDDEN", "This document is not for your shelter.", 403)

        from django.http import FileResponse
        return FileResponse(appeal.document.open('rb'), content_type='application/pdf')
