# Un "puerto" es una interfaz abstracta (contrato).
# Define qué operaciones existen, pero NO cómo se implementan.
# 
# El dominio solo conoce este contrato.
# MongoDB, PostgreSQL, o cualquier otra BD puede implementarlo.


from abc import ABC, abstractmethod
from typing import List, Optional
from core.domain.entities.order import Order, OrderStatus

# al poner ABC no se puede usar directamente, solo sirve para heredar
class OrderRepository(ABC):
    
    # al heredar obliga a escribir su version de esta funcion
    @abstractmethod
    def save(self, order: Order) -> Order:
        """Guarda o actualiza un pedido"""
        pass
    
    @abstractmethod
    def find_by_id(self, order_id: str) -> Optional[Order]:
        """Busca un pedido por su ID"""
        pass
    
    @abstractmethod
    def find_by_user(self, user_id: str) -> List[Order]:
        """Historial de pedidos de un usuario"""
        pass
    
    @abstractmethod
    def find_pending_orders(self) -> List[Order]:
        """Pedidos pendientes para el panel del administrador"""
        pass
    
    @abstractmethod
    def find_by_pickup_code(self, code: str) -> Optional[Order]:
        """Busca por código de recogida (para el admin)"""
        pass