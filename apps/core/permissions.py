from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SUPER_ADMIN'


class IsShelterAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'SHELTER_ADMIN'


class IsVet(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'VET'


class IsVolunteer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'VOLUNTEER'


class IsCatOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CAT_OWNER'


class IsAdopter(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADOPTER'


class IsShelterAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['SHELTER_ADMIN', 'SUPER_ADMIN']


class IsVetOrShelterAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['VET', 'SHELTER_ADMIN', 'SUPER_ADMIN']


class IsOwnerOrShelterAdmin(BasePermission):
    """Object-level: requester must own the resource or be shelter admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['SHELTER_ADMIN', 'SUPER_ADMIN']:
            return True
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsCatOwnerOfObject(BasePermission):
    """Object-level: requester must be the owner of the cat."""
    def has_object_permission(self, request, view, obj):
        # For Cat objects, verify ownership
        if hasattr(obj, 'owner'):
            return obj.owner == request.user and request.user.role == 'CAT_OWNER'
        return False
