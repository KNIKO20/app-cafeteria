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

    def setUp(self):
        self.product_repo = FakeProductRepository()
        self.order_repo = FakeOrderRepository()

        self.product_repo.add(Product(
            id="p1", name="Bocadillo de Jamón", price=3.50,
            category=ProductCategory.BOCADILLO, is_available=True, stock=10,
        ))
        self.product_repo.add(Product(
            id="p2", name="Café con Leche", price=1.20,
            category=ProductCategory.BEBIDA, is_available=True, stock=None,
        ))
        self.product_repo.add(Product(
            id="p3", name="Tarta de Queso", price=2.50,
            category=ProductCategory.POSTRE, is_available=False,
        ))

        self.use_case = CreateOrderUseCase(self.order_repo, self.product_repo)

    # Añadimos user_id en el helper de creación de inputs para los tests
    def _make_input(self, items=None, pickup_date=None, user_id="user_123"):
        future_date = (datetime.now() + timedelta(minutes=30)).isoformat()
        return CreateOrderInput(
            user_id=user_id,
            items=items or [{"product_id": "p1", "quantity": 1}],
            pickup_timeslot_id="ts1",
            pickup_date=pickup_date or future_date
        )

    def test_create_order_success(self):
        """Pedido exitoso con bypass de pago."""
        input_data = self._make_input()
        result = self.use_case.execute(input_data)

        self.assertIsNotNone(result.order_id)
        self.assertEqual(result.total, 3.50)
        # El estado debe ser "paid" por el bypass
        self.assertEqual(result.status, "paid")
        # El código de recogida se debe generar automáticamente en el bypass
        self.assertIsNotNone(result.pickup_code)

    def test_product_not_found(self):
        input_data = self._make_input(items=[{"product_id": "inexistente", "quantity": 1}])
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("no encontrado", str(ctx.exception))

    def test_product_out_of_stock(self):
        input_data = self._make_input(items=[{"product_id": "p3", "quantity": 1}])
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("no está disponible", str(ctx.exception))

    def test_pickup_too_soon(self):
        too_soon = (datetime.now() + timedelta(minutes=5)).isoformat()
        input_data = self._make_input(pickup_date=too_soon)
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("antelación", str(ctx.exception))