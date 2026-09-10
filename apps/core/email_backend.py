"""Non-blocking email backend.

Form submissions (signup, password reset, adoption status changes, vet
workflow, etc.) used to block for several seconds because the "async" Celery
email tasks run synchronously in the request thread whenever
``CELERY_TASK_ALWAYS_EAGER`` is on (local/dev, no worker), and each one waited
on a live SMTP handshake with Gmail.

This backend removes that latency for every code path that goes through
``django.core.mail`` by handing the actual delivery to a background daemon
thread and returning immediately. It works the same whether the task runs
eagerly in-request (local) or inside a Celery worker (production), so no call
sites need to change.

The real delivery backend is configured via ``settings.EMAIL_DELIVERY_BACKEND``
(defaults to SMTP), so switching between console/SMTP/etc. still works.
"""

import logging
import threading

from django.conf import settings
from django.core.mail import get_connection
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger("email.threaded")

_DEFAULT_DELIVERY_BACKEND = "django.core.mail.backends.smtp.EmailBackend"


class ThreadedEmailBackend(BaseEmailBackend):
    """Deliver email off the request/worker thread so senders never block."""

    def send_messages(self, email_messages):
        if not email_messages:
            return 0
        # Copy so the caller can't mutate the list out from under the thread.
        messages = list(email_messages)
        thread = threading.Thread(
            target=self._deliver,
            args=(messages,),
            name="threaded-email",
            daemon=True,
        )
        thread.start()
        # Report the messages as accepted for delivery. Actual send happens
        # in the background; failures are logged, not surfaced to the request.
        return len(messages)

    def _deliver(self, messages):
        from django.db import connections

        delivery_backend = getattr(
            settings, "EMAIL_DELIVERY_BACKEND", _DEFAULT_DELIVERY_BACKEND
        )
        try:
            connection = get_connection(backend=delivery_backend, fail_silently=False)
            connection.send_messages(messages)
        except Exception:  # pragma: no cover - best-effort background delivery
            logger.exception("Background email delivery failed")
        finally:
            # This thread may have opened its own DB connection; close it so we
            # don't leak connections across the pool.
            connections.close_all()
