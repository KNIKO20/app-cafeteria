from typing import Optional

from core.domain.exceptions.domain_exceptions import ProductNotFoundException
from core.domain.entities.product import Product
from core.domain.ports.product_repository import ProductRepository

class ReduceStockOnPaymentUseCase():
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    def execute(self, product_id: str, quantity: Optional[int] = None):
        product = self.product_repo.find_by_id(product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        try:
            product.reduce_stock(quantity)
            self.product_repo.save(product)
            return True
        except ValueError:
            return False