import uuid
from core.domain.ports.payment_gateway import PaymentGateway, PaymentResult

class MockPaymentProvider(PaymentGateway):
    def process_payment(self, amount: float, token: str, description: str) -> PaymentResult:
        """
        Simula una pasarela de pago.
        - Si el token es 'fail_token', el pago fallará.
        - Cualquier otro token resultará en un pago exitoso.
        """
        print(f"[MOCK PAYMENT] Procesando {amount}€ con token '{token}'")
        print(f"[MOCK PAYMENT] Descripción: {description}")

        if token == "fail_token":
            return PaymentResult(
                success=False, 
                error_message="La tarjeta no tiene fondos suficientes (Simulado)"
            )

        # Simular una transacción exitosa
        transaction_id = f"mock_tx_{uuid.uuid4().hex[:10]}"
        
        return PaymentResult(
            success=True,
            transaction_id=transaction_id,
            amount=amount
        )
    def refund(self, transaction_id: str) -> bool:
        return True