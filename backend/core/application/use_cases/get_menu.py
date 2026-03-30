from typing import List, Optional
from core.domain.entities.product import Product, ProductCategory
from core.domain.ports.product_repository import ProductRepository

class GetMenuUseCase:
    
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo
    
    def execute(self, category: Optional[str] = None) -> List[Product]:
        """
        Devuelve los productos disponibles.
        Si se pasa categoría, filtra por ella.
        """
        if category:
            try:
                cat_enum = ProductCategory(category)
                return self.product_repo.find_by_category(cat_enum)
            except ValueError:
                raise ValueError(f"Categoría '{category}' no válida")
        
        return self.product_repo.find_all_available()