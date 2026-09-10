from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/',            views.RegisterView.as_view()),
    path('auth/login/',               views.LoginView.as_view()),
    path('auth/guest-session/',       views.GuestSessionView.as_view()),
    path('auth/logout/',              views.LogoutView.as_view()),
    path('auth/refresh/',             views.RefreshTokenView.as_view()),
    path('auth/token/refresh/',       views.RefreshTokenView.as_view()),
    path('auth/verify-email/',        views.VerifyEmailView.as_view()),
    path('auth/resend-verification/', views.ResendVerificationView.as_view()),
    path('auth/forgot-password/',     views.ForgotPasswordView.as_view()),
    path('auth/reset-password/',      views.ResetPasswordView.as_view()),

    # User profile
    path('users/me/',                           views.MeView.as_view()),
    path('users/me/addresses/',                 views.AddressListCreateView.as_view()),
    path('users/me/addresses/<uuid:pk>/',       views.AddressDetailView.as_view()),
    path('users/me/emergency-contacts/',        views.EmergencyContactView.as_view()),
    path('users/',                              views.UserListView.as_view()),

    # Admin
    path('admin/users/',                        views.AdminUserListView.as_view()),
    path('admin/users/create/',                 views.AdminUserCreateView.as_view()),
    path('admin/users/<uuid:user_id>/role/',    views.AdminUserRoleView.as_view()),
    path('admin/users/<uuid:user_id>/status/',  views.AdminUserStatusView.as_view()),
    path('admin/users/<uuid:user_id>/verify/',  views.AdminUserVerifyView.as_view()),

    # Vet approval workflow
    path('admin/vets/',                                  views.VetApprovalListView.as_view()),
    path('admin/vets/<uuid:user_id>/super-approval/',    views.VetSuperDecisionView.as_view()),
    path('admin/vets/<uuid:user_id>/shelter-approval/',  views.VetShelterDecisionView.as_view()),
    path('admin/vets/<uuid:user_id>/appeal-document/',   views.VetAppealDocumentView.as_view()),

    # Vet self-service appeal
    path('vets/me/appeal/',                              views.VetAppealSubmitView.as_view()),
]