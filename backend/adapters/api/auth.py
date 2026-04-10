# adapters/api/auth.py
# Backend de autenticación JWT para Django REST Framework.
# Decodifica el token Bearer usando la misma SECRET_KEY con la que se firmó.

from rest_framework import authentication
from rest_framework import exceptions
import jwt
from django.conf import settings
from types import SimpleNamespace


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Autenticación personalizada que valida tokens JWT firmados con HS256.
    El token se envía en el header: Authorization: Bearer <token>
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None  # No hay header → no autenticado (permite acceso a vistas AllowAny)

        # Validar formato "Bearer <token>"
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]

        try:
            # Decodificar el JWT con la misma clave con la que se firmó
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("El token ha expirado.")
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed("Token inválido.")

        # Crear un objeto usuario simple para request.user
        # DRF necesita que request.user tenga al menos un atributo 'id'
        user = SimpleNamespace(
            id=payload.get("user_id"),
            role=payload.get("role"),
            is_authenticated=True,
        )

        return (user, token)