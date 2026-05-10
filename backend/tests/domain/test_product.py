# Tests para la entidad Product y sus reglas de negocio.

import unittest
import sys
import os

# Añadir el directorio backend al path para los imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.domain.entities.product import Product, ProductCategory


class TestProduct(unittest.TestCase):
    """Tests de la entidad Product."""

    def _make_product(self, **overrides) -> Product:
        """Helper: crea un producto con valores por defecto."""
        defaults = {
            "id": "prod-1",
            "name": "Bocadillo de Jamón",
            "price": 3.50,
            "category": ProductCategory.BOCADILLO_FRIO,
        }
        defaults.update(overrides)
        return Product(**defaults)

    # ── is_in_stock ─────────────────────────────────────────

    def test_product_available_with_stock(self):
        """Producto disponible y con stock → en stock."""
        product = self._make_product(is_available=True, stock=10)
        self.assertTrue(product.is_in_stock())

    def test_product_unavailable(self):
        """Producto marcado como no disponible → NO en stock."""
        product = self._make_product(is_available=False, stock=10)
        self.assertFalse(product.is_in_stock())

    def test_product_zero_stock(self):
        """Producto con stock 0 → NO en stock."""
        product = self._make_product(stock=0)
        self.assertFalse(product.is_in_stock())

    def test_product_unlimited_stock(self):
        """Producto con stock=None (ilimitado) → en stock."""
        product = self._make_product(stock=None)
        self.assertTrue(product.is_in_stock())

    def test_product_unavailable_and_no_stock(self):
        """Producto no disponible y sin stock → NO en stock."""
        product = self._make_product(is_available=False, stock=0)
        self.assertFalse(product.is_in_stock())

    # ── reduce_stock ────────────────────────────────────────

    def test_reduce_stock_default(self):
        """Reduce stock en 1 por defecto."""
        product = self._make_product(stock=5)
        product.reduce_stock()
        self.assertEqual(product.stock, 4)

    def test_reduce_stock_custom_quantity(self):
        """Reduce stock en la cantidad indicada."""
        product = self._make_product(stock=10)
        product.reduce_stock(3)
        self.assertEqual(product.stock, 7)

    def test_reduce_stock_insufficient(self):
        """Error si se intenta reducir más stock del disponible."""
        product = self._make_product(stock=2)
        with self.assertRaises(ValueError):
            product.reduce_stock(5)

    def test_reduce_stock_unlimited(self):
        """No hace nada si stock es None (ilimitado)."""
        product = self._make_product(stock=None)
        product.reduce_stock(100)
        self.assertIsNone(product.stock)

    # ── Propiedades básicas ─────────────────────────────────

    def test_product_category_enum(self):
        """Las categorías se crean correctamente como Enum."""
        product = self._make_product(category=ProductCategory.BEBIDA)
        self.assertEqual(product.category, ProductCategory.BEBIDA)
        self.assertEqual(product.category.value, "bebida")

    def test_product_default_values(self):
        """Los valores por defecto se asignan correctamente."""
        product = self._make_product()
        self.assertEqual(product.description, "")
        self.assertEqual(product.image_url, "")
        self.assertTrue(product.is_available)
        self.assertIsNone(product.stock)
        self.assertEqual(product.preparation_minutes, 5)


if __name__ == '__main__':
    unittest.main()
