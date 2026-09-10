from django.urls import path
from . import views

urlpatterns = [
    path('growth/cats/<uuid:cat_id>/weight/', views.WeightLogView.as_view()),
    path('growth/cats/<uuid:cat_id>/weight/chart/', views.WeightChartView.as_view()),
    path('growth/cats/<uuid:cat_id>/nutrition/', views.NutritionPlanView.as_view()),
    path('growth/cats/<uuid:cat_id>/feeding/', views.FeedingLogView.as_view()),
    path('appointments/', views.AppointmentListCreateView.as_view()),
    path('appointments/me/', views.MyAppointmentsView.as_view()),
    path('appointments/<uuid:pk>/', views.AppointmentDetailView.as_view()),
    path('appointments/<uuid:pk>/confirm/', views.ConfirmAppointmentView.as_view()),
    path('appointments/<uuid:pk>/complete/', views.CompleteAppointmentView.as_view()),
    path('appointments/<uuid:pk>/cancel/', views.CancelAppointmentView.as_view()),
    path('appointments/cats/<uuid:cat_id>/', views.CatAppointmentsView.as_view()),
    path('appointments/vet/schedule/', views.VetScheduleView.as_view()),
    path('health-alerts/cats/<uuid:cat_id>/', views.CatAlertsView.as_view()),
    path('health-alerts/me/', views.MyAlertsView.as_view()),
    path('health-alerts/vet/', views.VetAlertsView.as_view()),
    path('health-alerts/shelter/<uuid:shelter_id>/', views.ShelterAlertsView.as_view()),
    path('health-alerts/<uuid:pk>/resolve/', views.ResolveAlertView.as_view()),
]