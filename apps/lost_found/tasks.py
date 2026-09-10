import math
import math
import re
from celery import shared_task

# Score at or above which a lost alert and a found report are considered a
# candidate match. Kept modest so real matches surface even when some signals
# (coordinates, linked cat) are missing.
MATCH_THRESHOLD = 0.35

_STOPWORDS = {
    'the', 'and', 'with', 'near', 'cat', 'kitten', 'lost', 'found', 'for', 'was', 'has',
    'have', 'this', 'that', 'around', 'area', 'color', 'colour', 'male', 'female', 'his',
    'her', 'she', 'him', 'they', 'them', 'about', 'from', 'very', 'some', 'any', 'our',
}


def _haversine(lat1, lng1, lat2, lng2):
    radius = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    )
    return radius * 2 * math.asin(math.sqrt(a))


def _tokens(*parts):
    text = ' '.join(str(p) for p in parts if p)
    words = re.findall(r'[a-zA-Z]+', text.lower())
    return {w for w in words if len(w) >= 3 and w not in _STOPWORDS}


def _lost_tokens(alert):
    parts = [alert.title, alert.description, alert.behavioral_notes]
    if alert.cat:
        parts += [alert.cat.name, alert.cat.color, alert.cat.pattern]
        breed = getattr(alert.cat, 'breed', None)
        if breed is not None:
            parts.append(getattr(breed, 'display_label', ''))
    return _tokens(*parts)


def _found_tokens(report):
    parts = [report.description, report.breed_guess] + list(report.color_tags or [])
    return _tokens(*parts)


def _location_score(alert, report, max_km=75):
    """1.0 when found right where the cat was lost, decaying to ~0 past max_km.
    Neutral (0.5) when either side has no coordinates."""
    coords = [alert.last_seen_latitude, alert.last_seen_longitude,
              report.found_latitude, report.found_longitude]
    if any(c is None for c in coords):
        return 0.5
    distance = _haversine(*coords)
    if distance > max_km:
        return 0.05
    return 1.0 - (distance / max_km)


def _time_score(alert, report):
    """Closer in time = more likely the same cat. Neutral when unknown."""
    if not alert.last_seen_at or not report.found_at:
        return 0.5
    day_diff = abs((report.found_at - alert.last_seen_at).days)
    if day_diff <= 7:
        return 1.0
    if day_diff <= 30:
        return 0.6
    if day_diff <= 90:
        return 0.3
    return 0.1


def _text_score(alert, report):
    """Attribute/description overlap. This is the signal that lets matching work
    even without coordinates — it compares breed/color/description words."""
    a = _lost_tokens(alert)
    b = _found_tokens(report)
    if not a or not b:
        return 0.4
    overlap = len(a & b)
    denom = min(len(a), len(b))
    return min(1.0, overlap / denom) if denom else 0.0


def _compute_score(alert, report):
    return round(
        0.35 * _location_score(alert, report)
        + 0.15 * _time_score(alert, report)
        + 0.50 * _text_score(alert, report),
        4,
    )


def _notify_match(alert, report, score):
    from apps.notifications.tasks import send_notification
    pct = round(score * 100)
    try:
        send_notification.delay(
            user_id=str(alert.reporter_id),
            title='Possible match for your lost cat',
            body=f"A found cat may match your lost report ({pct}% confidence). Review it now.",
            category='RESCUE', reference_type='LOST_ALERT', reference_id=str(alert.id),
        )
        send_notification.delay(
            user_id=str(report.reporter_id),
            title='The cat you found may have an owner',
            body=f"A lost-cat report may match the cat you found ({pct}% confidence).",
            category='RESCUE', reference_type='FOUND_REPORT', reference_id=str(report.id),
        )
    except Exception:
        # Never let notification delivery break the matching flow.
        pass


def _upsert_match(alert, report, score, notify=True):
    """Create the match if new (keep its score fresh otherwise). Returns
    (match, created)."""
    from .models import MatchResult
    match = MatchResult.objects.filter(lost_alert=alert, found_report=report).first()
    if match:
        if match.status == 'PENDING' and abs((match.score or 0) - score) > 0.0001:
            match.score = score
            match.save(update_fields=['score'])
        return match, False
    match = MatchResult.objects.create(lost_alert=alert, found_report=report, score=score)
    if notify:
        _notify_match(alert, report, score)
    return match, True


def match_found_report(report):
    """Compare a found report against every active lost alert; create matches
    at or above threshold. Runs synchronously. Returns created MatchResults."""
    from .models import LostCatAlert
    if report.status not in ('OPEN', 'MATCHED'):
        return []
    created = []
    alerts = LostCatAlert.objects.filter(status='ACTIVE', is_deleted=False).select_related('cat', 'cat__breed')
    for alert in alerts:
        score = _compute_score(alert, report)
        if score >= MATCH_THRESHOLD:
            match, was_created = _upsert_match(alert, report, score)
            if was_created:
                created.append(match)
    return created


def match_lost_alert(alert):
    """Compare a lost alert against every open found report. Returns created."""
    from .models import FoundCatReport
    if alert.status != 'ACTIVE':
        return []
    created = []
    reports = FoundCatReport.objects.filter(status='OPEN', is_deleted=False)
    for report in reports:
        score = _compute_score(alert, report)
        if score >= MATCH_THRESHOLD:
            match, was_created = _upsert_match(alert, report, score)
            if was_created:
                created.append(match)
    return created


@shared_task
def run_matching_engine():
    """Global sweep — re-run all active alerts against all open reports."""
    from .models import LostCatAlert
    for alert in LostCatAlert.objects.filter(status='ACTIVE', is_deleted=False).select_related('cat', 'cat__breed'):
        match_lost_alert(alert)


@shared_task
def auto_create_lost_alert(cat_id, user_id):
    from apps.cats.models import Cat
    from .models import LostCatAlert

    try:
        cat = Cat.objects.get(pk=cat_id)
    except Cat.DoesNotExist:
        return

    LostCatAlert.objects.get_or_create(
        cat=cat,
        status='ACTIVE',
        defaults={
            'reporter_id': user_id,
            'title': f"Lost: {cat.name or 'Unknown cat'}",
            'description': 'Auto-created when cat status changed to LOST.',
            'last_seen_at': cat.updated_at,
        },
    )
