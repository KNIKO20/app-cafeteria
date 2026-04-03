from dataclasses import dataclass
from core.domain.ports.user_repository import UserRepository
from core.domain.ports.auth_provider import AuthProvider
from core.domain.entities.user import User, UserRole

@dataclass
class LoginOutput:
    token: str
    user_id: str
    email: str
    name: str
    role: str

class LoginWithGoogleUseCase:
    
    def __init__(self, user_repo: UserRepository, auth_provider: AuthProvider):
        self.user_repo = user_repo
        self.auth_provider = auth_provider
        
    def execute(self, google_token: str) -> LoginOutput:
        """
        Verifica el token de Google, busca o crea el usuario, 
        y devuelve la información y un JWT.
        """
        # 1. Verificar token en el AuthProvider
        user_info = self.auth_provider.verify_token(google_token)
        
        # 2. Buscar si el usuario ya existe en UserRepository
        user = self.user_repo.find_by_email(user_info.email)
        
        # 3. Si no existe, crearlo
        if not user:
            user = User(
                id=user_info.email,
                email=user_info.email,
                name=user_info.name,
                role=UserRole.STUDENT,
                avatar_url=user_info.avatar_url
            )
            self.user_repo.save(user)
            
        if not user.is_active:
            from core.domain.exceptions.auth_exceptions import InactiveUserError
            raise InactiveUserError("El usuario está inactivo")

        # 4. Generar JWT (implementación simple sin depender de PyJWT para evitar dependencias por ahora)
        import base64
        import json
        payload = {"user_id": user.id, "role": user.role.value}
        encoded_payload = base64.b64encode(json.dumps(payload).encode()).decode()
        jwt_token = f"header.{encoded_payload}.signature"
        
        # 5. Retornar LoginOutput
        return LoginOutput(
            token=jwt_token,
            user_id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value
        )

