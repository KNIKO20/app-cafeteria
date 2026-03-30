from django.urls import path
from adapters.api.views.order_views import CreateOrderView, ProcessPaymentView, UserOrdersView
from adapters.api.views.product_views import ProductListView
from adapters.api.views.admin_views import PendingOrdersView, UpdateOrderStatusView, VerifyPickupCodeView


urlpatterns = [
    
    # Cliente (alumno)
    path('products/', ProductListView.as_view(), name='product-list'),
    path('orders/', CreateOrderView.as_view(), name='create-order'),
    path('orders/my/', UserOrdersView.as_view(), name='user-orders'),
    path('orders/<str:order_id>/pay/', ProcessPaymentView.as_view(), name='pay-order'),
    
    # Admin (cafetería)
    path('admin/orders/', PendingOrdersView.as_view(), name='pending-orders'),
    path('admin/orders/<str:order_id>/status/', UpdateOrderStatusView.as_view(), name='update-status'),
    path('admin/verify-code/', VerifyPickupCodeView.as_view(), name='verify-code'),
]