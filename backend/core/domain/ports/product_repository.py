from abc import ABC, abstractmethod
from typing import List, Optional
from core.domain.entities.product import Product, ProductCategory

class ProductRepository(ABC):
    
    @abstractmethod
    def find_all_available(self) -> List[Product]:
        pass

    @abstractmethod
    def find_all(self) -> List[Product]:
        pass
    
    @abstractmethod
    def find_by_id(self, product_id: str) -> Optional[Product]:
        pass
    
    @abstractmethod
    def find_by_category(self, category: ProductCategory) -> List[Product]:
        pass
    
    @abstractmethod
    def save(self, product: Product) -> Product:
        pass

    @abstractmethod
    def delete(self, product_id: str) -> bool:
        pass
    
    @abstractmethod
    def update_stock(self, product_id: str, quantity_change: Optional[int] = None):
        pass