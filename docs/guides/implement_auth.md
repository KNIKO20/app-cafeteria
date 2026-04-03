# Guía de Implementación Paso a Paso: Feature Auth (Google OAuth + JWT)

Esta guía explica en detalle cómo construir la feature de autenticación (`feature:auth`) siguiendo la checklist propuesta y respetando la **Arquitectura Hexagonal**.

Dividiremos el trabajo capa por capa, de adentro (Dominio) hacia afuera (Frontend).

---

## 1. Capa de Dominio (`backend/core/domain/`)

El dominio no sabe nada de bases de datos, web, ni tokens JWT. Solo define qué es un usuario y cómo se interactúa con él a nivel de reglas de negocio.

### 1.1 Entidad `User`
Crea el archivo `backend/core/domain/entities/user.py`:

```python
from dataclasses import dataclass
from enum import Enum

class UserRole(Enum):
    STUDENT = "student"
    ADMIN = "admin"

@dataclass
class User:
    id: str  # Será el email para Google, o el sub
    email: str
    name: str
    role: UserRole
    avatar_url: str = ""
    is_active: bool = True
```

### 1.2 Puerto `UserRepository`
Crea `backend/core/domain/ports/user_repository.py`. Es la interfaz para buscar y guardar usuarios.

```python
from abc import ABC, abstractmethod
from typing import Optional
from core.domain.entities.user import User

class UserRepository(ABC):
    @abstractmethod
    def save(self, user: User) -> User:
        pass
        
    @abstractmethod
    def find_by_email(self, email: str) -> Optional[User]:
        pass
        
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional[User]:
        pass
```

### 1.3 Puerto `AuthProvider`
Crea `backend/core/domain/ports/auth_provider.py`. El dominio necesita saber si un token externo es válido, pero no le importa si es de Google o Apple.

```python
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
        """Verifica un token externo y devuelve la información del usuario. Lanza ValueError si es inválido."""
        pass
```

---

## 2. Capa de Aplicación (`backend/core/application/`)

Aquí están los casos de uso. Son el "pegamento" que orquesta las entidades y los puertos.

### 2.1 Caso de uso `LoginWithGoogle`
Crea `backend/core/application/use_cases/login_with_google.py`.

```python
from dataclasses import dataclass
from core.domain.entities.user import User, UserRole
from core.domain.ports.user_repository import UserRepository
from core.domain.ports.auth_provider import AuthProvider
import jwt # PyJWT o usar el de DRF/SimpleJWT
from datetime import datetime, timedelta
from django.conf import settings

@dataclass
class LoginOutput:
    token: str
    user_id: str
    email: str
    name: str
    role: str

class LoginWithGoogleUseCase:
    def __init__(self, user_repo: UserRepository, auth_provider: AuthProvider):
        self.user_repo = user_repo
        self.auth_provider = auth_provider
        
    def execute(self, google_token: str) -> LoginOutput:
        # 1. Verificar token en Google
        user_info = self.auth_provider.verify_token(google_token)
        
        # 2. Buscar si el usuario ya existe en nuestra BD
        user = self.user_repo.find_by_email(user_info.email)
        
        # 3. Si no existe, lo creamos (registro automático)
        if not user:
            user = User(
                id=user_info.email, # Simplificación
                email=user_info.email,
                name=user_info.name,
                role=UserRole.STUDENT, # Por defecto es alumno
                avatar_url=user_info.avatar_url
            )
            self.user_repo.save(user)
            
        if not user.is_active:
            raise ValueError("Usuario inactivo")
            
        # 4. Generar JWT (esto idealmente lo haría otro puerto o servicio, para simplificar va aquí o en la vista si usamos DRF SimpleJWT)
        # Aquí crearías el payload del JWT con el user_id
        jwt_token = self._generate_jwt(user.id)
        
        return LoginOutput(
            token=jwt_token,
            user_id=user.id,
            email=user.email,
            name=user.name,
            role=user.role.value
        )
        
    def _generate_jwt(self, user_id: str) -> str:
        # Implementar la generación con PyJWT usando settings.SECRET_KEY
        pass
```

---

## 3. Adaptadores - Infraestructura (`backend/adapters/`)

Aquí implementamos los contratos (puertos) para hablar con el mundo real (MongoDB, Google y Django).

### 3.1 Adaptador de Persistencia (MongoDB)
Crea el modelo en `backend/adapters/persistence/models/user_model.py`:
```python
from mongoengine import Document, StringField, BooleanField

class UserDocument(Document):
    meta = {'collection': 'users'}
    user_id = StringField(required=True, unique=True)
    email = StringField(required=True, unique=True)
    name = StringField(required=True)
    role = StringField(required=True, default='student')
    avatar_url = StringField()
    is_active = BooleanField(default=True)
```

Implementa el repositorio en `backend/adapters/persistence/repositories/mongo_user_repository.py`:
```python
from core.domain.ports.user_repository import UserRepository
from core.domain.entities.user import User, UserRole
from adapters.persistence.models.user_model import UserDocument
from typing import Optional

class MongoUserRepository(UserRepository):
    def find_by_email(self, email: str) -> Optional[User]:
        doc = UserDocument.objects(email=email).first()
        return self._to_entity(doc) if doc else None
        
    def save(self, user: User) -> User:
        doc = UserDocument.objects(email=user.email).first()
        if not doc:
            doc = UserDocument(user_id=user.id)
        doc.email = user.email
        doc.name = user.name
        doc.role = user.role.value
        doc.avatar_url = user.avatar_url
        doc.is_active = user.is_active
        doc.save()
        return user
        
    # Implementar find_by_id y _to_entity...
```

### 3.2 Adaptador de Google
Crea `backend/adapters/auth/google_auth_provider.py`. Necesitarás instalar `google-auth` (`pip install google-auth requests`).

```python
from core.domain.ports.auth_provider import AuthProvider, UserInfo
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings

class GoogleAuthProvider(AuthProvider):
    def verify_token(self, token: str) -> UserInfo:
        try:
            # Verifica la firma y el audience
            idinfo = id_token.verify_oauth2_token(
                token, requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            
            # Solo permite correos del instituto si es necesario
            # if not idinfo['email'].endswith('@ies-instituto.es'):
            #    raise ValueError("Solo cuentas del instituto")
                
            return UserInfo(
                email=idinfo['email'],
                name=idinfo.get('name', ''),
                avatar_url=idinfo.get('picture', '')
            )
        except ValueError as e:
            raise ValueError(f"Token inválido: {str(e)}")
```

### 3.3 Endpoint Django DRF
Edita o crea `backend/adapters/api/views/auth_views.py`:

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from config.di_container import get_login_with_google_use_case

class GoogleLoginView(APIView):
    # Endpoint público, no requiere estar autenticado
    permission_classes = [] 
    
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            use_case = get_login_with_google_use_case()
            result = use_case.execute(token)
            
            return Response({
                "access_token": result.token,
                "user": {
                    "id": result.user_id,
                    "email": result.email,
                    "name": result.name,
                    "role": result.role
                }
            })
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
```

No olvides añadir la ruta a `adapters/api/urls.py`.

---

## 4. Configuración (`backend/config/`)

Registra los adaptadores en `backend/config/di_container.py`:

```python
from adapters.persistence.repositories.mongo_user_repository import MongoUserRepository
from adapters.auth.google_auth_provider import GoogleAuthProvider
from core.application.use_cases.login_with_google import LoginWithGoogleUseCase

_user_repo = MongoUserRepository()
_google_auth = GoogleAuthProvider()

def get_user_repo():
    return _user_repo

def get_login_with_google_use_case():
    return LoginWithGoogleUseCase(_user_repo, _google_auth)
```

---

## 5. Frontend (`frontend/`)

### 5.1 Comunicación con API (`services/authApi.ts`)
```typescript
import axios from 'axios';

// Asegúrate de que API_URL apunte a tu servidor Django
const API_URL = 'http://10.0.2.2:8000/api'; // Para Android Emulator

export const authApi = {
  loginWithGoogle: async (googleToken: string) => {
    const response = await axios.post(`${API_URL}/auth/google/`, { token: googleToken });
    return response.data; // { access_token, user }
  }
};
```

### 5.2 Estado Global Zustand (`stores/authStore.ts`)
```typescript
import { create } from 'zustand';
// Usar Expo SecureStore para guardar el token de forma segura
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string; email: string; name: string; role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (token, user) => {
    await SecureStore.setItemAsync('jwt_token', token);
    await SecureStore.setItemAsync('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ token: null, user: null, isAuthenticated: false });
  },
  
  restoreSession: async () => {
    const token = await SecureStore.getItemAsync('jwt_token');
    const userDataStr = await SecureStore.getItemAsync('user_data');
    if (token && userDataStr) {
      set({ token, user: JSON.parse(userDataStr), isAuthenticated: true });
    }
  }
}));
```

### 5.3 Pantalla de Login (`app/(auth)/login.tsx`)
Aprovecha `expo-auth-session` o `@react-native-google-signin/google-signin` (ya instalado).

```tsx
import { View, Text, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/authApi';
// Ejemplo usando importaciones simplificadas de google signin
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore(state => state.login);

  GooglSignin.configure({
    webClientId: 'TU_GOOGLE_CLIENT_ID_WEB' // El que configuras en Google Cloud
  });

  const handleGoogleLogin = async () => {
    try {
      // 1. Abre el pop-up de Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;
      
      if (!idToken) throw new Error("No token received from Google");

      // 2. Enviar el token a Django
      const backendResponse = await authApi.loginWithGoogle(idToken);
      
      // 3. Guardar en estado y redireccionar
      await login(backendResponse.access_token, backendResponse.user);
      
      // Redirigir según el rol
      if (backendResponse.user.role === 'admin') {
        router.replace('/(admin)/orders');
      } else {
        router.replace('/(student)/products');
      }
      
    } catch (error) {
      Alert.alert('Error de Login', String(error));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Cafetería IES</Text>
      <Button title="Iniciar sesión con Google" onPress={handleGoogleLogin} />
    </View>
  );
}
```

### 5.4 Redirección Automática (`app/_layout.tsx`)
Finalmente, en la capa superior controlas si el usuario puede acceder a las pantallas.

```tsx
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const { isAuthenticated, restoreSession, user } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Restaurar sesión al abrir la app
  useEffect(() => {
    restoreSession();
  }, []);

  // Proteger rutas
  useEffect(() => {
    const isAuthGroup = segments[0] === '(auth)';
    
    // Si no está logueado y no está en la pantalla de login
    if (!isAuthenticated && !isAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // Si está logueado y trata de ir al login
    else if (isAuthenticated && isAuthGroup) {
      const destination = user?.role === 'admin' ? '/(admin)/orders' : '/(student)/products';
      router.replace(destination);
    }
  }, [isAuthenticated, segments]);

  return <Slot />; // Slot renderiza la pantalla actual
}
```

---

¡Terminado! Siguiendo estos pasos tendrías la capa de Autenticación lista, modular y completamente adaptada a la Arquitectura Hexagonal.
