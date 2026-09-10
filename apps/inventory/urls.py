from django.urls import path
from . import views

urlpatterns = [
    path('inventory/<uuid:shelter_id>/items/', views.InventoryListCreateView.as_view()),
    path('inventory/<uuid:shelter_id>/items/low-stock/', views.LowStockView.as_view()),
    path('inventory/items/<uuid:pk>/', views.InventoryItemDetailView.as_view()),
    path('inventory/items/<uuid:pk>/restock/', views.RestockView.as_view()),
    path('inventory/items/<uuid:pk>/use/', views.UseStockView.as_view()),
    path('inventory/items/<uuid:pk>/history/', views.TransactionHistoryView.as_view()),
]