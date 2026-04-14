# adapters/persistence/repositories/mongo_product_repository.py

from typing import List, Optional

from core.domain.entities.product import Product, ProductCategory
from core.domain.ports.product_repository import ProductRepository
from adapters.persistence.models.product_model import ProductDocument

# implementar metodos
class MongoProductRepository(ProductRepository):
    
    def find_all_available(self) -> List[Product]:
        docs = ProductDocument.objects(is_deleted=False,is_available=True)      
        return [self._to_entity(doc) for doc in docs]

    def find_all(self) -> List[Product]:
        return [self._to_entity(doc) for doc in ProductDocument.objects(is_deleted=False)]

    def find_by_id(self, product_id) -> Optional[Product]:
        doc = ProductDocument.objects(product_id=product_id).first()
        return self._to_entity(doc) if doc else None

    def find_by_category(self, category) -> List[Product]:
        val = category.value if hasattr(category, 'value') else category
        docs = ProductDocument.objects(category=val, is_deleted=False, is_available=True)
        return [self._to_entity(doc) for doc in docs]

    def save(self, product: Product) -> Product:
        doc = ProductDocument.objects(product_id = product.id).first()
        if not doc:
            doc = ProductDocument(product_id = product.id)
        doc.product_id = product.id
        doc.name = product.name
        doc.category = product.category.value
        doc.price = product.price
        doc.description = product.description
        doc.image_url = product.image_url
        doc.is_available = product.is_available
        doc.stock = product.stock
        doc.preparation_minutes=product.preparation_minutes
        
        doc.save()
        return product
    def delete(self, product_id: str):
        doc = ProductDocument.objects(product_id=product_id).first()
        if doc:
            doc.is_deleted = True
            doc.is_available = False # Por seguridad, también lo marcamos no disponible
            doc.save()
            return True
        return False
    def update_stock(self, product_id, quantity_change):
        doc = ProductDocument.objects(product_id=product_id).first()
        if doc:
            if quantity_change is None:
                doc.is_available =  True
                doc.save() 
                return True
            new_stock = doc.stock + quantity_change
            if new_stock < 0:
                return False 
            doc.stock = new_stock
            
            if doc.stock == 0  :
                doc.is_available = False
            doc.save() 
            return True
        return False

    def _to_entity(self, d: ProductDocument) -> Product:
        return Product(
                id=d.product_id,
                name=d.name,
                price=d.price,
                description=d.description,   
                image_url=d.image_url,
                category=ProductCategory(d.category),
                preparation_minutes=d.preparation_minutes,
                stock=getattr(d, 'stock', 0), 
                is_available=getattr(d, 'is_available', True)
            )

        

    