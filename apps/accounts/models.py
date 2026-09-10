import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.validators import FileExtensionValidator
from django.db import models

ROLE_CHOICES = [
    ('SUPER_ADMIN',   'Super Admin'),
    ('SHELTER_ADMIN', 'Shelter Admin'),
    ('VET',           'Vet'),
    ('VOLUNTEER',     'Volunteer'),
    ('CAT_OWNER',     'Cat Owner'),
    ('ADOPTER',       'Adopter'),
    ('GUEST',         'Guest'),
]


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault('role', 'SUPER_ADMIN')
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email             = models.EmailField(max_length=255, unique=True)
    role              = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ADOPTER')
    is_active         = models.BooleanField(default=True)
    is_staff          = models.BooleanField(default=False)
    is_email_verified = models.BooleanField(default=False)
    last_login_at     = models.DateTimeField(null=True, blank=True)
    last_activity_at  = models.DateTimeField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)
    is_deleted        = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email


class UserProfile(models.Model):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user              = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name        = models.CharField(max_length=100)
    last_name         = models.CharField(max_length=100)
    phone             = models.CharField(max_length=20, blank=True)
    date_of_birth     = models.DateField(null=True, blank=True)  # A4
    profile_photo_url = models.URLField(blank=True)
    bio               = models.CharField(max_length=500, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profiles'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


def vet_appeal_document_path(instance, filename):
    return f'vet_appeals/{instance.vet_profile.user_id}/{filename}'


class VetProfile(models.Model):
    """A1: role-specific profile for veterinarians.

    Vets self-register with a PVMC registration number (RVMP prefix) and choose
    whether they practise from a clinic or inside a shelter.

    Approval is a staged workflow driven by ``lifecycle_status``:

      * Round 1 — a Super Admin decides, and (only if the vet applied to a
        shelter) that shelter's admin decides too. Both decide independently.
      * If anyone rejects, the vet enters ``REJECTED`` with a 5-day window and a
        single appeal. The appeal (with extra PDF proof) goes only to whoever
        rejected.
      * Rejecting an appeal requires an anomaly form. If the Shelter Admin
        rejects the appeal while the Super Admin's stance is approval, it
        escalates: the Super Admin makes the final call.
      * A final rejection suspends the account permanently and blacklists the
        registration number. Letting the 5-day window lapse flags the account
        with the same effect.
    """
    PRACTICE_CLINIC  = 'CLINIC'
    PRACTICE_SHELTER = 'SHELTER'
    PRACTICE_TYPE_CHOICES = [
        (PRACTICE_CLINIC,  'Clinic'),
        (PRACTICE_SHELTER, 'Shelter'),
    ]

    APPROVAL_PENDING      = 'PENDING'
    APPROVAL_APPROVED     = 'APPROVED'
    APPROVAL_REJECTED     = 'REJECTED'
    APPROVAL_NOT_REQUIRED = 'NOT_REQUIRED'
    APPROVAL_STATUS_CHOICES = [
        (APPROVAL_PENDING,      'Pending'),
        (APPROVAL_APPROVED,     'Approved'),
        (APPROVAL_REJECTED,     'Rejected'),
        (APPROVAL_NOT_REQUIRED, 'Not required'),
    ]

    # Overall lifecycle of the application.
    LIFECYCLE_PENDING             = 'PENDING'                 # round 1 in progress
    LIFECYCLE_APPROVED            = 'APPROVED'                # fully approved, active
    LIFECYCLE_REJECTED            = 'REJECTED'                # rejected, appeal window open
    LIFECYCLE_APPEAL_REVIEW       = 'APPEAL_UNDER_REVIEW'     # appeal submitted, awaiting admins
    LIFECYCLE_SUPER_FINAL_REVIEW  = 'SUPER_FINAL_REVIEW'      # escalated to super admin for final call
    LIFECYCLE_SUSPENDED           = 'SUSPENDED'               # final rejection, permanent
    LIFECYCLE_FLAGGED             = 'FLAGGED'                 # 5-day window lapsed, permanent
    LIFECYCLE_CHOICES = [
        (LIFECYCLE_PENDING,            'Pending'),
        (LIFECYCLE_APPROVED,           'Approved'),
        (LIFECYCLE_REJECTED,           'Rejected (appeal open)'),
        (LIFECYCLE_APPEAL_REVIEW,      'Appeal under review'),
        (LIFECYCLE_SUPER_FINAL_REVIEW, 'Super admin final review'),
        (LIFECYCLE_SUSPENDED,          'Suspended'),
        (LIFECYCLE_FLAGGED,            'Flagged'),
    ]
    TERMINAL_BLOCKED = (LIFECYCLE_SUSPENDED, LIFECYCLE_FLAGGED)

    APPEAL_WINDOW_DAYS = 5
    MAX_APPEALS = 1

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vet_profile')
    # PVMC "RVMP" registration number, e.g. RVMP123 or RVMP12345.
    license_number = models.CharField(max_length=100)
    practice_type  = models.CharField(max_length=10, choices=PRACTICE_TYPE_CHOICES,
                                       default=PRACTICE_CLINIC)

    # Clinic-based vets only.
    clinic_name                 = models.CharField(max_length=200, blank=True)
    clinic_location             = models.CharField(max_length=255, blank=True)
    clinic_registration_number  = models.CharField(max_length=100, blank=True)

    # Shelter-based vets bind to a specific shelter — its admin is the stage-2
    # approver. Nullable because clinic vets (or vets who picked no shelter) have
    # none, in which case shelter approval is skipped entirely.
    target_shelter = models.ForeignKey('shelters.Shelter', on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='vet_applications')
    requires_shelter_approval = models.BooleanField(default=False)

    # Specializations: a list of strings (predefined + free-text). `specialization`
    # keeps a comma-joined copy for backward-compatible display elsewhere.
    specializations = models.JSONField(default=list, blank=True)
    specialization  = models.CharField(max_length=400, blank=True)

    lifecycle_status = models.CharField(max_length=24, choices=LIFECYCLE_CHOICES,
                                        default=LIFECYCLE_PENDING)

    # Round 1 — Super Admin.
    super_admin_status     = models.CharField(max_length=12, choices=APPROVAL_STATUS_CHOICES,
                                              default=APPROVAL_PENDING)
    super_admin_decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                              related_name='vet_super_decisions')
    super_admin_decided_at = models.DateTimeField(null=True, blank=True)
    super_admin_reason     = models.CharField(max_length=500, blank=True)

    # Round 1 — Shelter Admin (independent of the super admin's decision).
    shelter_admin_status     = models.CharField(max_length=12, choices=APPROVAL_STATUS_CHOICES,
                                                default=APPROVAL_PENDING)
    shelter_admin_decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                                related_name='vet_shelter_decisions')
    shelter_admin_decided_at = models.DateTimeField(null=True, blank=True)
    shelter_admin_reason     = models.CharField(max_length=500, blank=True)

    # Kept for backward-compatible display; mirrors the most relevant reason.
    rejection_reason = models.CharField(max_length=500, blank=True)

    # Appeal window bookkeeping.
    appeal_deadline = models.DateTimeField(null=True, blank=True)
    appeals_used    = models.PositiveIntegerField(default=0)
    blocked_reason  = models.CharField(max_length=500, blank=True)

    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vet_profiles'

    # ---- Derived state --------------------------------------------------
    @property
    def is_fully_approved(self):
        return self.lifecycle_status == self.LIFECYCLE_APPROVED

    @property
    def is_rejected(self):
        return self.lifecycle_status in (
            self.LIFECYCLE_REJECTED, self.LIFECYCLE_SUSPENDED, self.LIFECYCLE_FLAGGED)

    @property
    def is_blocked(self):
        """Permanently blocked — cannot log in or re-register."""
        return self.lifecycle_status in self.TERMINAL_BLOCKED

    @property
    def can_appeal(self):
        return (self.lifecycle_status == self.LIFECYCLE_REJECTED
                and self.appeals_used < self.MAX_APPEALS
                and not self.is_deadline_passed)

    @property
    def is_deadline_passed(self):
        from django.utils import timezone
        return bool(self.appeal_deadline and timezone.now() > self.appeal_deadline)

    @property
    def latest_appeal(self):
        return self.appeals.order_by('-submitted_at').first()

    @property
    def approval_stage(self):
        """Short machine label describing where the request currently sits."""
        mapping = {
            self.LIFECYCLE_APPROVED:           'APPROVED',
            self.LIFECYCLE_SUSPENDED:          'SUSPENDED',
            self.LIFECYCLE_FLAGGED:            'FLAGGED',
            self.LIFECYCLE_REJECTED:           'REJECTED',
            self.LIFECYCLE_APPEAL_REVIEW:      'APPEAL_UNDER_REVIEW',
            self.LIFECYCLE_SUPER_FINAL_REVIEW: 'SUPER_FINAL_REVIEW',
        }
        if self.lifecycle_status in mapping:
            return mapping[self.lifecycle_status]
        if self.super_admin_status == self.APPROVAL_PENDING:
            return 'AWAITING_SUPER_ADMIN'
        if self.requires_shelter_approval and self.shelter_admin_status == self.APPROVAL_PENDING:
            return 'AWAITING_SHELTER_ADMIN'
        return 'PENDING'


class VetAppeal(models.Model):
    """A vet's single appeal against a rejected registration.

    Carries the vet's written explanation plus mandatory PDF proof, and records
    each rejecting admin's re-decision. Rejecting an appeal requires an anomaly
    form (details + anomalies). A shelter rejection here can escalate to the
    super admin for a final decision.
    """
    PENDING      = 'PENDING'
    APPROVED     = 'APPROVED'
    REJECTED     = 'REJECTED'
    NOT_REQUIRED = 'NOT_REQUIRED'
    DECISION_CHOICES = [
        (PENDING,      'Pending'),
        (APPROVED,     'Approved'),
        (REJECTED,     'Rejected'),
        (NOT_REQUIRED, 'Not required'),
    ]

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    vet_profile = models.ForeignKey(VetProfile, on_delete=models.CASCADE, related_name='appeals')
    explanation = models.TextField()
    document    = models.FileField(upload_to=vet_appeal_document_path,
                                   validators=[FileExtensionValidator(['pdf'])])
    submitted_at = models.DateTimeField(auto_now_add=True)

    # Which admins must review (those who rejected in round 1).
    needs_super_review   = models.BooleanField(default=False)
    needs_shelter_review = models.BooleanField(default=False)

    # Super admin's re-decision on the appeal.
    super_status      = models.CharField(max_length=12, choices=DECISION_CHOICES, default=NOT_REQUIRED)
    super_decided_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='vet_appeal_super_decisions')
    super_decided_at  = models.DateTimeField(null=True, blank=True)
    super_reject_details   = models.TextField(blank=True)
    super_reject_anomalies = models.TextField(blank=True)

    # Shelter admin's re-decision on the appeal.
    shelter_status     = models.CharField(max_length=12, choices=DECISION_CHOICES, default=NOT_REQUIRED)
    shelter_decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                           related_name='vet_appeal_shelter_decisions')
    shelter_decided_at = models.DateTimeField(null=True, blank=True)
    shelter_reject_details   = models.TextField(blank=True)
    shelter_reject_anomalies = models.TextField(blank=True)

    # Escalation — shelter rejected the appeal but super approved; the super
    # admin makes the final call using the shelter's explanation above.
    super_final_status     = models.CharField(max_length=12, choices=DECISION_CHOICES, default=NOT_REQUIRED)
    super_final_decided_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                               related_name='vet_appeal_final_decisions')
    super_final_decided_at = models.DateTimeField(null=True, blank=True)
    super_final_details    = models.TextField(blank=True)
    super_final_anomalies  = models.TextField(blank=True)

    class Meta:
        db_table = 'vet_appeals'
        ordering = ['-submitted_at']


class BlacklistedVetRegistration(models.Model):
    """A registration number (and email) barred from ever registering again."""
    REASON_SUSPENDED = 'SUSPENDED'
    REASON_FLAGGED   = 'FLAGGED'
    REASON_CHOICES = [
        (REASON_SUSPENDED, 'Suspended after final rejection'),
        (REASON_FLAGGED,   'Flagged after lapsed appeal window'),
    ]

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    registration_number = models.CharField(max_length=100, unique=True)
    email               = models.EmailField(blank=True)
    reason              = models.CharField(max_length=20, choices=REASON_CHOICES)
    notes               = models.CharField(max_length=500, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'blacklisted_vet_registrations'


class AdopterProfile(models.Model):
    """A1: role-specific profile for adopters (feeds adoption questionnaire defaults)."""
    HOUSING_CHOICES = [
        ('HOUSE', 'House'), ('APARTMENT', 'Apartment'),
        ('CONDO', 'Condo'), ('FARM', 'Farm'), ('OTHER', 'Other'),
    ]
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='adopter_profile')
    housing_type   = models.CharField(max_length=20, choices=HOUSING_CHOICES, blank=True)
    has_other_pets = models.BooleanField(default=False)
    household_info = models.CharField(max_length=500, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'adopter_profiles'


class UserAddress(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    street      = models.CharField(max_length=255)
    city        = models.CharField(max_length=100)
    state       = models.CharField(max_length=100, blank=True)
    country     = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    is_primary  = models.BooleanField(default=False)
    is_deleted  = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_addresses'


class EmergencyContact(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name         = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50)
    phone        = models.CharField(max_length=20)
    email        = models.EmailField(blank=True)
    is_deleted   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'emergency_contacts'


class EmailVerification(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_verifications'


class RefreshToken(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='refresh_tokens')
    token_hash   = models.CharField(max_length=255, unique=True)
    token_jti    = models.CharField(max_length=64, unique=True)
    device_info  = models.JSONField(default=dict, blank=True)
    expires_at   = models.DateTimeField()
    is_revoked   = models.BooleanField(default=False)
    revoked_at   = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'refresh_tokens'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} refresh token'


class PasswordReset(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(User, on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    is_used    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_resets'
