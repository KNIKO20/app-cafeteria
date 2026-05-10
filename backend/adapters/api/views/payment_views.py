from rest_framework.views import APIView
from rest_framework.response import Response
import stripe
from rest_framework.permissions import IsAuthenticated, AllowAny
from config import settings
from core.domain.entities.order import OrderStatus

class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception:
            return Response(status=400)

        # Si el pago fue exitoso
        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object']
            payment_id = intent['id']
            
            # Buscar el pedido por payment_intent_id y marcar como PAGADO
            # Aquí llamas a otro Caso de Uso o al Repo directamente
            from config.di_container import get_order_repo
            repo = get_order_repo()
            order = repo.find_by_payment_id(payment_id)
            if order:
                order.status = OrderStatus.PAID
                repo.save(order)

        return Response(status=200)