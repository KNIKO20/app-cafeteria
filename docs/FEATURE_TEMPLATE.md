# Feature: `<nombre>`

> Descripción breve de la feature.

---

## Checklist de Implementación

### 🧠 Dominio (`backend/core/domain/`)
- [ ] Entidad en `entities/<feature>.py` — `@dataclass` con campos y reglas de negocio
- [ ] Puerto en `ports/<feature>_repository.py` — `ABC` con métodos abstractos
- [ ] Excepciones en `exceptions/` (si aplica)

### ⚙️ Aplicación (`backend/core/application/`)
- [ ] Caso de uso en `use_cases/<accion>_<feature>.py` — Clase con `execute()`

### 🔌 Adaptadores Backend (`backend/adapters/`)
- [ ] Modelo Mongo en `persistence/models/<feature>_model.py`
- [ ] Repositorio en `persistence/repositories/mongo_<feature>_repository.py`
- [ ] Serializer en `api/serializers/<feature>_serializer.py`
- [ ] Vista en `api/views/<feature>_views.py`
- [ ] Ruta en `api/urls.py`

### 🔧 Configuración (`backend/config/`)
- [ ] Registrar repo y use case en `di_container.py`

### 📱 Frontend (`frontend/`)
- [ ] Servicio API en `services/<feature>Api.ts`
- [ ] Store Zustand en `stores/<feature>Store.ts`
- [ ] Pantalla(s) en `app/(<grupo>)/`
- [ ] Componente(s) en `components/`

### ✅ Verificación
- [ ] Endpoint probado con Postman/Thunder Client
- [ ] Pantalla probada en Expo Go
- [ ] Commit y push a la rama `feature/<nombre>`

---

## Notas de Diseño

_Describe aquí las decisiones técnicas importantes, modelos de datos, y endpoints planificados._

### Endpoints

| Método | Ruta              | Descripción          |
|--------|--------------------|----------------------|
| GET    | `/api/<feature>/`  | Listar               |
| POST   | `/api/<feature>/`  | Crear                |
| GET    | `/api/<feature>/<id>/` | Detalle          |
| PUT    | `/api/<feature>/<id>/` | Actualizar       |
| DELETE | `/api/<feature>/<id>/` | Eliminar         |

### Modelo de datos

```python
@dataclass
class MiEntidad:
    id: str
    nombre: str
    # ... añade tus campos
```
