from core.domain.ports.user_repository import UserRepository
from core.domain.entities.user import User

class GetCurrentUserUseCase:
    
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        
    def execute(self, user_id: str) -> User:
        """
        Obtiene el perfil del usuario autenticado.
        Lanza un error si no se encuentra.
        """
        # 1. Buscar el usuario mediante el repositorio
        # 2. Si no existe, lanzar excepción
        # 3. Retornar el usuario
        
        raise NotImplementedError("Implementar la lógica del caso de uso.")
