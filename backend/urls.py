from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (  # type: ignore[reportMissingImports]
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

V1 = "api/v1/"

urlpatterns = [

    # Django Admin panel
    path("admin/", admin.site.urls),

    # DRF login for browsable API (dev only)
    path("api-auth/", include("rest_framework.urls")),

    # Swagger docs — open http://127.0.0.1:8000/api/docs/ to see all your endpoints
    path("api/schema/", SpectacularAPIView.as_view(),                       name="schema"),
    path("api/docs/",   SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/",  SpectacularRedocView.as_view(url_name="schema"),   name="redoc"),

    # ── System config & lookup tables ────────────────
    path(V1, include(("apps.core.urls",          "core"),          namespace="core")),

    # ── Auth + User profiles ─────────────────────────
    path(V1, include(("apps.accounts.urls",      "accounts"),      namespace="accounts")),

    # ── Cat registry ─────────────────────────────────
    path(V1, include(("apps.cats.urls",          "cats"),          namespace="cats")),

    # ── Shelters + Intake + Discharge ────────────────
    path(V1, include(("apps.shelters.urls",      "shelters"),      namespace="shelters")),

    # ── Volunteers ───────────────────────────────────
    path(V1, include(("apps.volunteers.urls",    "volunteers"),    namespace="volunteers")),

    # ── Rescue reports + Assignment engine ───────────
    path(V1, include(("apps.rescue.urls",        "rescue"),        namespace="rescue")),

    # ── Lost & Found + Matching engine ───────────────
    path(V1, include(("apps.lost_found.urls",    "lost_found"),    namespace="lost_found")),

    # ── Adoption marketplace + Workflow ──────────────
    path(V1, include(("apps.adoption.urls",      "adoption"),      namespace="adoption")),

    # ── Medical records + Vaccination + Medication ───
    path(V1, include(("apps.medical.urls",       "medical"),       namespace="medical")),

    # ── Weight/Growth + Appointments + Health alerts ─
    path(V1, include(("apps.wellness.urls",      "wellness"),      namespace="wellness")),

    # ── Foster management ────────────────────────────
    path(V1, include(("apps.foster.urls",        "foster"),        namespace="foster")),

    # ── Shelter inventory ────────────────────────────
    path(V1, include(("apps.inventory.urls",     "inventory"),     namespace="inventory")),

    # ── Donations + Financial tracking ───────────────
    path(V1, include(("apps.finance.urls",       "finance"),       namespace="finance")),

    # ── Push + in-app notifications ──────────────────
    path(V1, include(("apps.notifications.urls", "notifications"), namespace="notifications")),

    # ── Chat / messaging ─────────────────────────────
    path(V1, include(("apps.messaging.urls",     "messaging"),     namespace="messaging")),

    # ── Reports + Analytics dashboard ────────────────
    path(V1, include(("apps.analytics.urls",     "analytics"),     namespace="analytics")),

    # ── Geospatial map endpoints ─────────────────────
    path(V1, include(("apps.maps.urls",          "maps"),          namespace="maps")),

    # ── Audit logs ───────────────────────────────────
    path(V1, include(("apps.audit.urls",         "audit"),         namespace="audit")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,  document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)