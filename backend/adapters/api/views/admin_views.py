# Vista para el panel del administrador (personal cafetería)
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from adapters.auth.permissions import IsAdminRole
from core.domain.exceptions.domain_exceptions import ProductNotFoundException
from config.di_container import get_create_product_use_case, get_delete_product_use_case, get_pending_orders_use_case, get_update_product_use_case
from config.di_container import get_update_inventory_use_case
from config.di_container import get_inventory_use_case

class ProductManagementView(APIView):
    """Acciones generales: Listar todos (para el admin) y Crear nuevo"""
    Permission_classes = [IsAdminRole]
    def get(self, request):
        try:
            use_case = get_inventory_use_case()
            products = use_case.execute()
            return Response([{
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "description": p.description,
                "image_url": p.image_url,
                "category": p.category.value if hasattr(p.category, 'value') else p.category,
                "preparation_minutes": p.preparation_minutes,
                "is_available": p.is_available,
                "stock": p.stock
            } for p in products], status=200)
        except Exception as e:
            return Response({"error": "Error interno"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    def post(self, request):
        use_case = get_create_product_use_case()
        # Mapeo manual o usando los campos del request para asegurar que la Dataclass sea válida
        try:
            from core.application.use_cases.create_product import CreateProductInput
            input_dto = CreateProductInput(**request.data) 
            product_output = use_case.execute(input_dto)
            return Response({"message": "Producto creado", "id": product_output.id}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ProductDetailAdminView(APIView):
    """Acciones específicas: Modificar datos base o Eliminar"""
    Permission_classes = [IsAdminRole]

    def put(self, request, product_id):
        use_case = get_update_product_use_case()
    
        # Importar la dataclass de entrada
        from core.application.use_cases.update_product import UpdateProductInput
        
        # Crear la instancia de la dataclass pasando el id y el resto de los datos
        # Usamos **request.data para que Django asigne los campos automáticamente
        input_dto = UpdateProductInput(id=product_id, **request.data)
        
        # Pasar el objeto input_dto, NO el product_id por separado
        output = use_case.execute(input_dto)
        
        if not output:
            return Response({"error": "Error al actualizar"}, status=400)
            
        return Response({"message": "Producto actualizado", "data": output.__dict__})

    def delete(self, request, product_id):
        use_case = get_delete_product_use_case()
        try:
            use_case.execute(product_id)
            return Response(status=204)

        except ProductNotFoundException as e:
            return Response({"error": e.message}, status=404)
        
        except Exception as e:
            return Response({"error": "Error inesperado al eliminar"}, status=500)

class UpdateInventoryView(APIView):
    Permission_classes = [IsAdminRole]
    def patch(self, request, product_id):
        use_case = get_update_inventory_use_case()
        
        quantity = request.data.get("quantity")

        success = use_case.execute(product_id, quantity)
        if not success:
            return Response({"error":"Producto no encontrado"},status=404)
        return Response({
            "message":"Stock actualizado correctamente",
            "product_id":product_id,
            "new_stock":quantity

        },status=200)


class PendingOrdersView(APIView):
    """Panel del administrador: ver pedidos pendientes"""
    Permission_classes = [IsAdminRole]
    
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
    Permission_classes = [IsAdminRole]
    
    def patch(self, request, order_id):
        """
            TODO falta crear su caso de uso y implementar las notificacion allí
        """
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
    Permission_classes = [IsAdminRole]
    
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