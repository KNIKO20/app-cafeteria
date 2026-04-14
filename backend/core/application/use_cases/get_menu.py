from typing import List, Optional
from core.domain.entities.product import Product, ProductCategory
from core.domain.ports.product_repository import ProductRepository

class GetMenuUseCase:
    
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo
    
    def execute(self, category: Optional[str] = None) -> List[Product]:
        """
        Devuelve los productos disponibles.
        Si se pasa categoría válida, filtra por ella. Si no, devuelve todo.
        """
        if category and category.strip():
            try:
                # Intentamos convertir a Enum. Si falla, devolvemos todo el menú.
                cat_enum = ProductCategory(category.lower())
                return self.product_repo.find_by_category(cat_enum)
            except ValueError:
                # Si la categoría no existe, mejor devolvemos todo en lugar de error.
                return self.product_repo.find_all_available()
        
        return self.product_repo.find_all_available()