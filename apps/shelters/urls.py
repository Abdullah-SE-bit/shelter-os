from django.urls import path
from . import views

urlpatterns = [
    path('shelters/',                                views.ShelterListCreateView.as_view()),
    path('shelters/my/dashboard/',                   views.MyShelterDashboardView.as_view()),  # Must come before <uuid:pk>
    path('shelters/<uuid:pk>/',                      views.ShelterDetailView.as_view()),
    path('shelters/<uuid:pk>/capacity/',             views.ShelterCapacityView.as_view()),
    path('shelters/<uuid:pk>/staff/',                views.ShelterStaffView.as_view()),
    path('shelters/<uuid:pk>/staff/<uuid:user_id>/', views.ShelterStaffDetailView.as_view()),
    path('shelters/<uuid:pk>/cats/',                 views.ShelterCatsView.as_view()),
    path('shelters/<uuid:pk>/dashboard/',            views.ShelterDashboardView.as_view()),
    path('intake/me/',                               views.IntakeView.as_view(), {'shelter_id': 'me'}),
    path('intake/<uuid:shelter_id>/',                views.IntakeView.as_view()),
    path('intake/records/<uuid:pk>/',                views.IntakeRecordDetailView.as_view()),
    path('discharge/me/',                            views.DischargeView.as_view(), {'shelter_id': 'me'}),
    path('discharge/<uuid:shelter_id>/',             views.DischargeView.as_view()),
]