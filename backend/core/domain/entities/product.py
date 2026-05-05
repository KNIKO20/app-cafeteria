# La entidad Product representa un producto de la cafetería.
# Esto permite que la lógica de negocio sea independiente de la tecnología.

from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

from core.domain.exceptions.domain_exceptions import InsufficientStockException

class ProductCategory(Enum):
    BOCADILLO_CALIENTE = "bocadillo_caliente"
    BOCADILLO_FRIO = "bocadillo_frio"
    BOCADILLO_ESPECIAL = "bocadillo_especial"
    SANDWICH = "sandwich"
    BEBIDA = "bebida"
    CAFETERIA = "cafeteria"
    BOLLERIA = "bolleria"
    SNACK = "snack"
    MENU = "menu"
    SUPLEMENTO = "suplemento"

@dataclass # sirve para que implicitamente cree el __init__ y el __repr__(toString)
class Product:
    id: str
    name: str
    price: float                        # En euros
    category: ProductCategory
    description: str = ""
    image_url: str = ""
    is_available: bool = True
    stock: Optional[int] = None         # None = sin límite de stock
    #puede ser null/None o int
    preparation_minutes: int = 5        # Tiempo estimado de preparación
    is_deleted: bool = False
    allergens: List[str] = field(default_factory=list)
    # debe devolver un bool
    def is_in_stock(self) -> bool:
        """Un producto está en stock si no está borrado, está activo y hay unidades"""
        if self.is_deleted: # Si está borrado, nunca está en stock
            return False
        if not self.is_available:
            return False
        if self.stock is not None and self.stock <= 0:
            return False
        return True
    # cantidad por defecto 1
    def reduce_stock(self, quantity: int = 1):
        """Reduce el stock al hacer un pedido"""
        if self.stock is not None:
            if self.stock < quantity:
                raise InsufficientStockException(product_name=self.name,current_stock=self.stock)
            self.stock -= quantity