from django.urls import path
from . import views

urlpatterns = [
    path('analytics/overview/', views.PlatformOverviewView.as_view(), name='overview'),
    path('reports/summary/', views.ReportSummaryView.as_view(), name='report-summary'),
    path('analytics/shelter/<uuid:shelter_id>/', views.ShelterDashboardView.as_view(), name='shelter-dashboard'),
    path('analytics/adoption-trends/', views.AdoptionTrendsView.as_view(), name='adoption-trends'),
    path('analytics/rescue-metrics/', views.RescueMetricsView.as_view(), name='rescue-metrics'),
    path('reports/adoptions/', views.AdoptionReportView.as_view(), name='adoption-report'),
    path('reports/rescues/', views.RescueReportView.as_view(), name='rescue-report'),
    path('reports/donations/', views.DonationReportView.as_view(), name='donation-report'),
    path('reports/vaccinations/compliance/', views.VaccinationComplianceView.as_view(), name='vaccination-compliance'),
    path('reports/volunteers/activity/', views.VolunteerActivityView.as_view(), name='volunteer-activity'),
    path('reports/export/<str:report_type>/', views.ExportReportView.as_view(), name='export-report'),
]