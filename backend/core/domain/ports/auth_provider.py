from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class UserInfo:
    email: str
    name: str
    avatar_url: str

class AuthProvider(ABC):
    @abstractmethod
    def verify_token(self, token: str) -> UserInfo:
        """
        Verifica un token externo (ej: Google OAuth) 
        y devuelve la información del usuario. 
        Lanza ValueError si es inválido.
        """
        pass
