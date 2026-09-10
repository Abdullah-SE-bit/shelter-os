from django.urls import path
from . import views

urlpatterns = [
    path('cats/',                                    views.CatListCreateView.as_view()),
    path('cats/public/',                             views.CatPublicListView.as_view()),
    path('cats/microchip/generate/',                 views.MicrochipGenerateView.as_view()),
    path('cats/<uuid:pk>/',                          views.CatDetailView.as_view()),
    path('cats/<uuid:pk>/status/',                   views.CatStatusView.as_view()),
    path('cats/<uuid:pk>/photos/',                   views.CatPhotoView.as_view()),
    path('cats/<uuid:pk>/photos/<uuid:photo_pk>/',   views.CatPhotoView.as_view()),
]