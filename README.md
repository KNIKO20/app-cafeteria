# ☕ Cafetería App - Arquitectura Hexagonal

Proyecto de gestión de cafetería universitaria utilizando una estructura de **Arquitectura Hexagonal (Ports & Adapters)** para separar las reglas de negocio de la tecnología.

## 🛠️ Tecnologías
- **Backend:** Django + Django REST Framework.
- **Base de Datos:** MongoDB (vía Mongoengine).
- **Frontend:** React Native con Expo (Expo Router).
- **Estado Global:** Zustand.

---

## 🚀 Guía de Configuración Rápida

### 1. Clonar el proyecto
```bash
git clone [https://github.com/tu-usuario/cafeteria.git](https://github.com/tu-usuario/cafeteria.git)
cd cafeteria
```

### 2. Configurar el Backend (Python)
1. Entrar a la carpeta: `cd backend`
2. Crear entorno virtual: `python -m venv venv`
3. Activar entorno:
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Instalar dependencias: `pip install -r requirements.txt`
5. Configurar variables de entorno:
   - Crea un archivo `.env` dentro de `backend/config/`
   - Añade tu cadena de conexión: `MONGO_URI=tu_conexion_atlas_o_local`

### 3. Configurar el Frontend (Expo)
1. Entrar a la carpeta: `cd ../frontend`
2. Instalar dependencias: `npm install --legacy-peer-deps`
3. Iniciar proyecto: `npx expo start`

---

## 📐 Estructura del Proyecto (Hexagonal)

Nuestra lógica reside en `backend/core`. Los adaptadores se encargan de la comunicación externa:

- **Core/Domain**: Entidades puras y definiciones de puertos (interfaces).
- **Core/Application**: Casos de uso (la lógica de qué pasa cuando pides un café).
- **Adapters/Api**: Django REST Framework (nuestra cara al público).
- **Adapters/Persistence**: Implementación de MongoDB.

---

## 👥 Colaboración
- **Antes de subir cambios:** Ejecuta `pip freeze > requirements.txt` si instalaste librerías nuevas en el backend.
- **Ramas:** Usar `git checkout -b feature/nombre-de-la-mejora` para nuevas funcionalidades.


