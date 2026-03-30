# La implementación CONCRETA del puerto OrderRepository.
# Implementa el contrato usando MongoDB + Mongoengine.
# 
# El dominio solo conoce el puerto (la interfaz abstracta).
# Si quieres cambiar a PostgreSQL, creas MongoOrderRepository
# y lo registras en el contenedor de dependencias. 

from typing import List, Optional
from core.domain.entities.order import Order, OrderItem, OrderStatus
from core.domain.ports.order_repository import OrderRepository
from adapters.persistence.models.order_model import OrderDocument, OrderItemDocument

class MongoOrderRepository(OrderRepository):
    
    def save(self, order: Order) -> Order:
        # Buscar si ya existe (upsert)
        doc = OrderDocument.objects(order_id=order.id).first()
        if not doc:
            doc = OrderDocument(order_id=order.id)
        
        # Mapear entidad (DTO) → documento MongoDB
        # Realiza un 'Mapping' manual campo por campo.
        doc.user_id = order.user_id
        doc.items = [
            OrderItemDocument(
                product_id=item.product_id,
                product_name=item.product_name,
                unit_price=item.unit_price,
                quantity=item.quantity
            )
            for item in order.items
        ]
        doc.pickup_timeslot = order.pickup_timeslot
        doc.pickup_date = order.pickup_date
        doc.status = order.status.value
        doc.pickup_code = order.pickup_code
        doc.payment_reference = order.payment_reference

        # guardado físico en el Cluster de MongoDB
        doc.save()
        
        return order  # Devolvemos la entidad de dominio, no el documento
    
    def find_by_id(self, order_id: str) -> Optional[Order]:
        doc = OrderDocument.objects(order_id=order_id).first()
        return self._to_entity(doc) if doc else None
    
    def find_by_user(self, user_id: str) -> List[Order]:
        docs = OrderDocument.objects(user_id=user_id).order_by('-created_at')
        return [self._to_entity(doc) for doc in docs]
    
    def find_pending_orders(self) -> List[Order]:
        """Pedidos pagados que el personal necesita preparar"""
        docs = OrderDocument.objects(
            status__in=['paid', 'preparing']
        ).order_by('pickup_date')
        return [self._to_entity(doc) for doc in docs]
    
    def find_by_pickup_code(self, code: str) -> Optional[Order]:
        doc = OrderDocument.objects(pickup_code=code).first()
        return self._to_entity(doc) if doc else None
    

    # --- MÉTODO PRIVADO DE UTILIDAD ---
    def _to_entity(self, doc: OrderDocument) -> Order:
        """Mapea documento MongoDB → entidad de dominio"""
        return Order(
            id=doc.order_id,
            user_id=doc.user_id,
            items=[
                OrderItem(
                    product_id=item.product_id,
                    product_name=item.product_name,
                    unit_price=item.unit_price,
                    quantity=item.quantity
                )
                for item in doc.items
            ],
            pickup_timeslot=doc.pickup_timeslot,
            pickup_date=doc.pickup_date,
            status=OrderStatus(doc.status),
            pickup_code=doc.pickup_code,
            payment_reference=doc.payment_reference,
            created_at=doc.created_at
        )