# settings.py — Configuración principal de Django

import os
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'rest_framework',
    'corsheaders',
    'core',
    'adapters',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

# ── MongoDB ────────────────────────────────────────────
import mongoengine
mongoengine.connect(
    db=config('MONGO_DB', default='cafeteria'),
    host=config('MONGO_HOST', default='localhost'),
    port=config('MONGO_PORT', default=27017, cast=int),
)

# ── REST Framework ─────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'adapters.api.auth.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ── CORS (para el frontend React) ─────────────────────
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",   # Expo web
    "http://localhost:3000",   # React web
]

# ── Variables de entorno ───────────────────────────────
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')