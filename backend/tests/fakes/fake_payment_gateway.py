# Implementación fake del PaymentGateway para tests.
# Permite configurar si el pago será exitoso o fallido.

from core.domain.ports.payment_gateway import PaymentGateway, PaymentResult


class FakePaymentGateway(PaymentGateway):
    """Gateway de pago fake para tests. Configurable: éxito o fallo."""

    def __init__(self, should_succeed: bool = True):
        self.should_succeed = should_succeed
        self.last_amount = None
        self.last_token = None

    def process_payment(self, amount: float, token: str, description: str) -> PaymentResult:
        self.last_amount = amount
        self.last_token = token

        if self.should_succeed:
            return PaymentResult(
                success=True,
                transaction_id="fake-txn-12345",
                amount=amount,
            )
        else:
            return PaymentResult(
                success=False,
                transaction_id="",
                amount=amount,
                error_message="Pago rechazado por el banco",
            )

    def refund(self, transaction_id: str) -> bool:
        return self.should_succeed
