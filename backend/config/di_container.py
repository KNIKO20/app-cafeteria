# El Contenedor de Inyección de Dependencias.
# Aquí "cableamos" qué implementación concreta usamos para cada puerto.
# Es el único lugar donde el dominio se conecta con la infraestructura.
#
# Para tests, creas FakeOrderRepository() en lugar de MongoOrderRepository().
# Solo cambias este archivo y todo lo demás funciona igual.

from adapters.persistence.repositories.mongo_order_repository import MongoOrderRepository
from adapters.persistence.repositories.mongo_product_repository import MongoProductRepository
from adapters.persistence.repositories.mongo_user_repository import MongoUserRepository
from config.db import get_database
from tests.fakes.fake_order_repository import FakeOrderRepository
from tests.fakes.fake_product_repository import FakeProductRepository
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



# --- Importaciones de Auth ---
from decouple import config
from tests.fakes.fake_user_repository import FakeUserRepository
from adapters.auth.google_auth_provider import GoogleAuthProvider
from core.application.use_cases.login_with_google import LoginWithGoogleUseCase
from core.application.use_cases.get_current_user import GetCurrentUserUseCase

from core.domain.entities.product import Product, ProductCategory

# Repositorios (instancias únicas) e inicialización segura
_order_repo = None
_product_repo = None
_user_repo = None
_auth_provider = None
_is_demo_mode = False

def _initialize_repositories():
    global _order_repo, _product_repo, _user_repo, _is_demo_mode
    if _order_repo is not None:
        return

    try:
        # Intentamos usar MongoDB (con timeout corto para no bloquear el inicio)
        from config.db import get_database
        
        # Verificar conexión
        db = get_database()
        db.command('ping') # Si esto falla, MongoDB no está activo
        
        print("[OK] Conectado a MongoDB. Usando repositorios persistentes.")
        _order_repo = MongoOrderRepository()
        _product_repo = MongoProductRepository()
        _user_repo = MongoUserRepository(db_collection=db['users'])
        _is_demo_mode = False
        
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a MongoDB ({e}).")
        print("[INFO] Entrando en MODO DEMO (In-memory). Los cambios se perderán al reiniciar.")
        
        _order_repo = FakeOrderRepository()
        _product_repo = FakeProductRepository()
        _user_repo = FakeUserRepository()
        _is_demo_mode = True
        
        # Semilla de datos para el modo Fake (así la app no está vacía)
        from core.domain.entities.product import Product, ProductCategory
        _product_repo.save(Product(id="p1", name="Bocadillo Jamón", price=3.50, description="Clásico con pan crujiente y aceite.", category=ProductCategory.BOCADILLO, preparation_minutes=5, is_available=True, image_url="", stock=50))
        _product_repo.save(Product(id="p2", name="Café con Leche", price=1.20, description="Café arábica con leche cremosa.", category=ProductCategory.BEBIDA, preparation_minutes=2, is_available=True, image_url="", stock=100))
        _product_repo.save(Product(id="p3", name="Tarta de Queso", price=3.80, description="Casera con base de galleta.", category=ProductCategory.POSTRE, preparation_minutes=1, is_available=True, image_url="", stock=20))

_initialize_repositories()

_payment_gateway = StripePaymentGateway()
_mock_payment_gateway = MockPaymentProvider()

# Casos de uso (factories)
def get_order_repo() -> MongoOrderRepository:
    return _order_repo

def get_product_repo() -> MongoProductRepository:
    return _product_repo

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


def get_user_repo():
    return _user_repo

def get_auth_provider():
    global _auth_provider
    if _auth_provider is None:
        client_id = config("GOOGLE_CLIENT_ID", default="853004690083-9munvftfvk5q9s2l9belno1qvf8sv7f6.apps.googleusercontent.com")
        _auth_provider = GoogleAuthProvider(client_id)
    return _auth_provider

def get_login_with_google_use_case():
    return LoginWithGoogleUseCase(
        auth_provider=get_auth_provider(),
        user_repo=get_user_repo()
    )

def get_current_user_use_case():
    return GetCurrentUserUseCase(
        user_repo=get_user_repo()
    )