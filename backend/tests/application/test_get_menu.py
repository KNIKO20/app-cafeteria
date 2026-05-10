# Tests para el caso de uso GetMenuUseCase.

import unittest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.domain.entities.product import Product, ProductCategory
from core.application.use_cases.get_menu import GetMenuUseCase
from tests.fakes.fake_product_repository import FakeProductRepository


class TestGetMenuUseCase(unittest.TestCase):
    """Tests del caso de uso GetMenu."""

    def setUp(self):
        """Prepara el repositorio fake con productos de ejemplo."""
        self.repo = FakeProductRepository()

        # Productos de ejemplo
        self.repo.add(Product(
            id="p1", name="Bocadillo de Jamón", price=3.50,
            category=ProductCategory.BOCADILLO_FRIO, is_available=True, stock=10,
        ))
        self.repo.add(Product(
            id="p2", name="Café con Leche", price=1.20,
            category=ProductCategory.BEBIDA, is_available=True, stock=None,
        ))
        self.repo.add(Product(
            id="p3", name="Zumo de Naranja", price=2.00,
            category=ProductCategory.BEBIDA, is_available=True, stock=5,
        ))
        self.repo.add(Product(
            id="p4", name="Tarta de Queso", price=2.50,
            category=ProductCategory.POSTRE, is_available=False,  # no disponible
        ))

        self.use_case = GetMenuUseCase(self.repo)

    # ── execute sin categoría ───────────────────────────────

    def test_get_all_available(self):
        """Sin categoría → devuelve solo productos disponibles."""
        products = self.use_case.execute()
        self.assertEqual(len(products), 3)  # p4 no disponible
        names = [p.name for p in products]
        self.assertIn("Bocadillo de Jamón", names)
        self.assertIn("Café con Leche", names)
        self.assertIn("Zumo de Naranja", names)
        self.assertNotIn("Tarta de Queso", names)

    # ── execute con categoría ───────────────────────────────

    def test_filter_by_category_bebida(self):
        """Filtrar por categoría 'bebida' → solo bebidas disponibles."""
        products = self.use_case.execute(category="bebida")
        self.assertEqual(len(products), 2)
        for p in products:
            self.assertEqual(p.category, ProductCategory.BEBIDA)

    def test_filter_by_category_bocadillo(self):
        """Filtrar por categoría 'bocadillo'."""
        products = self.use_case.execute(category="bocadillo_frio")
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0].name, "Bocadillo de Jamón")

    def test_filter_by_category_postre_unavailable(self):
        """Filtrar por 'postre' → no devuelve el postre no disponible."""
        products = self.use_case.execute(category="postre")
        self.assertEqual(len(products), 0)

    # ── Categoría inválida ──────────────────────────────────

    def test_invalid_category(self):
        """Categoría inexistente → ValueError."""
        with self.assertRaises(ValueError):
            self.use_case.execute(category="pizza")

    # ── Repositorio vacío ───────────────────────────────────

    def test_empty_repository(self):
        """Repositorio vacío → lista vacía."""
        empty_repo = FakeProductRepository()
        use_case = GetMenuUseCase(empty_repo)
        products = use_case.execute()
        self.assertEqual(len(products), 0)


if __name__ == '__main__':
    unittest.main()
