# Tests para el caso de uso ProcessPaymentUseCase.

import unittest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.domain.entities.order import Order, OrderItem, OrderStatus
from core.application.use_cases.process_payment import ProcessPaymentUseCase, ProcessPaymentInput
from tests.fakes.fake_order_repository import FakeOrderRepository
from tests.fakes.fake_payment_gateway import FakePaymentGateway


class TestProcessPaymentUseCase(unittest.TestCase):
    """Tests del caso de uso ProcessPayment."""

    def setUp(self):
        """Prepara repos fake y un pedido de ejemplo."""
        self.order_repo = FakeOrderRepository()
        self.payment_gateway = FakePaymentGateway(should_succeed=True)

        # Crear un pedido pendiente de pago
        self.order = Order(
            id="order-1",
            user_id="user-1",
            items=[
                OrderItem("p1", "Bocadillo", 3.50, 2),
                OrderItem("p2", "Café", 1.20, 1),
            ],
            pickup_timeslot="10:30-11:00",
            pickup_date=datetime.now() + timedelta(hours=1),
            status=OrderStatus.PENDING_PAYMENT,
        )
        self.order_repo.save(self.order)

        self.use_case = ProcessPaymentUseCase(self.order_repo, self.payment_gateway)

    # ── Pago exitoso ────────────────────────────────────────

    def test_payment_success(self):
        """Pago exitoso → devuelve success + pickup code."""
        input_data = ProcessPaymentInput(
            order_id="order-1",
            payment_token="tok_test_123",
        )
        result = self.use_case.execute(input_data)

        self.assertTrue(result["success"])
        self.assertIsNotNone(result["pickup_code"])
        self.assertEqual(result["transaction_id"], "fake-txn-12345")

    def test_payment_updates_order_status(self):
        """Tras pagar, el pedido queda en estado PAID."""
        input_data = ProcessPaymentInput(
            order_id="order-1",
            payment_token="tok_test_123",
        )
        self.use_case.execute(input_data)

        saved = self.order_repo.find_by_id("order-1")
        self.assertEqual(saved.status, OrderStatus.PAID)

    def test_payment_saves_reference(self):
        """Tras pagar, se guarda la referencia de la transacción."""
        input_data = ProcessPaymentInput(
            order_id="order-1",
            payment_token="tok_test_123",
        )
        self.use_case.execute(input_data)

        saved = self.order_repo.find_by_id("order-1")
        self.assertEqual(saved.payment_reference, "fake-txn-12345")

    def test_payment_sends_correct_amount(self):
        """El gateway recibe el monto correcto del pedido."""
        input_data = ProcessPaymentInput(
            order_id="order-1",
            payment_token="tok_test_123",
        )
        self.use_case.execute(input_data)

        # Total: 3.50*2 + 1.20*1 = 8.20
        self.assertAlmostEqual(self.payment_gateway.last_amount, 8.20)
        self.assertEqual(self.payment_gateway.last_token, "tok_test_123")

    # ── Errores ─────────────────────────────────────────────

    def test_order_not_found(self):
        """Error si el pedido no existe."""
        input_data = ProcessPaymentInput(
            order_id="inexistente",
            payment_token="tok_test",
        )
        with self.assertRaises(ValueError) as ctx:
            self.use_case.execute(input_data)
        self.assertIn("no encontrado", str(ctx.exception))

    def test_payment_failed(self):
        """Error si el gateway rechaza el pago."""
        gateway_fail = FakePaymentGateway(should_succeed=False)
        use_case = ProcessPaymentUseCase(self.order_repo, gateway_fail)

        input_data = ProcessPaymentInput(
            order_id="order-1",
            payment_token="tok_bad",
        )
        with self.assertRaises(ValueError) as ctx:
            use_case.execute(input_data)
        self.assertIn("Pago fallido", str(ctx.exception))

    def test_payment_failed_order_unchanged(self):
        """Si el pago falla, el pedido mantiene su estado original."""
        gateway_fail = FakePaymentGateway(should_succeed=False)
        use_case = ProcessPaymentUseCase(self.order_repo, gateway_fail)

        input_data = ProcessPaymentInput(
            order_id="order-1",
            payment_token="tok_bad",
        )
        try:
            use_case.execute(input_data)
        except ValueError:
            pass

        saved = self.order_repo.find_by_id("order-1")
        self.assertEqual(saved.status, OrderStatus.PENDING_PAYMENT)


if __name__ == '__main__':
    unittest.main()
