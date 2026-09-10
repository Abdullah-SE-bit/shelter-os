from django.core.cache import cache
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication

# Only write last_activity_at at most once per this many seconds per user, so
# presence tracking doesn't add a DB write to every single authenticated request.
ACTIVITY_THROTTLE_SECONDS = 60


class JWTAuthenticationWithBlacklist(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, validated_token = result
        jti = validated_token.get('jti')
        if jti and cache.get(f'blacklisted_token:{jti}'):
            raise AuthenticationFailed('Token is blacklisted')

        # Presence tracking: stamp the user's last activity so admins can see
        # who is genuinely active (not just who logged in recently).
        self._touch_last_activity(user)
        return user, validated_token

    @staticmethod
    def _touch_last_activity(user):
        cache_key = f'last_activity_write:{user.pk}'
        if cache.get(cache_key):
            return
        cache.set(cache_key, True, timeout=ACTIVITY_THROTTLE_SECONDS)
        try:
            # .update() writes only this column and skips auto_now/signals.
            user.__class__.objects.filter(pk=user.pk).update(last_activity_at=timezone.now())
        except Exception:
            # Never let presence tracking break authentication.
            pass
