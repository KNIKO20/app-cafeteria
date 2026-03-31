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
        # 2. Buscar si el usuario ya existe en UserRepository
        # 3. Si no existe, crearlo
        # 4. Generar JWT (implementar lógica)
        # 5. Retornar LoginOutput
        
        raise NotImplementedError("Implementar la lógica del caso de uso.")
