import uuid
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from celery import shared_task


def sha256(value):
    return hashlib.sha256(value.encode()).hexdigest()


@shared_task
def send_password_changed_email(user_id):
    from .models import User
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return
    send_mail(
        subject="Your PawTrack OS password was changed",
        message="Your account password has been updated successfully.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


@shared_task
def send_verification_email(user_id):
    from .models import User, EmailVerification
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return
    # Invalidate existing tokens
    EmailVerification.objects.filter(user=user, is_used=False).update(is_used=True)
    raw_token = str(uuid.uuid4())
    EmailVerification.objects.create(
        user=user,
        token_hash=sha256(raw_token),
        expires_at=timezone.now() + timedelta(hours=24),
    )
    link = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"
    send_mail(
        subject="Verify your PawTrack OS email",
        message=f"Click here to verify your email: {link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


@shared_task
def send_password_reset_email(user_id):
    from .models import User, PasswordReset
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return
    PasswordReset.objects.filter(user=user, is_used=False).update(is_used=True)
    raw_token = str(uuid.uuid4())
    PasswordReset.objects.create(
        user=user,
        token_hash=sha256(raw_token),
        expires_at=timezone.now() + timedelta(minutes=15),
    )
    link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    send_mail(
        subject="Reset your PawTrack OS password",
        message=f"Click here to reset your password (expires in 15 minutes): {link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


@shared_task
def send_vet_status_email(user_id, kind):
    """Send a veterinarian a status update about their registration/approval."""
    from .models import User, VetProfile
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return
    vp = VetProfile.objects.filter(user=user).first()

    deadline_txt = ''
    if vp and vp.appeal_deadline:
        deadline_txt = vp.appeal_deadline.strftime('%d %b %Y %H:%M UTC')

    messages = {
        'rejected': (
            "Your veterinarian registration was rejected",
            "Your veterinarian registration request was rejected. You have 5 days and a single "
            "appeal to respond. Log in to your profile to submit your appeal with additional "
            "veterinary proof (PDF only)."
            + (f"\n\nAppeal deadline: {deadline_txt}." if deadline_txt else "")
        ),
        'approved': (
            "Your veterinarian registration is approved",
            "Congratulations! Your veterinarian registration has been fully approved. "
            "All features are now unlocked when you log in.",
        ),
        'suspended': (
            "Your veterinarian registration was permanently rejected",
            "After review, your veterinarian registration has been permanently rejected and your "
            "account is now suspended. You will not be able to log in again.",
        ),
        'flagged': (
            "Your account has been flagged",
            "Your 5-day appeal window lapsed without full re-approval. Your account has been "
            "flagged and you will not be able to log in or register again.",
        ),
    }
    subject, body = messages.get(kind, ("Update on your veterinarian registration",
                                        "There is an update on your veterinarian registration."))
    send_mail(
        subject=f"PawTrack OS — {subject}",
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )
