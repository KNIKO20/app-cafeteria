# Implementación in-memory del ProductRepository para tests.
# Sustituye a MongoProductRepository sin tocar la base de datos.

from typing import List, Optional
from core.domain.entities.product import Product, ProductCategory
from core.domain.ports.product_repository import ProductRepository


class FakeProductRepository(ProductRepository):
    """Repositorio de productos en memoria para tests."""

    def __init__(self):
        self._products: dict[str, Product] = {}

    # ── Helpers para poblar datos en los tests ──────────────
    def add(self, product: Product):
        """Añade un producto al repositorio fake."""
        self._products[product.id] = product

    # ── Implementación del puerto ───────────────────────────
    def find_all_available(self) -> List[Product]:
        return [p for p in self._products.values() if p.is_in_stock()]

    def find_by_id(self, product_id: str) -> Optional[Product]:
        return self._products.get(product_id)

    def find_by_category(self, category: ProductCategory) -> List[Product]:
        return [
            p for p in self._products.values()
            if p.category == category and p.is_in_stock()
        ]

    def save(self, product: Product) -> Product:
        self._products[product.id] = product
        return product

    def update_stock(self, product_id: str, quantity_change: int):
        product = self._products.get(product_id)
        if product and product.stock is not None:
            product.stock += quantity_change

    def delete(self, product_id: str):
        if product_id in self._products:
            del self._products[product_id]

    def find_all(self) -> List[Product]:
        return list(self._products.values())

