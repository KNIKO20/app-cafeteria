from dataclasses import dataclass
from typing import Optional
import uuid

from core.domain.ports.product_repository import ProductRepository
from core.domain.entities.product import Product, ProductCategory
from core.domain.exceptions.domain_exceptions import ProductNotFoundException

@dataclass
class UpdateProductInput:
    """Datos que llegan desde el frontend"""
    id: str
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_available: Optional[bool] = True
    description: Optional[str] = None
    image_url: Optional[str] = None
    preparation_minutes: Optional[int] = None
    stock: Optional[int] = None  

@dataclass
class UpdateProductOutput:
    """Datos que devolvemos al frontend"""
    id: str
    name: str
    price: float                        # En euros
    category: str
    is_available: bool = True
    stock: Optional[int] = None         # None = sin límite de stock
 
    
class UpdateProductUseCase:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    def execute(self, input_data: UpdateProductInput) -> UpdateProductOutput:
        # 1. Buscamos el producto actual
        product = self.product_repo.find_by_id(input_data.id)
        if not product:
            raise ProductNotFoundException(input_data.id)
        
        try:
            # 2. Actualización condicional: Solo si el campo no es None
            if input_data.name is not None:
                product.name = input_data.name
                
            if input_data.price is not None:
                product.price = input_data.price
                
            if input_data.category is not None:
                product.category = ProductCategory(input_data.category)
                
            if input_data.description is not None:
                product.description = input_data.description
                
            if input_data.image_url is not None:
                product.image_url = input_data.image_url
                
            if input_data.preparation_minutes is not None:
                product.preparation_minutes = input_data.preparation_minutes
                
            if input_data.stock is not None:
                product.stock = input_data.stock
            # 3. Guardamos los cambios (los campos no mencionados quedaron igual)
            self.product_repo.save(product)
            
            return UpdateProductOutput(
                id=product.id,
                name=product.name,
                price=product.price,
                category=product.category.value,
                is_available=product.is_available,
                stock=product.stock,
            )
        except ValueError:
            # Por si mandan una categoría que no existe en el Enum
            return None