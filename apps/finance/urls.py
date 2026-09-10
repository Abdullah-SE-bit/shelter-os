from django.urls import path
from . import views

urlpatterns = [
    path('donations/', views.DonationCreateView.as_view()),
    path('donations/me/', views.MyDonationsView.as_view()),
    path('donations/shelter/<uuid:shelter_id>/', views.ShelterDonationsView.as_view()),
    path('donations/campaigns/', views.CampaignListCreateView.as_view()),
    path('donations/campaigns/<uuid:pk>/', views.CampaignDetailView.as_view()),
    path('finance/<uuid:shelter_id>/expenses/', views.ExpenseListCreateView.as_view()),
    path('finance/<uuid:shelter_id>/summary/', views.FinancialSummaryView.as_view()),
    path('finance/<uuid:shelter_id>/report/', views.FinancialReportView.as_view()),
]