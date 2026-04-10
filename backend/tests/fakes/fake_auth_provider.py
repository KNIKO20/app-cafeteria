from core.domain.ports.auth_provider import AuthProvider, UserInfo

class FakeAuthProvider(AuthProvider):
    def verify_token(self, token: str) -> UserInfo:
        if token == "valid_token":
            return UserInfo(email="test@alumno.com", name="Alumno de Prueba", avatar_url="")
        if token == "new_user_token":
            return UserInfo(email="nuevo@alumno.com", name="Nuevo Alumno", avatar_url="")
        
        raise ValueError("Invalid token")
