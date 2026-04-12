# settings.py — Configuración principal de Django

import logging
import os
from decouple import config
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = ['*']
ROOT_URLCONF = 'config.urls'
STATIC_URL = 'static/'
ADMIN_EMAILS = config('ADMIN_EMAILS', default='').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',         
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
    'adapters',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',              
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ── MongoDB ────────────────────────────────────────────
import mongoengine
# mongoengine.connect(
#     db=config('MONGO_DB', default='cafeteria_db'),
#     host=config('MONGO_HOST', default='localhost'),
#     port=config('MONGO_PORT', default=27017, cast=int),
# )
logger = logging.getLogger(__name__)
try:
    mongoengine.connect(
        host=config('MONGO_HOST'),
        alias='default',
        serverSelectionTimeoutMS=5000 
    )
    print("MongoDB conectado exitosamente")
except Exception as e:
    print(f"Error conectando a MongoDB: {e}")

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'adapters.api.auth.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ── CORS (para el frontend React) ─────────────────────
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:8081",   # Expo web
#     "http://localhost:3000",   # React web
# ]
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# ── Variables de entorno ───────────────────────────────
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')