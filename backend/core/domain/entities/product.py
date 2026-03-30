# La entidad Product representa un producto de la cafetería.
# Esto permite que la lógica de negocio sea independiente de la tecnología.

from dataclasses import dataclass
from typing import Optional
from enum import Enum

class ProductCategory(Enum):
    BOCADILLO = "bocadillo"
    BEBIDA = "bebida"
    POSTRE = "postre"
    MENU = "menu"
    SALUDABLE = "saludable"

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
    
    # debe devolver un bool
    def is_in_stock(self) -> bool:
        """Regla de negocio: un producto está disponible si está activo y tiene stock"""
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
                raise ValueError(f"Stock insuficiente para {self.name}")
            self.stock -= quantity