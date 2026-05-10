from abc import ABC, abstractmethod

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

@dataclass
class PaymentIntentOutput:
    client_secret: str      # Lo necesita el móvil para abrir la pasarela
    payment_intent_id: str  # Lo guardamos nosotros para rastrear el pago

class PaymentGateway(ABC):
    @abstractmethod
    def create_intent(self, amount: float, description: str) -> PaymentIntentOutput:
        """Crea una intención de pago en Stripe"""
        pass

    @abstractmethod
    def refund(self, payment_intent_id: str) -> bool:
        """Devuelve el dinero"""
        pass