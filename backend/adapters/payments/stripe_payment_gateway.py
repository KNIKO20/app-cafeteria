#import stripe
# from django.conf import settings
# from core.domain.ports.payment_provider import PaymentIntentOutput, PaymentGateway

# class StripePaymentGateway(PaymentGateway):
#     def __init__(self):
#         stripe.api_key = settings.STRIPE_SECRET_KEY
#     def create_intent(self, amount: float, description: str) -> PaymentIntentOutput:
#             # Stripe usa céntimos (1.50€ -> 150)
#             amount_cents = int(amount * 100)
            
#             intent = stripe.PaymentIntent.create(
#                 amount=amount_cents,
#                 currency="eur",
#                 description=description,
#                 payment_method_types=["card"],
#             )
            
#             return PaymentIntentOutput(
#                 client_secret=intent.client_secret,
#                 payment_intent_id=intent.id
#             )

#     def refund(self, payment_intent_id: str) -> bool:
#         try:
#             stripe.Refund.create(payment_intent=payment_intent_id)
#             return True
#         except:
#             return False