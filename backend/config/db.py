# config/db.py — Conexión directa a MongoDB con pymongo.
# MongoUserRepository usa pymongo puro (no MongoEngine),
# así que necesitamos una función que devuelva la base de datos.

from pymongo import MongoClient
from decouple import config

_client = None
_db = None


def get_database():
    """
    Devuelve la instancia de la base de datos MongoDB (pymongo).
    Reutiliza la misma conexión en toda la aplicación (singleton).
    """
    global _client, _db
    if _db is None:
        host = config('MONGO_HOST', default='localhost')
        port = config('MONGO_PORT', default=27017, cast=int)
        db_name = config('MONGO_DB', default='cafeteria_db')
        _client = MongoClient(host, port)
        _db = _client[db_name]
    return _db
