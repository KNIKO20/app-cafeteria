from typing import Optional

from core.domain.ports.product_repository import ProductRepository
from core.domain.exceptions.domain_exceptions import ProductNotFoundException

class UpdateInventoryUseCase:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    def execute(self, product_id: str, quantity: Optional[int] = None):
        product = self.product_repo.find_by_id(product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        product.stock = 0 if quantity <= 0 else quantity
        product.is_available= False if quantity == 0 else True
        self.product_repo.save(product)
        return True
        