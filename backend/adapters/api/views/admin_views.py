# Vista para el panel del administrador (personal cafetería)
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from adapters.auth.permissions import IsAdminRole
from core.application.use_cases.toggle_cafeteria_status import ToggleCafeteriaStatusInput
from core.application.use_cases.update_order_status import UpdateOrderStatusInput
from core.application.use_cases.update_slot import UpdateSlotInput
from core.domain.exceptions.domain_exceptions import ProductNotFoundException
from config.di_container import get_create_product_use_case, get_delete_product_use_case, get_get_slots_use_case, get_pending_orders_use_case, get_toggle_cafeteria_status_use_case, get_update_order_status_use_case, get_update_product_use_case, get_update_slot_use_case
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
            print(e)
            return Response({"error": "Error interno"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

    def post(self, request):
        use_case = get_create_product_use_case()
        # Mapeo manual o usando los campos del request para asegurar que la Dataclass sea válida
        data = request.data
        is_many = isinstance(data, list)
        try:
            from core.application.use_cases.create_product import CreateProductInput
            if is_many:
                # Procesamos múltiples productos
                created_ids = []
                for item in data:
                    input_dto = CreateProductInput(**item)
                    product_output = use_case.execute(input_dto)
                    created_ids.append(product_output.id)
                
                return Response({
                    "message": f"{len(created_ids)} productos creados", 
                    "ids": created_ids
                }, status=201)
            else:
                # Procesamos un solo producto (comportamiento original)
                input_dto = CreateProductInput(**data)
                product_output = use_case.execute(input_dto)
                return Response({
                    "message": "Producto creado", 
                    "id": product_output.id
                }, status=201)
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
    permission_classes = [IsAdminRole]
 
    def patch(self, request, order_id):
        new_status = request.data.get("status", "").strip()
        if not new_status:
            return Response(
                {"error": "El campo 'status' es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            use_case = get_update_order_status_use_case()
            result = use_case.execute(UpdateOrderStatusInput(
                order_id=order_id,
                new_status=new_status,
                changed_by=getattr(request.user, "email", ""),
            ))
            return Response({
                "status":            result.status,
                "notification_sent": result.notification_sent,
            })
 
        except LookupError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
 
        except ValueError as e:
            # Transición inválida o estado no reconocido
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
 
        except Exception as e:
            return Response(
                {"error": f"Error interno: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
 


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
class ToggleCafeteriaStatusView(APIView):
    """
    POST /api/admin/cafeteria/status/
    Body: { "is_open": true | false }
 
    Abre o cierra la cafetería para nuevos pedidos.
    """
    permission_classes = [IsAdminRole]
 
    def post(self, request):
        is_open = request.data.get("is_open")
        if is_open is None:
            return Response(
                {"error": "El campo 'is_open' (boolean) es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        try:
            use_case = get_toggle_cafeteria_status_use_case()
            result = use_case.execute(ToggleCafeteriaStatusInput(
                is_open=bool(is_open),
                changed_by=getattr(request.user, "email", ""),
            ))
            return Response({
                "is_open":         result.is_open,
                "last_changed_by": result.last_changed_by,
                "message":         result.message,
            })
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
 
    def get(self, request):
        """GET también disponible: devuelve el estado actual sin modificarlo."""
        use_case = get_toggle_cafeteria_status_use_case()
        # Obtenemos el estado actual sin ejecutar toggle
        from config.di_container import get_cafeteria_settings_repo
        settings = get_cafeteria_settings_repo().get()
        return Response({"is_open": settings.is_open})
 
 
#Listar franjas horarias 
 
class SlotListView(APIView):
    """
    GET /api/admin/slots/          → todas las franjas (para el panel admin)
    GET /api/admin/slots/?active=1 → solo las activas (para el alumno al pedir)
    """
    permission_classes = [AllowAny]
 
    def get(self, request):
        active_only = request.query_params.get("active") == "1"
        use_case = get_get_slots_use_case()
        slots = use_case.execute(active_only=active_only)
 
        return Response([{
            "id":             s.id,
            "start_time":     s.start_time.strftime("%H:%M"),
            "end_time":       s.end_time.strftime("%H:%M"),
            "max_orders":     s.max_orders,
            "current_orders": s.current_orders,
            "is_active":      s.is_active,
            "label":          s.label,
            "has_capacity":   s.has_capacity(),
        } for s in slots])
 
 
#Editar franja horaria 
 
class SlotUpdateView(APIView):
    """
    PATCH /api/admin/slots/<slot_id>/
    Body (todos los campos son opcionales):
      {
        "max_orders": 25,
        "is_active": false,
        "start_time": "10:00",
        "end_time": "10:30"
      }
    """
    permission_classes = [IsAdminRole]
 
    def patch(self, request, slot_id):
        try:
            use_case = get_update_slot_use_case()
            result = use_case.execute(UpdateSlotInput(
                slot_id=slot_id,
                max_orders=request.data.get("max_orders"),
                is_active=request.data.get("is_active"),
                start_time=request.data.get("start_time"),
                end_time=request.data.get("end_time"),
            ))
            s = result.slot
            return Response({
                "id":             s.id,
                "start_time":     s.start_time.strftime("%H:%M"),
                "end_time":       s.end_time.strftime("%H:%M"),
                "max_orders":     s.max_orders,
                "current_orders": s.current_orders,
                "is_active":      s.is_active,
                "label":          s.label,
            })
 
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
 
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
 
 
#  Confirmación en lote (batch ready) 
 
class ConfirmOrdersBatchView(APIView):
    """
    POST /api/admin/orders/batch-ready/
    Body: { "order_ids": ["id1", "id2", ...] }
 
    Marca todos los pedidos en 'preparing' como 'ready' de una sola vez.
    Útil para el botón "Confirmar lote" del dashboard.
    """
    permission_classes = [IsAdminRole]
 
    def post(self, request):
        order_ids = request.data.get("order_ids", [])
        if not order_ids or not isinstance(order_ids, list):
            return Response(
                {"error": "Se requiere una lista 'order_ids'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
 
        use_case = get_update_order_status_use_case()
        results = {"success": [], "errors": []}
 
        for oid in order_ids:
            try:
                use_case.execute(UpdateOrderStatusInput(
                    order_id=oid,
                    new_status="ready",
                    changed_by=getattr(request.user, "email", ""),
                ))
                results["success"].append(oid)
            except (LookupError, ValueError) as e:
                results["errors"].append({"order_id": oid, "error": str(e)})
 
        http_status = (
            status.HTTP_200_OK
            if not results["errors"]
            else status.HTTP_207_MULTI_STATUS
        )
        return Response(results, status=http_status)