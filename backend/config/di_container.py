# El Contenedor de Inyección de Dependencias.
# Aquí "cableamos" qué implementación concreta usamos para cada puerto.
# Es el único lugar donde el dominio se conecta con la infraestructura.
#
# Para tests, creas FakeOrderRepository() en lugar de MongoOrderRepository().
# Solo cambias este archivo y todo lo demás funciona igual.

from adapters.persistence.repositories.mongo_order_repository import MongoOrderRepository
from adapters.persistence.repositories.mongo_product_repository import MongoProductRepository
from adapters.payments.stripe_payment_gateway import StripePaymentGateway
from adapters.payments.mock_payment_provider import MockPaymentProvider

from core.application.use_cases.create_order import CreateOrderUseCase
from core.application.use_cases.get_menu import GetMenuUseCase
from core.application.use_cases.process_payment import ProcessPaymentUseCase
from core.application.use_cases.get_pending_orders import GetPendingOrdersUseCase
from core.application.use_cases.update_inventory import UpdateInventoryUseCase
from core.application.use_cases.create_product import CreateProductUseCase
from core.application.use_cases.update_product import UpdateProductUseCase
from core.application.use_cases.delete_product import DeleteProductUseCase
from core.application.use_cases.get_inventory import GetInventory


# Repositorios (instancias únicas)
_order_repo = MongoOrderRepository()
_product_repo = MongoProductRepository()
_payment_gateway = StripePaymentGateway()
_mock_payment_gateway = MockPaymentProvider()

# Casos de uso (factories)
def get_order_repo() -> MongoOrderRepository:
    return _order_repo

def get_create_order_use_case() -> CreateOrderUseCase:
    return CreateOrderUseCase(_order_repo, _product_repo)

def get_menu_use_case() -> GetMenuUseCase:
    return GetMenuUseCase(_product_repo)

def get_process_payment_use_case() -> ProcessPaymentUseCase:
    return ProcessPaymentUseCase(_order_repo, _mock_payment_gateway)

def get_pending_orders_use_case() -> GetPendingOrdersUseCase:
    return GetPendingOrdersUseCase(_order_repo)

def get_update_inventory_use_case() -> UpdateInventoryUseCase:
    return UpdateInventoryUseCase(_product_repo)

def get_create_product_use_case() -> CreateProductUseCase:
    return CreateProductUseCase(_product_repo)

def get_update_product_use_case() -> UpdateProductUseCase:
    return UpdateProductUseCase(_product_repo)

def get_delete_product_use_case() -> DeleteProductUseCase:
    return DeleteProductUseCase(_product_repo)

def get_inventory_use_case() -> GetInventory:
    return GetInventory(_product_repo)