# adapters/api/views/product_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from config.di_container import get_product_repo

class ProductListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Por ahora devolvemos un mensaje de prueba para ver que funciona
        return Response({"message": "Catálogo de productos disponible"})