"""Veterinarian approval state machine.

Centralises every transition of a vet's registration so views stay thin and the
rules live in one place. See ``VetProfile`` for the lifecycle overview.
"""
from datetime import timedelta

from django.db import transaction
from django.utils import timezone

from .models import User, VetProfile, VetAppeal, BlacklistedVetRegistration


class WorkflowError(Exception):
    """Raised when a decision is attempted out of turn / in the wrong stage."""


# ---------------------------------------------------------------------------
# Notifications (best-effort; never block a transition)
# ---------------------------------------------------------------------------

def _notify(user, title, body):
    if not user:
        return
    try:
        from apps.notifications.models import Notification
        Notification.objects.create(
            recipient=user, type='IN_APP', category='SYSTEM', title=title, body=body,
            reference_type='vet_profile',
        )
    except Exception:
        pass


def _email(user_id, kind):
    try:
        from .tasks import send_vet_status_email
        send_vet_status_email.delay(str(user_id), kind)
    except Exception:
        pass


def _vet_name(vet_user):
    p = getattr(vet_user, 'profile', None)
    return (getattr(p, 'first_name', '') if p else '') or vet_user.email


def _super_admins():
    return User.objects.filter(role='SUPER_ADMIN', is_active=True, is_deleted=False)


def _shelter_admin_recipients(target_shelter):
    """The specific shelter's admin, falling back to all shelter admins."""
    if target_shelter is not None and getattr(target_shelter, 'admin_id', None):
        qs = User.objects.filter(pk=target_shelter.admin_id, is_active=True, is_deleted=False)
        if qs.exists():
            return qs
    return User.objects.filter(role='SHELTER_ADMIN', is_active=True, is_deleted=False)


def notify_new_request(vet_profile):
    """Route a brand-new registration request to the relevant reviewers."""
    name = _vet_name(vet_profile.user)
    for admin in _super_admins():
        _notify(admin, 'New veterinarian registration request',
                f'{name} requested to join as a veterinarian and awaits your review.')
    if vet_profile.requires_shelter_approval:
        for admin in _shelter_admin_recipients(vet_profile.target_shelter):
            _notify(admin, 'New veterinarian registration request',
                    f'{name} applied to your shelter as a veterinarian and awaits your review.')


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def initialize_vet_approval(vet_profile):
    """Set the starting approval state based on whether a shelter was chosen."""
    if vet_profile.target_shelter_id:
        vet_profile.requires_shelter_approval = True
        vet_profile.shelter_admin_status = VetProfile.APPROVAL_PENDING
    else:
        vet_profile.requires_shelter_approval = False
        vet_profile.shelter_admin_status = VetProfile.APPROVAL_NOT_REQUIRED
    vet_profile.lifecycle_status = VetProfile.LIFECYCLE_PENDING
    vet_profile.save(update_fields=['requires_shelter_approval', 'shelter_admin_status',
                                    'lifecycle_status'])


# ---------------------------------------------------------------------------
# Round 1 decisions
# ---------------------------------------------------------------------------

@transaction.atomic
def apply_super_decision(vet_profile, actor, decision, details='', anomalies=''):
    enforce_deadline(vet_profile)
    if vet_profile.is_blocked or vet_profile.is_fully_approved:
        raise WorkflowError('This application is already closed.')

    ls = vet_profile.lifecycle_status
    if ls == VetProfile.LIFECYCLE_PENDING:
        if vet_profile.super_admin_status != VetProfile.APPROVAL_PENDING:
            raise WorkflowError('You have already recorded a decision for this request.')
        vet_profile.super_admin_status = decision
        vet_profile.super_admin_decided_by = actor
        vet_profile.super_admin_decided_at = timezone.now()
        vet_profile.super_admin_reason = details if decision == VetProfile.APPROVAL_REJECTED else ''
        vet_profile.save()
        _resolve_round1(vet_profile)
        return

    if ls == VetProfile.LIFECYCLE_APPEAL_REVIEW:
        appeal = vet_profile.latest_appeal
        if not appeal or not appeal.needs_super_review or appeal.super_status != VetAppeal.PENDING:
            raise WorkflowError('There is no pending super-admin appeal decision.')
        appeal.super_status = decision
        appeal.super_decided_by = actor
        appeal.super_decided_at = timezone.now()
        if decision == VetAppeal.REJECTED:
            appeal.super_reject_details = details
            appeal.super_reject_anomalies = anomalies
        appeal.save()
        _resolve_appeal(vet_profile, appeal)
        return

    if ls == VetProfile.LIFECYCLE_SUPER_FINAL_REVIEW:
        appeal = vet_profile.latest_appeal
        if not appeal or appeal.super_final_status != VetAppeal.PENDING:
            raise WorkflowError('There is no pending final decision.')
        appeal.super_final_status = decision
        appeal.super_final_decided_by = actor
        appeal.super_final_decided_at = timezone.now()
        if decision == VetAppeal.REJECTED:
            appeal.super_final_details = details
            appeal.super_final_anomalies = anomalies
        appeal.save()
        _resolve_final(vet_profile, appeal)
        return

    raise WorkflowError('No super-admin action is available at this stage.')


@transaction.atomic
def apply_shelter_decision(vet_profile, actor, decision, details='', anomalies=''):
    enforce_deadline(vet_profile)
    if vet_profile.is_blocked or vet_profile.is_fully_approved:
        raise WorkflowError('This application is already closed.')

    ls = vet_profile.lifecycle_status
    if ls == VetProfile.LIFECYCLE_PENDING:
        if not vet_profile.requires_shelter_approval:
            raise WorkflowError('This vet did not apply to a shelter, so shelter approval is not required.')
        if vet_profile.shelter_admin_status != VetProfile.APPROVAL_PENDING:
            raise WorkflowError('You have already recorded a decision for this request.')
        vet_profile.shelter_admin_status = decision
        vet_profile.shelter_admin_decided_by = actor
        vet_profile.shelter_admin_decided_at = timezone.now()
        vet_profile.shelter_admin_reason = details if decision == VetProfile.APPROVAL_REJECTED else ''
        vet_profile.save()
        _resolve_round1(vet_profile)
        return

    if ls == VetProfile.LIFECYCLE_APPEAL_REVIEW:
        appeal = vet_profile.latest_appeal
        if not appeal or not appeal.needs_shelter_review or appeal.shelter_status != VetAppeal.PENDING:
            raise WorkflowError('There is no pending shelter-admin appeal decision.')
        appeal.shelter_status = decision
        appeal.shelter_decided_by = actor
        appeal.shelter_decided_at = timezone.now()
        if decision == VetAppeal.REJECTED:
            appeal.shelter_reject_details = details
            appeal.shelter_reject_anomalies = anomalies
        appeal.save()
        _resolve_appeal(vet_profile, appeal)
        return

    raise WorkflowError('No shelter-admin action is available at this stage.')


def _resolve_round1(vet_profile):
    super_done = vet_profile.super_admin_status in (VetProfile.APPROVAL_APPROVED, VetProfile.APPROVAL_REJECTED)
    shelter_done = (not vet_profile.requires_shelter_approval
                    or vet_profile.shelter_admin_status in (VetProfile.APPROVAL_APPROVED, VetProfile.APPROVAL_REJECTED))
    if not (super_done and shelter_done):
        return  # still awaiting the other reviewer

    super_ok = vet_profile.super_admin_status == VetProfile.APPROVAL_APPROVED
    shelter_ok = (not vet_profile.requires_shelter_approval
                  or vet_profile.shelter_admin_status == VetProfile.APPROVAL_APPROVED)
    if super_ok and shelter_ok:
        _finalize_approved(vet_profile)
    else:
        _open_appeal_window(vet_profile)


def _open_appeal_window(vet_profile):
    reasons = []
    if vet_profile.super_admin_status == VetProfile.APPROVAL_REJECTED:
        reasons.append(f'Super Admin: {vet_profile.super_admin_reason or "no reason given"}')
    if (vet_profile.requires_shelter_approval
            and vet_profile.shelter_admin_status == VetProfile.APPROVAL_REJECTED):
        reasons.append(f'Shelter Admin: {vet_profile.shelter_admin_reason or "no reason given"}')
    vet_profile.rejection_reason = ' | '.join(reasons)
    vet_profile.lifecycle_status = VetProfile.LIFECYCLE_REJECTED
    vet_profile.appeal_deadline = timezone.now() + timedelta(days=VetProfile.APPEAL_WINDOW_DAYS)
    vet_profile.save(update_fields=['rejection_reason', 'lifecycle_status', 'appeal_deadline'])
    _notify(vet_profile.user, 'Registration request rejected',
            'Your veterinarian request was rejected. You have 5 days and one appeal to respond '
            'with additional veterinary proof (PDF).')
    _email(vet_profile.user_id, 'rejected')


def _finalize_approved(vet_profile):
    vet_profile.lifecycle_status = VetProfile.LIFECYCLE_APPROVED
    vet_profile.appeal_deadline = None
    vet_profile.blocked_reason = ''
    vet_profile.save(update_fields=['lifecycle_status', 'appeal_deadline', 'blocked_reason'])
    user = vet_profile.user
    if not user.is_active:
        user.is_active = True
        user.save(update_fields=['is_active'])
    _notify(user, 'You are fully approved! 🎉',
            'Your veterinarian registration is approved. All features are now unlocked.')
    _email(user.id, 'approved')


# ---------------------------------------------------------------------------
# Appeal
# ---------------------------------------------------------------------------

@transaction.atomic
def submit_appeal(vet_profile, explanation, document):
    enforce_deadline(vet_profile)
    if vet_profile.lifecycle_status != VetProfile.LIFECYCLE_REJECTED:
        raise WorkflowError('An appeal can only be submitted for a rejected request.')
    if vet_profile.appeals_used >= VetProfile.MAX_APPEALS:
        raise WorkflowError('You have already used your one appeal.')
    if vet_profile.is_deadline_passed:
        raise WorkflowError('The 5-day appeal window has closed.')

    needs_super = vet_profile.super_admin_status == VetProfile.APPROVAL_REJECTED
    needs_shelter = (vet_profile.requires_shelter_approval
                     and vet_profile.shelter_admin_status == VetProfile.APPROVAL_REJECTED)

    appeal = VetAppeal.objects.create(
        vet_profile=vet_profile,
        explanation=explanation,
        document=document,
        needs_super_review=needs_super,
        needs_shelter_review=needs_shelter,
        super_status=VetAppeal.PENDING if needs_super else VetAppeal.NOT_REQUIRED,
        shelter_status=VetAppeal.PENDING if needs_shelter else VetAppeal.NOT_REQUIRED,
    )
    vet_profile.appeals_used += 1
    vet_profile.lifecycle_status = VetProfile.LIFECYCLE_APPEAL_REVIEW
    vet_profile.save(update_fields=['appeals_used', 'lifecycle_status'])

    name = _vet_name(vet_profile.user)
    if needs_super:
        for admin in _super_admins():
            _notify(admin, 'Veterinarian appeal submitted',
                    f'{name} appealed their rejection and submitted new proof for your review.')
    if needs_shelter:
        for admin in _shelter_admin_recipients(vet_profile.target_shelter):
            _notify(admin, 'Veterinarian appeal submitted',
                    f'{name} appealed their rejection and submitted new proof for your review.')
    return appeal


def _resolve_appeal(vet_profile, appeal):
    super_done = (not appeal.needs_super_review) or appeal.super_status in (VetAppeal.APPROVED, VetAppeal.REJECTED)
    shelter_done = (not appeal.needs_shelter_review) or appeal.shelter_status in (VetAppeal.APPROVED, VetAppeal.REJECTED)
    if not (super_done and shelter_done):
        return

    super_rejected = appeal.needs_super_review and appeal.super_status == VetAppeal.REJECTED
    shelter_rejected = appeal.needs_shelter_review and appeal.shelter_status == VetAppeal.REJECTED
    super_ok = (not appeal.needs_super_review) or appeal.super_status == VetAppeal.APPROVED
    shelter_ok = (not appeal.needs_shelter_review) or appeal.shelter_status == VetAppeal.APPROVED

    if super_rejected:
        # Super admin is the top authority — their rejection is final.
        _finalize_suspended(vet_profile, appeal.super_reject_details or 'Appeal rejected by Super Admin.')
    elif shelter_rejected and super_ok:
        # Shelter rejected but super's stance is approval — escalate to super.
        appeal.super_final_status = VetAppeal.PENDING
        appeal.save(update_fields=['super_final_status'])
        vet_profile.lifecycle_status = VetProfile.LIFECYCLE_SUPER_FINAL_REVIEW
        vet_profile.save(update_fields=['lifecycle_status'])
        name = _vet_name(vet_profile.user)
        for admin in _super_admins():
            _notify(admin, 'Vet appeal escalated for final decision',
                    f'The Shelter Admin rejected {name}\'s appeal. Please make the final decision.')
        _notify(vet_profile.user, 'Appeal escalated',
                'Your appeal is under a final review by the Super Admin.')
    elif super_ok and shelter_ok:
        _finalize_approved(vet_profile)
    else:
        _finalize_suspended(vet_profile, 'Appeal rejected.')


def _resolve_final(vet_profile, appeal):
    if appeal.super_final_status == VetAppeal.APPROVED:
        _finalize_approved(vet_profile)
    elif appeal.super_final_status == VetAppeal.REJECTED:
        _finalize_suspended(vet_profile, appeal.super_final_details or 'Final decision: rejected by Super Admin.')


# ---------------------------------------------------------------------------
# Terminal states
# ---------------------------------------------------------------------------

def _blacklist(vet_profile, reason):
    try:
        BlacklistedVetRegistration.objects.get_or_create(
            registration_number=vet_profile.license_number,
            defaults={'email': vet_profile.user.email, 'reason': reason},
        )
    except Exception:
        pass


def _finalize_suspended(vet_profile, reason):
    vet_profile.lifecycle_status = VetProfile.LIFECYCLE_SUSPENDED
    vet_profile.blocked_reason = reason or 'Final rejection.'
    vet_profile.save(update_fields=['lifecycle_status', 'blocked_reason'])
    user = vet_profile.user
    user.is_active = False
    user.save(update_fields=['is_active'])
    _blacklist(vet_profile, BlacklistedVetRegistration.REASON_SUSPENDED)
    _notify(user, 'Registration permanently rejected',
            'Your veterinarian registration was permanently rejected and your account is suspended.')
    _email(user.id, 'suspended')


def _flag(vet_profile):
    vet_profile.lifecycle_status = VetProfile.LIFECYCLE_FLAGGED
    vet_profile.blocked_reason = 'The 5-day appeal window lapsed without full re-approval.'
    vet_profile.save(update_fields=['lifecycle_status', 'blocked_reason'])
    user = vet_profile.user
    user.is_active = False
    user.save(update_fields=['is_active'])
    _blacklist(vet_profile, BlacklistedVetRegistration.REASON_FLAGGED)
    _notify(user, 'Account flagged',
            'Your appeal window lapsed without full re-approval. Your account has been flagged.')
    _email(user.id, 'flagged')


def enforce_deadline(vet_profile):
    """Flag a stalled appeal window. Safe to call on any read path."""
    active_window = (VetProfile.LIFECYCLE_REJECTED,
                     VetProfile.LIFECYCLE_APPEAL_REVIEW,
                     VetProfile.LIFECYCLE_SUPER_FINAL_REVIEW)
    if vet_profile.lifecycle_status in active_window and vet_profile.is_deadline_passed:
        _flag(vet_profile)
        return True
    return False
