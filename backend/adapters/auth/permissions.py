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
    
class IsAuthenticatedHex(permissions.BasePermission):
    """
    Permiso simple
    Solo verifica que el Middleware de JWT haya validado al usuario.
    """
    def has_permission(self, request, view):
        # Si el Middleware de JWT puso algo en request.user, es que el token era válido
        return bool(request.user and hasattr(request.user, 'id'))