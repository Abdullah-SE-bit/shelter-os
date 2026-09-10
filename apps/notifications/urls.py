from django.urls import path
from . import views

urlpatterns = [
    path('notifications/', views.NotificationListView.as_view()),
    path('notifications/unread-count/', views.UnreadCountView.as_view()),
    path('notifications/<uuid:pk>/mark-read/', views.MarkReadView.as_view()),
    path('notifications/mark-all-read/', views.MarkAllReadView.as_view()),
    path('notifications/fcm-token/', views.FCMTokenView.as_view()),
    path('notifications/preferences/', views.PreferencesView.as_view()),
]