from django.urls import path
from . import views

urlpatterns = [
    path('medical/cats/<uuid:cat_id>/records/', views.MedicalRecordListCreateView.as_view()),
    path('medical/records/<uuid:pk>/', views.MedicalRecordDetailView.as_view()),
    path('medical/records/<uuid:pk>/attachments/', views.MedicalAttachmentView.as_view()),
    path('medical/cats/<uuid:cat_id>/allergies/', views.AllergyListCreateView.as_view()),
    path('medical/allergies/<uuid:pk>/', views.AllergyDetailView.as_view()),
    path('vaccinations/cats/<uuid:cat_id>/', views.VaccinationListCreateView.as_view()),
    path('vaccinations/cats/<uuid:cat_id>/upcoming/', views.UpcomingVaccinesView.as_view()),
    path('vaccinations/<uuid:pk>/', views.VaccinationDetailView.as_view()),
    path('medications/cats/<uuid:cat_id>/prescriptions/', views.PrescriptionListCreateView.as_view()),
    path('medications/prescriptions/<uuid:pk>/', views.PrescriptionDetailView.as_view()),
    path('medications/prescriptions/<uuid:pk>/complete/', views.CompletePrescriptionView.as_view()),
    path('medications/prescriptions/<uuid:pk>/dose-log/', views.DoseLogView.as_view()),
]