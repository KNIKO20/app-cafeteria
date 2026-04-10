# 🧪 Guía de Testing — Cafetería App

## Requisitos previos

Solo necesitas **Python 3.10+**. Los tests son unitarios puros y **no requieren**:
- MongoDB corriendo
- Django server activo
- Variables de entorno configuradas
- Conexión a internet

---

## Ejecutar TODOS los tests

Desde la carpeta `backend/`:

```bash
python -m unittest discover -s tests -v
```

Deberías ver algo así:

```
test_product_available_with_stock (tests.domain.test_product.TestProduct) ... ok
test_product_unavailable (tests.domain.test_product.TestProduct) ... ok
test_order_total_multiple_items (tests.domain.test_order.TestOrder) ... ok
...
----------------------------------------------------------------------
Ran 61 tests in 0.1s

OK
```

---

## Ejecutar tests por capa

### Solo tests de dominio (entidades)
```bash
python -m unittest discover -s tests/domain -v
```

### Solo tests de aplicación (use cases)
```bash
python -m unittest discover -s tests/application -v
```

### Un archivo concreto
```bash
python -m unittest tests.domain.test_product -v
```

### Un test concreto
```bash
python -m unittest tests.domain.test_product.TestProduct.test_product_available_with_stock
```

---

## Estructura de los tests

```
backend/tests/
├── domain/                     ← Entidades y reglas de negocio
│   ├── test_product.py         (11 tests)
│   ├── test_order.py           (18 tests)
│   └── test_timeslot.py        (12 tests)
├── application/                ← Casos de uso
│   ├── test_get_menu.py        (6 tests)
│   ├── test_create_order.py    (7 tests)
│   └── test_process_payment.py (7 tests)
└── fakes/                      ← Repositorios en memoria
    ├── fake_product_repository.py
    ├── fake_order_repository.py
    └── fake_payment_gateway.py
```

---

## ¿Qué son los fakes?

Los "fakes" son implementaciones de los puertos (interfaces) que usan **diccionarios en memoria** en lugar de MongoDB. Esto permite:

1. **Tests rápidos** — Sin conexión a BD
2. **Tests aislados** — Cada test empieza con datos limpios
3. **Tests fiables** — No dependen del estado de la BD

Es el mismo patrón que sugiere el `di_container.py`:
> *"Para tests, creas FakeOrderRepository() en lugar de MongoOrderRepository(). Solo cambias este archivo y todo lo demás funciona igual."*

---

## ¿Qué hace cada test?

| Archivo | Qué prueba |
|---------|-----------|
| `test_product.py` | Stock, disponibilidad, reducción de stock, categorías |
| `test_order.py` | Total, pickup code, transiciones de estado, cancelación, tiempo de antelación |
| `test_timeslot.py` | Capacidad, reservas, cierre de franjas, formato del label |
| `test_get_menu.py` | Filtro por categoría, productos no disponibles, categoría inválida |
| `test_create_order.py` | Creación de pedido, producto inexistente, sin stock, tiempo insuficiente |
| `test_process_payment.py` | Pago exitoso, pedido no encontrado, pago fallido, estado tras error |

---

## Añadir nuevos tests

Para una nueva feature (ej: `feature:auth`):

1. Crear fake si necesitas un nuevo puerto:
   ```
   tests/fakes/fake_user_repository.py
   ```

2. Crear tests de dominio:
   ```
   tests/domain/test_user.py
   ```

3. Crear tests de use case:
   ```
   tests/application/test_login.py
   ```

4. Seguir el patrón existente: `setUp()` con fakes → tests con `assert`.
