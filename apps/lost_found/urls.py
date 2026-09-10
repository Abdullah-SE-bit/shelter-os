from django.urls import path
from . import views

urlpatterns = [
    # Lost cat alerts
    path('lost-found/lost/',                     views.LostAlertListCreateView.as_view()),
    path('lost-found/lost/<uuid:pk>/',           views.LostAlertDetailView.as_view()),
    path('lost-found/lost/<uuid:pk>/resolve/',   views.ResolveLostAlertView.as_view()),

    # Found cat reports
    path('lost-found/found/',                    views.FoundReportListCreateView.as_view()),
    path('lost-found/found/<uuid:pk>/',          views.FoundReportDetailView.as_view()),
    path('lost-found/found/<uuid:pk>/matches/',  views.FoundReportMatchesView.as_view()),
    path('lost-found/found/<uuid:pk>/link/',     views.LinkFoundToLostView.as_view()),
    path('lost-found/found/<uuid:pk>/intake/',   views.FoundReportIntakeView.as_view()),

    # Matches
    path('lost-found/matches/<uuid:lost_id>/',          views.MatchListView.as_view()),
    path('lost-found/matches/<uuid:match_id>/confirm/', views.ConfirmMatchView.as_view()),
    path('lost-found/matches/<uuid:match_id>/reject/',  views.RejectMatchView.as_view()),
]
