from django.urls import path
from . import views

urlpatterns = [
    path('foster/register/', views.RegisterFosterView.as_view()),
    path('foster/profiles/', views.FosterProfileListView.as_view()),
    path('foster/profiles/<uuid:pk>/', views.FosterProfileDetailView.as_view()),
    path('foster/placements/', views.FosterPlacementCreateView.as_view()),
    path('foster/placements/me/', views.MyFosterPlacementsView.as_view()),
    path('foster/placements/<uuid:pk>/checkin/', views.FosterCheckinView.as_view()),
    path('foster/placements/<uuid:pk>/return/', views.ReturnToShelterView.as_view()),
    path('foster/placements/<uuid:shelter_id>/', views.ShelterFosterPlacementsView.as_view()),
]