from google.oauth2 import id_token
from google.auth.transport import requests
from core.domain.ports.auth_provider import AuthProvider, UserInfo


class GoogleAuthProvider(AuthProvider):
    def __init__(self, client_id: str):
        self.client_id = client_id

    def verify_token(self, token: str) -> UserInfo:
        try:
            # Verifica el token directamente con Google
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), self.client_id)

            # Devuelve UserInfo (dataclass del puerto), no un dict
            return UserInfo(
                email=idinfo.get("email"),
                name=idinfo.get("name", ""),
                avatar_url=idinfo.get("picture", "")
            )
        except ValueError:
            raise ValueError("El token de Google es inválido o ha expirado.")