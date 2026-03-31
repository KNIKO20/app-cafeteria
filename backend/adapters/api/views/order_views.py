# Las vistas Django REST son el adaptador primario.
# Convierten requests HTTP → llaman casos de uso → devuelven JSON.
# Las vistas NO contienen lógica de negocio. Solo traducen.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.application.use_cases.create_order import CreateOrderInput
from config.di_container import get_create_order_use_case, get_process_payment_use_case

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            use_case = get_create_order_use_case()
            
            # Construir el input desde el request HTTP
            input_data = CreateOrderInput(
                user_id=str(request.user.id),
                items=request.data.get("items", []),
                pickup_timeslot_id=request.data.get("pickup_timeslot_id"),
                pickup_date=request.data.get("pickup_date"),
            )
            
            # Ejecutar el caso de uso
            result = use_case.execute(input_data)
            
            # Devolver respuesta HTTP
            return Response({
                "order_id": result.order_id,
                "pickup_code": result.pickup_code,
                "total": result.total,
                "status": result.status
            }, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({"error": "Error interno"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProcessPaymentView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            from core.application.use_cases.process_payment import ProcessPaymentInput
            use_case = get_process_payment_use_case()
            
            result = use_case.execute(ProcessPaymentInput(
                order_id=order_id,
                payment_token=request.data.get("payment_token")
            ))
            
            return Response(result, status=status.HTTP_200_OK)
        
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserOrdersView(APIView):
    """Historial de pedidos del alumno"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from config.di_container import get_order_repo
        repo = get_order_repo()
        orders = repo.find_by_user(str(request.user.id))
        
        return Response([{
            "id": o.id,
            "total": o.total,
            "status": o.status.value,
            "pickup_code": o.pickup_code,
            "pickup_timeslot": o.pickup_timeslot,
            "created_at": o.created_at.isoformat(),
            "items": [{"name": i.product_name, "qty": i.quantity, "price": i.unit_price}
                      for i in o.items]
        } for o in orders], status=200)