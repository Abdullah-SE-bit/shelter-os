from django.urls import path
from . import views

urlpatterns = [
    # B4: audit log endpoints (SUPER_ADMIN only). The project urlconf mounts
    # this app under `api/v1/`, so these resolve to `/api/v1/audit/logs/...`.
    path('audit/logs/',                                   views.AuditLogListView.as_view()),
    path('audit/logs/entity/<str:entity_type>/<uuid:entity_id>/', views.EntityHistoryView.as_view()),
    path('audit/logs/user/<uuid:user_id>/',               views.UserAuditView.as_view()),
]
