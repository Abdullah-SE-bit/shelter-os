from django.urls import path
from . import views

urlpatterns = [
    path('rescue/reports/',                             views.RescueReportListCreateView.as_view()),
    path('rescue/reports/nearby/',                      views.NearbyRescueView.as_view()),
    path('rescue/reports/<uuid:pk>/',                   views.RescueReportDetailView.as_view()),
    path('rescue/reports/<uuid:pk>/assign/',            views.AssignRescueView.as_view()),
    path('rescue/reports/<uuid:pk>/status/',            views.UpdateRescueStatusView.as_view()),
    path('rescue/reports/<uuid:pk>/resolve/',           views.ResolveRescueView.as_view()),
    path('rescue-engine/suggest/<uuid:report_id>/',     views.SuggestAssignmentView.as_view()),
    path('rescue-engine/auto-assign/<uuid:report_id>/', views.AutoAssignView.as_view()),
]