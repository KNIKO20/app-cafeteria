@echo off
echo [1/4] Configurando Backend Django...
cd backend

:: Crear venv si no existe
if not exist venv (
    python -m venv venv
    echo Entorno virtual creado.
)

:: Instalar dependencias (Activa venv temporalmente para pip)
call venv\Scripts\activate
pip install -r requirements.txt

echo [2/4] Configurando Frontend Expo...
cd ../frontend
call npm install --legacy-peer-deps

echo [3/4] Levantando el Backend...
:: Abrir una nueva ventana para el backend
start cmd /k "cd ../backend && venv\Scripts\activate && python manage.py runserver"

echo [4/4] Levantando el Frontend...
npx expo start
