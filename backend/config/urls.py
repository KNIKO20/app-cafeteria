from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "app": "cafeteria-api"})

urlpatterns = [
    path('', health_check),                          # evita el "Not Found" en /
    path('admin/', admin.site.urls),                 # DESCOMENTADO 
    path('api/', include('adapters.api.urls')),
]
