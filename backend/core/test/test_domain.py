from datetime import datetime

from core.domain.entities.order import OrderItem, Order

order = Order(
    user_id="user_12345",
    items=[
        OrderItem(product_id="A",product_name="Napolitana",unit_price=1.4, quantity=2),
        OrderItem(product_id="B",product_name="Panini", unit_price=2.2,quantity=1)
    ],
    pickup_timeslot="10:30-11:00",
    pickup_date=datetime(2025, 3, 30)
)

print(order)
print(order.total)

print(order.status)
order.mark_as_paid("ref-pago")
print(order.status)