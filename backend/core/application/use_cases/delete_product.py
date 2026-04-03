from core.domain.exceptions.domain_exceptions import ProductNotFoundException
from core.domain.ports.product_repository import ProductRepository


class DeleteProductUseCase:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo
    def execute(self, product_id: str):
        product = self.product_repo.find_by_id(product_id)
        if not product:
            raise ProductNotFoundException(product_id)
        return self.product_repo.delete(product_id)
    