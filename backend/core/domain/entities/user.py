from dataclasses import dataclass
from enum import Enum
from typing import Optional

class UserRole(Enum):
    STUDENT = "student"
    ADMIN = "admin"

@dataclass
class User:
    id: str
    email: str
    name: str
    role: UserRole
    avatar_url: str = ""
    is_active: bool = True
    push_token: Optional[str] = None
