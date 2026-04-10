# Tests para las entidades Order y OrderItem y sus reglas de negocio.

import unittest
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.domain.entities.order import Order, OrderItem, OrderStatus


class TestOrderItem(unittest.TestCase):
    """Tests de la entidad OrderItem."""

    def test_subtotal_single_item(self):
        """Subtotal = precio × cantidad."""
        item = OrderItem(
            product_id="p1",
            product_name="Café",
            unit_price=1.50,
            quantity=1,
        )
        self.assertAlmostEqual(item.subtotal, 1.50)

    def test_subtotal_multiple_quantity(self):
        """Subtotal con múltiples unidades."""
        item = OrderItem(
            product_id="p1",
            product_name="Café",
            unit_price=1.50,
            quantity=3,
        )
        self.assertAlmostEqual(item.subtotal, 4.50)


class TestOrder(unittest.TestCase):
    """Tests de la entidad Order."""

    def _make_order(self, **overrides) -> Order:
        """Helper: crea un pedido con valores por defecto."""
        defaults = {
            "user_id": "user-1",
            "items": [
                OrderItem("p1", "Bocadillo", 3.50, 2),
                OrderItem("p2", "Café", 1.20, 1),
            ],
            "pickup_timeslot": "10:30-11:00",
            "pickup_date": datetime.now() + timedelta(hours=1),
        }
        defaults.update(overrides)
        return Order(**defaults)

    # ── total ───────────────────────────────────────────────

    def test_total_multiple_items(self):
        """Total = suma de subtotales de todos los ítems."""
        order = self._make_order()
        # 3.50*2 + 1.20*1 = 8.20
        self.assertAlmostEqual(order.total, 8.20)

    def test_total_empty_order(self):
        """Total de pedido sin ítems = 0."""
        order = self._make_order(items=[])
        self.assertAlmostEqual(order.total, 0.0)

    # ── generate_pickup_code ────────────────────────────────

    def test_generate_pickup_code_format(self):
        """El código de recogida tiene 4 dígitos."""
        order = self._make_order()
        code = order.generate_pickup_code()
        self.assertEqual(len(code), 4)
        self.assertTrue(code.isdigit())

    def test_generate_pickup_code_stored(self):
        """El código se almacena en el atributo pickup_code."""
        order = self._make_order()
        code = order.generate_pickup_code()
        self.assertEqual(order.pickup_code, code)

    # ── can_be_cancelled ────────────────────────────────────

    def test_can_cancel_pending_payment(self):
        """Se puede cancelar si está pendiente de pago."""
        order = self._make_order(status=OrderStatus.PENDING_PAYMENT)
        self.assertTrue(order.can_be_cancelled())

    def test_can_cancel_paid(self):
        """Se puede cancelar si está pagado (aún no preparado)."""
        order = self._make_order(status=OrderStatus.PAID)
        self.assertTrue(order.can_be_cancelled())

    def test_cannot_cancel_preparing(self):
        """NO se puede cancelar si ya se está preparando."""
        order = self._make_order(status=OrderStatus.PREPARING)
        self.assertFalse(order.can_be_cancelled())

    def test_cannot_cancel_ready(self):
        """NO se puede cancelar si ya está listo."""
        order = self._make_order(status=OrderStatus.READY)
        self.assertFalse(order.can_be_cancelled())

    def test_cannot_cancel_collected(self):
        """NO se puede cancelar si ya fue recogido."""
        order = self._make_order(status=OrderStatus.COLLECTED)
        self.assertFalse(order.can_be_cancelled())

    # ── mark_as_paid ────────────────────────────────────────

    def test_mark_as_paid(self):
        """Pagar un pedido pendiente → estado PAID."""
        order = self._make_order()
        order.mark_as_paid("txn-abc-123")
        self.assertEqual(order.status, OrderStatus.PAID)
        self.assertEqual(order.payment_reference, "txn-abc-123")

    def test_mark_as_paid_generates_pickup_code(self):
        """Al pagar se genera el código de recogida."""
        order = self._make_order()
        order.mark_as_paid("txn-abc-123")
        self.assertIsNotNone(order.pickup_code)
        self.assertEqual(len(order.pickup_code), 4)

    def test_mark_as_paid_already_paid(self):
        """Error si se intenta pagar un pedido ya pagado."""
        order = self._make_order(status=OrderStatus.PAID)
        with self.assertRaises(ValueError):
            order.mark_as_paid("txn-xyz")

    def test_mark_as_paid_from_preparing(self):
        """Error si se intenta pagar un pedido en preparación."""
        order = self._make_order(status=OrderStatus.PREPARING)
        with self.assertRaises(ValueError):
            order.mark_as_paid("txn-xyz")

    # ── mark_as_preparing ───────────────────────────────────

    def test_mark_as_preparing(self):
        """Preparar un pedido pagado → estado PREPARING."""
        order = self._make_order(status=OrderStatus.PAID)
        order.mark_as_preparing()
        self.assertEqual(order.status, OrderStatus.PREPARING)

    def test_mark_as_preparing_not_paid(self):
        """Error si se intenta preparar un pedido no pagado."""
        order = self._make_order(status=OrderStatus.PENDING_PAYMENT)
        with self.assertRaises(ValueError):
            order.mark_as_preparing()

    # ── mark_as_ready / collected ───────────────────────────

    def test_mark_as_ready(self):
        """Marcar como listo → estado READY."""
        order = self._make_order(status=OrderStatus.PREPARING)
        order.mark_as_ready()
        self.assertEqual(order.status, OrderStatus.READY)

    def test_mark_as_collected(self):
        """Marcar como recogido → estado COLLECTED."""
        order = self._make_order(status=OrderStatus.READY)
        order.mark_as_collected()
        self.assertEqual(order.status, OrderStatus.COLLECTED)

    # ── validate_advance_time ───────────────────────────────

    def test_validate_advance_time_ok(self):
        """No lanza error si el pedido es con suficiente antelación."""
        future = datetime.now() + timedelta(hours=1)
        # No debería lanzar excepción
        Order.validate_advance_time(future, min_minutes_ahead=15)

    def test_validate_advance_time_too_soon(self):
        """Error si el pedido es con menos de 15 minutos de antelación."""
        too_soon = datetime.now() + timedelta(minutes=5)
        with self.assertRaises(ValueError):
            Order.validate_advance_time(too_soon, min_minutes_ahead=15)

    # ── Estado inicial ──────────────────────────────────────

    def test_default_status(self):
        """El estado inicial es PENDING_PAYMENT."""
        order = self._make_order()
        self.assertEqual(order.status, OrderStatus.PENDING_PAYMENT)

    def test_default_pickup_code_none(self):
        """El código de recogida inicial es None."""
        order = self._make_order()
        self.assertIsNone(order.pickup_code)

    def test_id_is_generated(self):
        """Se genera un ID UUID automáticamente."""
        order = self._make_order()
        self.assertIsNotNone(order.id)
        self.assertTrue(len(order.id) > 0)


if __name__ == '__main__':
    unittest.main()
