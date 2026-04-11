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
        from django.conf import settings
        
        # 1. Verificar token en el AuthProvider
        user_info = self.auth_provider.verify_token(google_token)
        
        # detecta admins del .env
        admin_list = [email.strip() for email in settings.ADMIN_EMAILS]
        is_admin = user_info.email in admin_list
        target_role = UserRole.ADMIN if is_admin else UserRole.STUDENT

        # 2. Buscar si el usuario ya existe
        user = self.user_repo.find_by_email(user_info.email)
        
        # 3. Si no existe, crearlo con el rol correspondiente
        if not user:
            user = User(
                id=user_info.email,
                email=user_info.email,
                name=user_info.name,
                role=target_role, # Asignamos Admin o Student aquí
                avatar_url=user_info.avatar_url
            )
            self.user_repo.save(user)
        else:
            # actualizar rol si ha cambiado en el .env desde la última vez
            if user.role != target_role:
                user.role = target_role
                self.user_repo.save(user)
            
        if not user.is_active:
            from core.domain.exceptions.auth_exceptions import UserInactiveError
            raise UserInactiveError("El usuario está inactivo")

        # 4. Generar JWT real
        payload = {
            "user_id": user.id,
            "email": user.email, 
            "role": user.role.value,
            "exp": datetime.utcnow() + timedelta(days=7),
            "iat": datetime.utcnow(),
        }
        jwt_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        
        return jwt_token


