from abc import ABC, abstractmethod
from dataclasses import dataclass

# PaymentResult funciona como DTO 
# sirve para entenderse con el frontend por JSON
@dataclass
class PaymentResult:
    success: bool
    transaction_id: str
    amount: float
    error_message: str = ""

class PaymentGateway(ABC):
    
    @abstractmethod
    def process_payment(self, amount: float, token: str, description: str) -> PaymentResult:
        """Procesa un pago. El token viene del frontend (Stripe, etc.)"""
        pass
    
    @abstractmethod
    def refund(self, transaction_id: str) -> bool:
        """Devuelve el dinero si se cancela el pedido"""
        pass