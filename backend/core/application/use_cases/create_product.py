from dataclasses import dataclass
from typing import Optional
import uuid

from core.domain.ports.product_repository import ProductRepository
from core.domain.entities.product import Product, ProductCategory
@dataclass
class CreateProductInput:
    """Datos que llegan desde el frontend"""
    name: str
    price: float                        # En euros
    category: str
    description: str = ""
    image_url: str = ""
    is_available: bool = True
    stock: Optional[int] = None         # None = sin límite de stock
    #puede ser null/None o int
    preparation_minutes: int = 5          

@dataclass
class CreateProductOutput:
    """Datos que devolvemos al frontend"""
    id: str
    name: str
    price: float                        # En euros
    category: str
    is_available: bool = True
    stock: Optional[int] = None         # None = sin límite de stock
 
    
class CreateProductUseCase:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    def execute(self, input_data: CreateProductInput) -> CreateProductOutput:
        
        product = Product(
            id=str(uuid.uuid4()),
            name=input_data.name,
            price=input_data.price,
            category=ProductCategory(input_data.category),
            description=input_data.description,
            image_url=input_data.image_url,
            is_available=input_data.is_available,
            stock=input_data.stock,
            preparation_minutes=input_data.preparation_minutes,
            is_deleted=False
        )

        self.product_repo.save(product)
        return CreateProductOutput(
            id=product.id,
            name=product.name,
            price=product.price,
            category=product.category.value,
            is_available=product.is_available,
            stock=product.stock,
        )
        