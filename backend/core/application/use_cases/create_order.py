# Un caso de uso representa una acción del usuario.
# "CreateOrder" = "El alumno realiza un pedido"
#
# Recibe los puertos por INYECCIÓN DE DEPENDENCIAS (di). 
# No sabe si usa MongoDB, PostgreSQL, o una lista en memoria.
# Esto facilita los test.

# básicamente orquestan las entidades usando los puertos
from dataclasses import dataclass
from typing import List
from datetime import datetime

from core.domain.entities.order import Order, OrderItem
from core.domain.ports.order_repository import OrderRepository
from core.domain.ports.product_repository import ProductRepository

# Los dataclass son DTO's para recibir y enviar los datos
@dataclass
class CreateOrderInput:
    """Datos que llegan desde el frontend"""
    user_id: str
    items: List[dict]              # [{"product_id": "...", "quantity": 2}]
    pickup_timeslot_id: str
    pickup_date: str               # ISO format: "2025-04-14T10:30:00"

@dataclass
class CreateOrderOutput:
    """Datos que devolvemos al frontend"""
    order_id: str
    pickup_code: str
    total: float
    status: str

class CreateOrderUseCase:
    
    #para funcionar necesita un OrderRepository y un ProductRepository. 
    # el archivo config/di_container.py instancia el adaptador real (mongo, mysql, etc)
    # e instancia el caso de uso pasándole ese adaptador
    # por ejmplo adaptador real: mongo_repo = MongoOrderRepository()
    # instancion pasandole el adaptador: use_case = CreateOrderUseCase(order_repo=mongo_repo, ...)

    # entonces si cambiaramos de DB solo cambiariamos en di_container y 
    # y CreateOrderUseCase quedaría igual 

    def __init__(
        self,
        order_repo: OrderRepository,         # Puerto → inyectado
        product_repo: ProductRepository,     # Puerto → inyectado
    ):
        self.order_repo = order_repo
        self.product_repo = product_repo
    
    def execute(self, input_data: CreateOrderInput) -> CreateOrderOutput:
        # 1. Validar que los productos existen y están disponibles
        order_items = []
        for item_data in input_data.items:
            product = self.product_repo.find_by_id(item_data["product_id"])
            
            if product is None:
                raise ValueError(f"Producto {item_data['product_id']} no encontrado")
            
            if not product.is_in_stock():
                raise ValueError(f"El producto '{product.name}' no está disponible")
            
            order_items.append(OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=product.price,
                quantity=item_data["quantity"]
            ))
        
        # 2. Validar tiempo de antelación
        pickup_time = datetime.fromisoformat(input_data.pickup_date)
        # Usa el metodo de la entity Order para validar la lógica de negocio
        # el usecase coordina que las reglas que definimos en las entities se cumplan
        #Order.validate_advance_time(pickup_time, min_minutes_ahead=15)
        
        # 3. Crear el pedido
        order = Order(
            user_id=input_data.user_id,
            items=order_items,
            pickup_timeslot=input_data.pickup_timeslot_id,
            pickup_date=pickup_time,
        )
        
        
        # 4. Guardar en la base de datos
        saved_order = self.order_repo.save(order)
        
        # se envia CreateOrderOutput y no Order porque solo queremos enviar
        # datos que puede ver el cliente/frontend, y no info interna
        return CreateOrderOutput(
            order_id=saved_order.id,
            pickup_code=saved_order.pickup_code or "",
            total=saved_order.total,
            status=saved_order.status.value
        )