from dataclasses import dataclass
from core.domain.ports.order_repository import OrderRepository
from core.domain.ports.payment_gateway import PaymentGateway

@dataclass
class ProcessPaymentInput:
    order_id: str
    payment_token: str    # Token del frontend (ej: Stripe token)

class ProcessPaymentUseCase:
    
    def __init__(
        self,
        order_repo: OrderRepository,
        payment_gateway: PaymentGateway
    ):
        self.order_repo = order_repo
        self.payment_gateway = payment_gateway
    
    def execute(self, input_data: ProcessPaymentInput) -> dict:
        # 1. Obtener el pedido
        order = self.order_repo.find_by_id(input_data.order_id)
        if not order:
            raise ValueError("Pedido no encontrado")
        print(order)
        # 2. Procesar el pago
        result = self.payment_gateway.process_payment(
            amount=order.total,
            token=input_data.payment_token,
            description=f"Cafetería IES - Pedido {order.id[:8]}"
        )
        
        if not result.success:
            raise ValueError(f"Pago fallido: {result.error_message}")
        
        # 3. Actualizar el estado del pedido
        order.mark_as_paid(result.transaction_id)
        self.order_repo.save(order)
        
        return {
            "success": True,
            "pickup_code": order.pickup_code,
            "transaction_id": result.transaction_id
        }