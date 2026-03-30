# Vista para el panel del administrador (personal cafetería)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from config.di_container import get_pending_orders_use_case

class PendingOrdersView(APIView):
    """Panel del administrador: ver pedidos pendientes"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        use_case = get_pending_orders_use_case()
        orders = use_case.execute()
        
        return Response([{
            "id": o.id,
            "pickup_code": o.pickup_code,
            "pickup_timeslot": o.pickup_timeslot,
            "status": o.status.value,
            "total": o.total,
            "items": [{"name": i.product_name, "qty": i.quantity} for i in o.items]
        } for o in orders])

class UpdateOrderStatusView(APIView):
    """El admin cambia el estado del pedido"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def patch(self, request, order_id):
        from config.di_container import get_order_repo
        repo = get_order_repo()
        order = repo.find_by_id(order_id)
        
        if not order:
            return Response({"error": "Pedido no encontrado"}, status=404)
        
        new_status = request.data.get("status")
        if new_status == "preparing":
            order.mark_as_preparing()
        elif new_status == "ready":
            order.mark_as_ready()
        elif new_status == "collected":
            order.mark_as_collected()
        else:
            return Response({"error": "Estado no válido"}, status=400)
        
        repo.save(order)
        return Response({"status": order.status.value})

class VerifyPickupCodeView(APIView):
    """Verifica el código QR/numérico al entregar el pedido"""
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        code = request.data.get("code")
        from config.di_container import get_order_repo
        repo = get_order_repo()
        order = repo.find_by_pickup_code(code)
        
        if not order:
            return Response({"valid": False, "error": "Código no encontrado"})
        
        return Response({
            "valid": True,
            "order_id": order.id,
            "status": order.status.value,
            "is_paid": order.payment_reference is not None,
            "items": [{"name": i.product_name, "qty": i.quantity} for i in order.items],
            "total": order.total
        })