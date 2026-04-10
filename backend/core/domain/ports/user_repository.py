from abc import ABC, abstractmethod
from typing import Optional
from core.domain.entities.user import User

class UserRepository(ABC):
    @abstractmethod
    def save(self, user: User) -> User:
        """Guarda o actualiza un usuario."""
        pass
        
    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        """Busca un usuario por su email."""
        pass
        
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional[User]:
        """Busca un usuario por su ID."""
        pass
