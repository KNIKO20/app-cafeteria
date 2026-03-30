# El Contenedor de Inyección de Dependencias.
# Aquí "cableamos" qué implementación concreta usamos para cada puerto.
# Es el único lugar donde el dominio se conecta con la infraestructura.
#
# Para tests, creas FakeOrderRepository() en lugar de MongoOrderRepository().
# Solo cambias este archivo y todo lo demás funciona igual.

from adapters.persistence.repositories.mongo_order_repository import MongoOrderRepository
from adapters.persistence.repositories.mongo_product_repository import MongoProductRepository
from adapters.payments.stripe_payment_gateway import StripePaymentGateway

from core.application.use_cases.create_order import CreateOrderUseCase
from core.application.use_cases.get_menu import GetMenuUseCase
from core.application.use_cases.process_payment import ProcessPaymentUseCase
from core.application.use_cases.get_pending_orders import GetPendingOrdersUseCase

# Repositorios (instancias únicas)
_order_repo = MongoOrderRepository()
_product_repo = MongoProductRepository()
_payment_gateway = StripePaymentGateway()

def get_order_repo() -> MongoOrderRepository:
    return _order_repo

def get_product_repo() -> MongoProductRepository:
    return _product_repo

# Casos de uso (factories)
def get_create_order_use_case() -> CreateOrderUseCase:
    return CreateOrderUseCase(_order_repo, _product_repo)

def get_menu_use_case() -> GetMenuUseCase:
    return GetMenuUseCase(_product_repo)

def get_process_payment_use_case() -> ProcessPaymentUseCase:
    return ProcessPaymentUseCase(_order_repo, _payment_gateway)

def get_pending_orders_use_case() -> GetPendingOrdersUseCase:
    return GetPendingOrdersUseCase(_order_repo)