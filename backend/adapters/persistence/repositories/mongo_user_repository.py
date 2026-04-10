from typing import Optional
from core.domain.entities.user import User, UserRole
from core.domain.ports.user_repository import UserRepository

class MongoUserRepository(UserRepository):
    def __init__(self, db_collection):
        self.collection = db_collection

    def _to_entity(self, doc) -> Optional[User]:
        if not doc:
            return None
        return User(
            id=str(doc["_id"]),
            email=doc["email"],
            name=doc["name"],
            role=UserRole(doc["role"]),
            avatar_url=doc.get("avatar_url", ""),
            is_active=doc.get("is_active", True)
        )

    def save(self, user: User) -> User:
        user_dict = {
            "_id": user.id, # Usaremos el ID de Google como _id en Mongo
            "email": user.email,
            "name": user.name,
            "role": user.role.value,
            "avatar_url": user.avatar_url,
            "is_active": user.is_active
        }
        # upsert=True actualizará si existe, o creará uno nuevo si no existe
        self.collection.update_one({"_id": user.id}, {"$set": user_dict}, upsert=True)
        return user

    def find_by_email(self, email: str) -> Optional[User]:
        doc = self.collection.find_one({"email": email})
        return self._to_entity(doc)

    def find_by_id(self, user_id: str) -> Optional[User]:
        doc = self.collection.find_one({"_id": user_id})
        return self._to_entity(doc)