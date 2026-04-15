import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from adapters.persistence.models.product_model import ProductDocument

# ── Mapa de nombre → ID de foto Unsplash (curadas, sin API key) ───────────────
# URL final: https://images.unsplash.com/photo-{ID}?w=400&h=400&fit=crop&auto=format
PRODUCT_IMAGES = {
    # BOCADILLOS
    "Bocadillo de Jamón y Queso":   "1528735602780-2552fd46c7ba",
    "Bocadillo de Tortilla":        "1604908176997-125f25cc6f3d",
    "Sándwich Club":                "1567620905732-2d1ec7ab7445",
    "Bocadillo Calamares":          "1565299507177-b0ac66763828",
    "Bocadillo de Lomo y Queso":    "1561651188-d207bbef4046",
    "Sándwich Mixto":               "1528735602780-2552fd46c7ba",
    "Bocadillo Vegetal con Atún":   "1604908176997-125f25cc6f3d",
    "Bocadillo de Bacon y Queso":   "1553909489-cd47e0907980",
    "Sándwich Vegetal":             "1512621776951-a57141f2eefd",
    "Baguette de Pollo Rostizado":  "1550507992-ab519954a299",
    "Bocadillo de Chorizo":         "1558030006-34bdf9085e2d",
    "Bocadillo de Salchichón":      "1558030006-34bdf9085e2d",
    "Pulled Pork Sandwich":         "1561651188-d207bbef4046",
    "Bocadillo de Pechuga Empanada":"1562967914-479b879793fd",
    "Burger Clásica":               "1568901346375-23c9450c58cd",
    "Bocadillo de Ternera":         "1553909489-cd47e0907980",
    "Sándwich de Salmón":           "1519708227418-1e0f30db3e55",
    "Baguette de Queso Brie":       "1484723091739-30986f38c92c",
    "Bocadillo de Morcilla":        "1558030006-34bdf9085e2d",
    "Wrap de Pollo":                "1550507992-ab519954a299",
    # BEBIDAS
    "Coca-Cola Original":           "1554866585-cd94860890b7",
    "Coca-Cola Zero":               "1554866585-cd94860890b7",
    "Fanta Naranja":                "1622483767028-3f5cc7b34de5",
    "Fanta Limón":                  "1622483767028-3f5cc7b34de5",
    "Agua Mineral":                 "1548839140-29a749e1cf4d",
    "Zumo de Naranja Natural":      "1613478223719-2ab802602423",
    "Zumo de Melocotón":            "1600271886742-f049cd451bba",
    "Té Helado Lipton":             "1556679343-c7306c1976bc",
    "Café Solo":                    "1509042239860-f550ce710b93",
    "Café Cortado":                 "1485808191679-5f86510bd5f9",
    "Café con Leche":               "1534778101976-62847782c213",
    "Cappuccino":                   "1572442388796-11668a67e101",
    "Batido de Chocolate":          "1572490122747-3968b75cc699",
    "Batido de Fresa":              "1553530979-f049cd451bba",
    "Cerveza Estrella":             "1608270586735-45087ad89ede",
    "Cerveza 0,0":                  "1608270586735-45087ad89ede",
    "Red Bull":                     "1622483767028-3f5cc7b34de5",
    "Aquarius Limón":               "1622483767028-3f5cc7b34de5",
    "Nestea":                       "1556679343-c7306c1976bc",
    "Café Americano":               "1509042239860-f550ce710b93",
    # POSTRES
    "Tarta de Queso":               "1565958011703-44f9829ba187",
    "Tarta de Muerte por Chocolate":"1578985545062-70f4dc2a0f84",
    "Tiramisú":                     "1571877227200-a0d98ea607e9",
    "Brownie con Nueces":           "1564355808539-22fda35bed7e",
    "Cookie de Chocolate":          "1499636125565-cc23b0a36b96",
    "Donut Glaseado":               "1518133910820-662a0623c62c",
    "Donut de Chocolate":           "1578985545062-70f4dc2a0f84",
    "Croissant de Mantequilla":     "1555507036-ab1f4038808a",
    "Napolitana de Chocolate":      "1608198093002-ad4e005484ec",
    "Crepe de Nutella":             "1519676867240-d03a33d59bdb",
    "Gofre con Chocolate":          "1568051243851-f9b136146e6a",
    "Helado de Vainilla":           "1570197788417-0e82375c9371",
    "Muffin de Arándanos":          "1558961363-fa8fdf82db35",
    "Flan Casero":                  "1604329760661-e694591c0ae3",
    "Natillas":                     "1571877454754-bb9a99be8fca",
    "Arroz con Leche":              "1547592180-85f173990554",
    "Coulant de Chocolate":         "1578985545062-70f4dc2a0f84",
    "Palmera de Chocolate":         "1608198093002-ad4e005484ec",
    "Tarta de Manzana":             "1568702846914-96b305d2aaeb",
    "Macarons Variados":            "1564805135226-285c37001f49",
    # SALUDABLE
    "Ensalada César":               "1546069901-ba9599a7e63c",
    "Ensalada Mediterránea":        "1512621776951-a57141f2eefd",
    "Bowl de Quinoa":               "1490645935967-10de6ba17061",
    "Ensalada Caprese":             "1529691978df-c848276b3bb2",
    "Yogur con Granola":            "1551462898-58e6627b4d05",
    "Yogur con Frutas":             "1488477181946-6428a0291777",
    "Macedonia de Frutas":          "1563746924-bf15e1b37a1c",
    "Plátano":                      "1528825871115-3581a5387919",
    "Manzana":                      "1560806887-1e4cd0b6cbd6",
    "Tostada Integral con Aguacate":"1588137378633-dea1336ce2f9",
    "Tostada Integral con Pavo":    "1484723091739-30986f38c92c",
    "Batido Detox Verde":           "1610970881699-44a5587cf681",
    "Avena con Manzana y Canela":   "1547592180-85f173990554",
    "Zumo de Zanahoria y Naranja":  "1613478223719-2ab802602423",
    "Ensalada de Pasta Integral":   "1512621776951-a57141f2eefd",
    "Wrap Vegano":                  "1512621776951-a57141f2eefd",
    "Hummus con Crudités":          "1541014609669-a87b7797fab5",
    "Edamames":                     "1615485736515-786b048d8e18",
    "Poke Bowl de Tofu":            "1490645935967-10de6ba17061",
    "Tostada Tomate y Aceite":      "1484723091739-30986f38c92c",
}

# Imágenes de fallback por categoría
CATEGORY_FALLBACK = {
    "bocadillo": "1567620905732-2d1ec7ab7445",
    "bebida":    "1509042239860-f550ce710b93",
    "postre":    "1578985545062-70f4dc2a0f84",
    "saludable": "1512621776951-a57141f2eefd",
}

def make_url(photo_id: str) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?w=400&h=400&fit=crop&auto=format"

def run():
    print("Actualizando imágenes con fotos curadas de Unsplash (sin API key)...")
    products = ProductDocument.objects.all()
    count = 0

    for p in products:
        photo_id = PRODUCT_IMAGES.get(p.name)
        if not photo_id:
            # Usa fallback de categoría
            photo_id = CATEGORY_FALLBACK.get(p.category, "1567620905732-2d1ec7ab7445")

        p.image_url = make_url(photo_id)
        p.save()
        count += 1
        print(f"[{count}] {p.name} → {p.image_url}")

    print(f"\n✅ {count} imágenes actualizadas correctamente.")

if __name__ == '__main__':
    run()
