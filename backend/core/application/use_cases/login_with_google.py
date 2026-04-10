from dataclasses import dataclass
from datetime import datetime, timedelta
import jwt

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
        
    def execute(self, google_token: str) -> str:
        """
        Verifica el token de Google, busca o crea el usuario, 
        y devuelve un JWT firmado con la SECRET_KEY de Django.
        """
        # 1. Verificar token en el AuthProvider (devuelve UserInfo)
        user_info = self.auth_provider.verify_token(google_token)
        
        # 2. Buscar si el usuario ya existe en UserRepository
        user = self.user_repo.find_by_email(user_info.email)
        
        # 3. Si no existe, crearlo
        if not user:
            user = User(
                id=user_info.email,
                email=user_info.email,
                name=user_info.name,
                role=UserRole.ADMIN,
                avatar_url=user_info.avatar_url
            )
            self.user_repo.save(user)
            
        if not user.is_active:
            from core.domain.exceptions.auth_exceptions import UserInactiveError
            raise UserInactiveError("El usuario está inactivo")

        # 4. Generar JWT real con PyJWT
        from django.conf import settings
        payload = {
            "user_id": user.id,
            "role": user.role.value,
            "exp": datetime.utcnow() + timedelta(days=7),
            "iat": datetime.utcnow(),
        }
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        
        return jwt_token


