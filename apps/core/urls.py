from django.urls import path
from . import views

urlpatterns = [
    path('config/', views.SystemConfigListView.as_view()),
    path('config/<str:key>/', views.SystemConfigUpdateView.as_view()),
    path('lookup/<str:category>/', views.LookupValuesView.as_view()),
]