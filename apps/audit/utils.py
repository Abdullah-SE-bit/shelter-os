from .models import AuditLog


def log_audit(request, action, entity, old_value=None, new_value=None, actor=None):
    """Write an audit/activity record.

    `actor` can be passed explicitly for flows where request.user is not yet
    authenticated (e.g. account creation during registration). Otherwise the
    authenticated request user is used.
    """
    if actor is None:
        actor = request.user if request and getattr(request, 'user', None) and request.user.is_authenticated else None
    actor_role = getattr(actor, 'role', '') if actor else ''

    # Get IP address
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''

    AuditLog.objects.create(
        actor=actor,
        actor_role=actor_role,
        action=action,
        entity_type=entity.__class__.__name__ if entity else '',
        entity_id=getattr(entity, 'id', None),
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else '',
    )
