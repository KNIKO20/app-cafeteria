# adapters/api/auth.py
from rest_framework import authentication
from rest_framework import exceptions
import jwt
from django.conf import settings

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None
        # falta implemntar
        return (None, None)