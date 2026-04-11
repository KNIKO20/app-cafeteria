# adapters/api/views/product_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from adapters.auth.permissions import IsAuthenticatedHex
from config.di_container import get_menu_use_case

class ProductListView(APIView):
    permission_classes = [IsAuthenticatedHex]

    def get(self, request):
        try:
            repo = get_menu_use_case()
            products = repo.execute(request.data.get("category"))
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
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            return Response({"error": "Error interno al cargar menú."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

       
