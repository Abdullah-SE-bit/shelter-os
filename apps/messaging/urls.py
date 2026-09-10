from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.ConversationListCreateView.as_view()),
    path('conversations/<uuid:pk>/', views.ConversationDetailView.as_view()),
    path('conversations/<uuid:pk>/messages/', views.MessageListCreateView.as_view()),
    path('conversations/<uuid:pk>/mark-read/', views.MarkConversationReadView.as_view()),
]