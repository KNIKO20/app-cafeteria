# La entidad Order es el corazón del sistema.
# Contiene todas las reglas de negocio del pedido:
# - Estados válidos y transiciones
# - Cálculo del total
# - Validaciones de tiempo

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum
import uuid

class OrderStatus(Enum):
    PENDING_PAYMENT = "pending_payment"   # Esperando pago
    PAID = "paid"                         # Pagado, en cola
    PREPARING = "preparing"               # El personal lo está preparando
    READY = "ready"                       # Listo para recoger
    COLLECTED = "collected"               # Recogido por el alumno
    CANCELLED = "cancelled"               # Cancelado

@dataclass
class OrderItem:
    product_id: str
    product_name: str
    unit_price: float
    quantity: int
    
    #convierte el resultado de la función en atributo subtotal float
    @property
    def subtotal(self) -> float:
        return self.unit_price * self.quantity

@dataclass
class Order:
    user_id: str
    items: List[OrderItem] #If no argument is given, the constructor creates a new empty list.
    # si no le pasan OrderItem, crea una lista mutable
    pickup_timeslot: str                  # Ej: "10:30-11:00"
    pickup_date: datetime

    # Cada vez que alguien cree un objeto nuevo, ejecuta esta 
    # función para darle un ID único a este pedido
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: OrderStatus = OrderStatus.PENDING_PAYMENT

    # default_factory asegura que la hora se capture en el preciso 
    # momento en que se instancia el objeto Order
    created_at: datetime = field(default_factory=datetime.now)
    pickup_code: Optional[str] = None
    payment_reference: Optional[str] = None
    
    # ── Reglas de negocio ──────────────────────────────────────────
    
    @property
    def total(self) -> float:
        """Calcula el total del pedido"""
        return sum(item.subtotal for item in self.items)
    
    def generate_pickup_code(self) -> str:
        """Genera un código de 4 dígitos para recoger el pedido"""
        import random
        self.pickup_code = str(random.randint(1000, 9999))
        return self.pickup_code
    
    def can_be_cancelled(self) -> bool:
        """Solo se puede cancelar si no ha empezado a prepararse"""
        return self.status in [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID]
    
    def mark_as_paid(self, payment_ref: str):
        """Transición de estado: pagado"""
        if self.status != OrderStatus.PENDING_PAYMENT:
            raise ValueError("Solo se puede pagar un pedido pendiente de pago")
        self.status = OrderStatus.PAID
        self.payment_reference = payment_ref
        self.generate_pickup_code()
    
    def mark_as_preparing(self):
        if self.status != OrderStatus.PAID:
            raise ValueError("El pedido debe estar pagado para empezar a prepararse")
        self.status = OrderStatus.PREPARING
    
    def mark_as_ready(self):
        self.status = OrderStatus.READY
    
    def mark_as_collected(self):
        self.status = OrderStatus.COLLECTED

    @staticmethod
    def validate_advance_time(pickup_time: datetime, min_minutes_ahead: int = 15):
        """Regla: el pedido debe hacerse con X minutos de antelación"""
        now = datetime.now()
        if pickup_time - now < timedelta(minutes=min_minutes_ahead):
            raise ValueError(
                f"Debes pedir con al menos {min_minutes_ahead} minutos de antelación"
            )