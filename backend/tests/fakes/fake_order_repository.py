# Implementación in-memory del OrderRepository para tests.
# Sustituye a MongoOrderRepository sin tocar la base de datos.

from typing import List, Optional
from core.domain.entities.order import Order, OrderStatus
from core.domain.ports.order_repository import OrderRepository


class FakeOrderRepository(OrderRepository):
    """Repositorio de pedidos en memoria para tests."""

    def __init__(self):
        self._orders: dict[str, Order] = {}

    # ── Implementación del puerto ───────────────────────────
    def save(self, order: Order) -> Order:
        self._orders[order.id] = order
        return order

    def find_by_id(self, order_id: str) -> Optional[Order]:
        return self._orders.get(order_id)

    def find_by_user(self, user_id: str) -> List[Order]:
        return [
            o for o in self._orders.values()
            if o.user_id == user_id
        ]

    def find_pending_orders(self) -> List[Order]:
        return [
            o for o in self._orders.values()
            if o.status in [OrderStatus.PAID, OrderStatus.PREPARING]
        ]

    def find_by_pickup_code(self, code: str) -> Optional[Order]:
        for order in self._orders.values():
            if order.pickup_code == code:
                return order
        return None
