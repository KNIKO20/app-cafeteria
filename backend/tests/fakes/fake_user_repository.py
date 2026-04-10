from typing import Optional
from core.domain.entities.user import User
from core.domain.ports.user_repository import UserRepository

class FakeUserRepository(UserRepository):
    def __init__(self):
        self._users: dict[str, User] = {}

    def save(self, user: User) -> User:
        self._users[user.id] = user
        return user

    def find_by_email(self, email: str) -> Optional[User]:
        for user in self._users.values():
            if user.email == email:
                return user
        return None

    def find_by_id(self, user_id: str) -> Optional[User]:
        return self._users.get(user_id)
