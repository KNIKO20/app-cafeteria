# core/domain/exceptions.py

class DomainException(Exception):
    """Clase base para errores de negocio"""
    pass

class ProductNotFoundException(DomainException):
    def __init__(self, product_id: str):
        self.message = f"El producto con ID {product_id} no existe en el catálogo."
        super().__init__(self.message)

class InsufficientStockException(DomainException):
    def __init__(self, product_name: str, current_stock: int):
        self.message = f"Stock insuficiente para '{product_name}'. Solo quedan {current_stock} unidades."
        super().__init__(self.message)