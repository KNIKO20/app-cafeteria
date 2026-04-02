from django.urls import path
from adapters.api.views.order_views import CreateOrderView, ProcessPaymentView, UserOrdersView
from adapters.api.views.product_views import ProductListView
from adapters.api.views.admin_views import (
    ProductManagementView, 
    ProductDetailAdminView,
    UpdateInventoryView,
    PendingOrdersView,
    UpdateOrderStatusView,
    VerifyPickupCodeView
    )


urlpatterns = [
    
    # Cliente (alumno)
    path('products/', ProductListView.as_view(), name='product-list'),
    path('orders/', CreateOrderView.as_view(), name='create-order'),
    path('orders/my/', UserOrdersView.as_view(), name='user-orders'),
    path('orders/<str:order_id>/pay/', ProcessPaymentView.as_view(), name='pay-order'),
    
    # Admin (cafetería)
    # POST: Crear un nuevo producto / GET: Listar todos los productos
    path('admin/products/', ProductManagementView.as_view(), name='admin-product'),

    # PUT: Modificar datos base / DELETE: Borrado lógico
    path('admin/products/<str:product_id>/', ProductDetailAdminView.as_view(), name='admin-product-detail'),

    # PATCH: Solo para actualizar stock (Ilimitado o número fijo)
    path('admin/products/<str:product_id>/inventory/', UpdateInventoryView.as_view(), name='update-inventory'),

    # GET: Ver todos los pedidos pendientes de la cafetería
    path('admin/orders/pending/', PendingOrdersView.as_view(), name='admin-orders-pending'),
    
    # PATCH: Cambiar estado (preparing -> ready -> collected)
    path('admin/orders/<str:order_id>/status/', UpdateOrderStatusView.as_view(), name='admin-order-status'),
    
    # POST: Verificar el código que trae el alumno
    path('admin/orders/verify/', VerifyPickupCodeView.as_view(), name='admin-order-verify'),
]