from django.urls import path
from . import views

urlpatterns = [
    path('volunteers/register/',                    views.RegisterVolunteerView.as_view()),
    path('volunteers/me/',                          views.MyVolunteerProfileView.as_view()),
    path('volunteers/me/assignments/',              views.MyAssignmentsView.as_view()),
    path('volunteers/me/shelter-change-request/',   views.ShelterChangeRequestView.as_view()),
    path('volunteers/shelter-change-requests/',     views.ShelterChangeRequestListView.as_view()),
    path('volunteers/shelter-change-requests/<uuid:pk>/approve/', views.ShelterChangeRequestDecisionView.as_view(), {'decision': 'approve'}),
    path('volunteers/shelter-change-requests/<uuid:pk>/reject/',  views.ShelterChangeRequestDecisionView.as_view(), {'decision': 'reject'}),
    path('volunteers/nearby/',                      views.NearbyVolunteersView.as_view()),
    path('volunteers/',                             views.VolunteerListView.as_view()),
    path('volunteers/<uuid:pk>/',                   views.VolunteerDetailView.as_view()),
    path('volunteers/assignments/<uuid:pk>/accept/',   views.AcceptAssignmentView.as_view()),
    path('volunteers/assignments/<uuid:pk>/decline/',  views.DeclineAssignmentView.as_view()),
    path('volunteers/assignments/<uuid:pk>/complete/', views.CompleteAssignmentView.as_view()),
]