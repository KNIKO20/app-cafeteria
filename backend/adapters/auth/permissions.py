from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Permiso que verifica si el usuario tiene el rol de ADMIN 
    en nuestra entidad de dominio.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            hasattr(request.user, 'role') and 
            request.user.role == 'admin' 
        )