from django.urls import path
from . import views

urlpatterns = [
    path('adoption/browse/', views.BrowseListingsView.as_view()),
    path('adoption/browse/<uuid:cat_id>/', views.ListingDetailView.as_view()),
    path('adoption/listings/', views.CreateListingView.as_view()),
    path('adoption/listings/<uuid:pk>/', views.ListingUpdateView.as_view()),
    path('adoption/favorites/', views.FavoritesView.as_view()),
    path('adoption/favorites/<uuid:cat_id>/', views.FavoriteToggleView.as_view()),
    path('adoption/applications/', views.ApplicationListCreateView.as_view()),
    path('adoption/applications/me/', views.MyApplicationsView.as_view()),
    path('adoption/applications/<uuid:pk>/', views.ApplicationDetailView.as_view()),
    path('adoption/applications/<uuid:pk>/review/', views.MoveToReviewView.as_view()),
    path('adoption/applications/<uuid:pk>/approve/', views.ApproveApplicationView.as_view()),
    path('adoption/applications/<uuid:pk>/reject/', views.RejectApplicationView.as_view()),
    path('adoption/applications/<uuid:pk>/withdraw/', views.WithdrawApplicationView.as_view()),
    path('adoption/applications/<uuid:pk>/interview/', views.ScheduleInterviewView.as_view()),
    path('adoption/interviews/<uuid:pk>/outcome/', views.RecordInterviewOutcomeView.as_view()),
]