# Tests para el caso de uso CreateOrderUseCase.

import unittest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.domain.entities.product import Product, ProductCategory
from core.application.use_cases.create_order import CreateOrderUseCase, CreateOrderInput
from tests.fakes.fake_product_repository import FakeProductRepository
from tests.fakes.fake_order_repository import FakeOrderRepository


class TestCreateOrderUseCase(unittest.TestCase):
    """Tests del caso de uso CreateOrder."""

    def setUp(self):
        """Prepara repos fake y productos de ejemplo."""
        self.product_repo = FakeProductRepository()
        self.order_repo = FakeOrderRepository()

        # Productos disponibles
        self.product_repo.add(Product(
            id="p1", name="Bocadillo de Jamón", price=3.50,
            category=ProductCategory.BOCADILLO, is_available=True, stock=10,
        ))
        self.product_repo.add(Product(
            id="p2", name="Café con Leche", price=1.20,
            category=ProductCategory.BEBIDA, is_available=True, stock=None,
        ))
        # Producto NO disponible
        self.product_repo.add(Product(
            id="p3", name="Tarta de Queso", price=2.50,
            category=ProductCategory.POSTRE, is_available=False,
        ))

        self.use_case = CreateOrderUseCase(self.order_repo, self.product_repo)

        # Fecha de recogida en el futuro (cumple la antelación mínima)
        self.future_date = (datetime.now() + timedelta(hours=1)).isoformat()

    def _make_input(self, **overrides) -> CreateOrderInput:
        """Helper: crea un input con valores por defecto."""
        defaults = {
            "user_id": "user-1",
            "items": [
                {"product_id": "p1", "quantity": 2},
                {"product_id": "p2", "quantity": 1},
            ],
            "pickup_timeslot_id": "10:30-11:00",
            "pickup_date": self.future_date,
        }
        defaults.update(overrides)
        return CreateOrderInput(**defaults)

    # ── Creación exitosa ────────────────────────────────────

    def test_create_order_success(self):
        """Pedido creado correctamente con productos válidos."""
        input_data = self._make_input()
        result = self.use_case.execute(input_data)

        self.assertIsNotNone(result.order_id)
        self.assertEqual(result.status, "pending_payment")
        # Total: 3.50*2 + 1.20*1 = 8.20
        self.assertAlmostEqual(result.total, 8.20)

    def test_order_saved_in_repository(self):
        """El pedido se guarda en el repositorio."""
        input_data = self._make_input()
        result = self.use_case.execute(input_data)

        saved = self.order_repo.find_by_id(result.order_id)
        self.assertIsNotNone(saved)
        self.assertEqual(saved.user_id, "user-1")

    def test_order_items_mapped_correctly(self):
        """Los ítems del pedido están mapeados correctamente."""
        input_data = self._make_input(
            items=[{"product_id": "p1", "quantity": 3}]
        )
        result = self.use_case.execute(input_data)

        saved = self.order_repo.find_by_id(result.order_id)
        self.assertEqual(len(saved.items), 1)
        self.assertEqual(saved.items[0].product_name, "Bocadillo de Jamón")
        self.assertEqual(saved.items[0].quantity, 3)
        self.assertAlmostEqual(saved.items[0].unit_price, 3.50)

    # ── Errores de validación ───────────────────────────────

    def test_product_not_found(self):
        """Error si el producto no existe."""
        input_data = self._make_input(
            items=[{"product_id": "inexistente", "quantity": 1}]
        )
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("no encontrado", str(ctx.exception))

    def test_product_out_of_stock(self):
        """Error si el producto no está disponible."""
        input_data = self._make_input(
            items=[{"product_id": "p3", "quantity": 1}]
        )
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("no está disponible", str(ctx.exception))

    def test_pickup_too_soon(self):
        """Error si la fecha de recogida es demasiado pronto."""
        too_soon = (datetime.now() + timedelta(minutes=5)).isoformat()
        input_data = self._make_input(pickup_date=too_soon)
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("antelación", str(ctx.exception))

    # ── Casos límite ────────────────────────────────────────

    def test_single_item_order(self):
        """Pedido con un solo ítem."""
        input_data = self._make_input(
            items=[{"product_id": "p2", "quantity": 1}]
        )
        result = self.use_case.execute(input_data)
        self.assertAlmostEqual(result.total, 1.20)


if __name__ == '__main__':
    unittest.main()
