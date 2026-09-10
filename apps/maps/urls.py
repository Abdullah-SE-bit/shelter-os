from django.urls import path
from . import views

urlpatterns = [
    path('map/markers/', views.MapMarkersView.as_view(), name='markers'),
    path('map/shelters/', views.ShelterLocationsView.as_view(), name='shelters'),
    path('map/rescue-reports/', views.RescueMapView.as_view(), name='rescue-reports'),
    path('map/lost-cats/', views.LostCatsMapView.as_view(), name='lost-cats'),
    path('map/heatmap/rescue/', views.RescueHeatmapView.as_view(), name='heatmap-rescue'),
    path('map/heatmap/abandonment/', views.AbandonmentHeatmapView.as_view(), name='heatmap-abandonment'),
]