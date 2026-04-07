from core.domain.ports.user_repository import UserRepository
from core.domain.entities.user import User
from core.domain.exceptions.auth_exceptions import UserNotFoundError

class GetCurrentUserUseCase:
    
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        
    def execute(self, user_id: str) -> User:
        """
        Obtiene el perfil del usuario autenticado.
        Lanza un error si no se encuentra.
        """
        user = self.user_repo.find_by_id(user_id)
        if not user:
            raise UserNotFoundError(f"Usuario con id '{user_id}' no encontrado.")
        return user

