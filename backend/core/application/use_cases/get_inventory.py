from core.domain.ports.product_repository import ProductRepository


class GetInventory:
    def __init__(self, repo_product: ProductRepository):
        self.repo_product = repo_product

    def execute(self):
        return self.repo_product.find_all()
    