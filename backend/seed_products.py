import os
import sys
import uuid
import django

# Configuración de Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from adapters.persistence.models.product_model import ProductDocument

# ── Fotos curadas de Unsplash (sin API key) ────────────────────────────────────
_BASE = "https://images.unsplash.com/photo-"
_PARAMS = "?w=400&h=400&fit=crop&auto=format&q=80"

PRODUCT_PHOTO_IDS = {
    # BOCADILLOS
    "Bocadillo de Jamón y Queso":    "1528735602780-2552fd46c7ba",
    "Bocadillo de Tortilla":         "1604908176997-125f25cc6f3d",
    "Sándwich Club":                 "1567620905732-2d1ec7ab7445",
    "Bocadillo Calamares":           "1565299507177-b0ac66763828",
    "Bocadillo de Lomo y Queso":     "1561651188-d207bbef4046",
    "Sándwich Mixto":                "1528735602780-2552fd46c7ba",
    "Bocadillo Vegetal con Atún":    "1512621776951-a57141f2eefd",
    "Bocadillo de Bacon y Queso":    "1553909489-cd47e0907980",
    "Sándwich Vegetal":              "1512621776951-a57141f2eefd",
    "Baguette de Pollo Rostizado":   "1550507992-ab519954a299",
    "Bocadillo de Chorizo":          "1558030006-34bdf9085e2d",
    "Bocadillo de Salchichón":       "1558030006-34bdf9085e2d",
    "Pulled Pork Sandwich":          "1561651188-d207bbef4046",
    "Bocadillo de Pechuga Empanada": "1562967914-479b879793fd",
    "Burger Clásica":                "1568901346375-23c9450c58cd",
    "Bocadillo de Ternera":          "1553909489-cd47e0907980",
    "Sándwich de Salmón":            "1519708227418-1e0f30db3e55",
    "Baguette de Queso Brie":        "1484723091739-30986f38c92c",
    "Bocadillo de Morcilla":         "1558030006-34bdf9085e2d",
    "Wrap de Pollo":                 "1550507992-ab519954a299",
    # BEBIDAS
    "Coca-Cola Original":            "1554866585-cd94860890b7",
    "Coca-Cola Zero":                "1554866585-cd94860890b7",
    "Fanta Naranja":                 "1622483767028-3f5cc7b34de5",
    "Fanta Limón":                   "1622483767028-3f5cc7b34de5",
    "Agua Mineral":                  "1548839140-29a749e1cf4d",
    "Zumo de Naranja Natural":       "1613478223719-2ab802602423",
    "Zumo de Melocotón":             "1600271886742-f049cd451bba",
    "Té Helado Lipton":              "1556679343-c7306c1976bc",
    "Café Solo":                     "1509042239860-f550ce710b93",
    "Café Cortado":                  "1485808191679-5f86510bd5f9",
    "Café con Leche":                "1534778101976-62847782c213",
    "Cappuccino":                    "1572442388796-11668a67e101",
    "Batido de Chocolate":           "1572490122747-3968b75cc699",
    "Batido de Fresa":               "1553530979-f049cd451bba",
    "Cerveza Estrella":              "1608270586735-45087ad89ede",
    "Cerveza 0,0":                   "1608270586735-45087ad89ede",
    "Red Bull":                      "1622483767028-3f5cc7b34de5",
    "Aquarius Limón":                "1622483767028-3f5cc7b34de5",
    "Nestea":                        "1556679343-c7306c1976bc",
    "Café Americano":                "1509042239860-f550ce710b93",
    # POSTRES
    "Tarta de Queso":                "1565958011703-44f9829ba187",
    "Tarta de Muerte por Chocolate": "1578985545062-70f4dc2a0f84",
    "Tiramisú":                      "1571877227200-a0d98ea607e9",
    "Brownie con Nueces":            "1564355808539-22fda35bed7e",
    "Cookie de Chocolate":           "1499636125565-cc23b0a36b96",
    "Donut Glaseado":                "1518133910820-662a0623c62c",
    "Donut de Chocolate":            "1578985545062-70f4dc2a0f84",
    "Croissant de Mantequilla":      "1555507036-ab1f4038808a",
    "Napolitana de Chocolate":       "1608198093002-ad4e005484ec",
    "Crepe de Nutella":              "1519676867240-d03a33d59bdb",
    "Gofre con Chocolate":           "1568051243851-f9b136146e6a",
    "Helado de Vainilla":            "1570197788417-0e82375c9371",
    "Muffin de Arándanos":           "1558961363-fa8fdf82db35",
    "Flan Casero":                   "1604329760661-e694591c0ae3",
    "Natillas":                      "1571877454754-bb9a99be8fca",
    "Arroz con Leche":               "1547592180-85f173990554",
    "Coulant de Chocolate":          "1578985545062-70f4dc2a0f84",
    "Palmera de Chocolate":          "1608198093002-ad4e005484ec",
    "Tarta de Manzana":              "1568702846914-96b305d2aaeb",
    "Macarons Variados":             "1564805135226-285c37001f49",
    # SALUDABLE
    "Ensalada César":                "1546069901-ba9599a7e63c",
    "Ensalada Mediterránea":         "1512621776951-a57141f2eefd",
    "Bowl de Quinoa":                "1490645935967-10de6ba17061",
    "Ensalada Caprese":              "1529691978df-c848276b3bb2",
    "Yogur con Granola":             "1551462898-58e6627b4d05",
    "Yogur con Frutas":              "1488477181946-6428a0291777",
    "Macedonia de Frutas":           "1563746924-bf15e1b37a1c",
    "Plátano":                       "1528825871115-3581a5387919",
    "Manzana":                       "1560806887-1e4cd0b6cbd6",
    "Tostada Integral con Aguacate": "1588137378633-dea1336ce2f9",
    "Tostada Integral con Pavo":     "1484723091739-30986f38c92c",
    "Batido Detox Verde":            "1610970881699-44a5587cf681",
    "Avena con Manzana y Canela":    "1547592180-85f173990554",
    "Zumo de Zanahoria y Naranja":   "1613478223719-2ab802602423",
    "Ensalada de Pasta Integral":    "1512621776951-a57141f2eefd",
    "Wrap Vegano":                   "1512621776951-a57141f2eefd",
    "Hummus con Crudités":           "1541014609669-a87b7797fab5",
    "Edamames":                      "1615485736515-786b048d8e18",
    "Poke Bowl de Tofu":             "1490645935967-10de6ba17061",
    "Tostada Tomate y Aceite":       "1484723091739-30986f38c92c",
}

CATEGORY_FALLBACK_IDS = {
    "bocadillo": "1567620905732-2d1ec7ab7445",
    "bebida":    "1509042239860-f550ce710b93",
    "postre":    "1578985545062-70f4dc2a0f84",
    "saludable": "1512621776951-a57141f2eefd",
}

def get_image_url(name: str, category: str = "") -> str:
    photo_id = (
        PRODUCT_PHOTO_IDS.get(name)
        or CATEGORY_FALLBACK_IDS.get(category.lower(), "1567620905732-2d1ec7ab7445")
    )
    return f"{_BASE}{photo_id}{_PARAMS}"

# Categorías definidas: bocadillo, bebida, postre, saludable
# 20 items cada uno.

PRODUCTS = [
    # ---- BOCADILLOS (20) ----
    ("Bocadillo de Jamón y Queso", "bocadillo", "Clásico bocadillo con pan crujiente, jamón reserva y queso fundido.", 3.50, "delicious ham and cheese sandwich on baguette"),
    ("Bocadillo de Tortilla", "bocadillo", "Jugosa tortilla de patatas en pan de cristal.", 3.00, "spanish potato omelette sandwich on crusty bread"),
    ("Sándwich Club", "bocadillo", "Triple piso con pollo, bacon, lechuga, tomate y mayonesa.", 4.50, "triple decker club sandwich with bacon chicken and cheese"),
    ("Bocadillo Calamares", "bocadillo", "El castizo, con anillas de calamar a la andaluza.", 4.00, "fried calamari sandwich squid rings on bread"),
    ("Bocadillo de Lomo y Queso", "bocadillo", "Lomo a la plancha con queso derretido.", 3.80, "grilled pork loin and melted cheese sandwich"),
    ("Sándwich Mixto", "bocadillo", "Sándwich a la plancha de york y queso.", 2.50, "grilled cheese and ham sandwich on sliced bread"),
    ("Bocadillo Vegetal con Atún", "bocadillo", "Atún, lechuga, tomate, huevo duro y mayonesa.", 3.80, "tuna lettuce tomato boiled egg sandwich"),
    ("Bocadillo de Bacon y Queso", "bocadillo", "Bacon crujiente con queso havarti fundido.", 3.50, "bacon and melted cheese sandwich"),
    ("Sándwich Vegetal", "bocadillo", "Lechuga, tomate, espárragos y mayonesa ligera.", 2.80, "vegetarian sandwich with lettuce tomato asparagus"),
    ("Baguette de Pollo Rostizado", "bocadillo", "Tiras de pollo asado con salsa mostaza y miel.", 4.20, "roasted chicken sandwich with honey mustard on baguette"),
    ("Bocadillo de Chorizo", "bocadillo", "Auténtico chorizo ibérico en pan rústico.", 3.50, "iberian chorizo sausage sandwich"),
    ("Bocadillo de Salchichón", "bocadillo", "Salchichón ibérico con un toque de aceite de oliva.", 3.50, "iberian salchichon salami sandwich"),
    ("Pulled Pork Sandwich", "bocadillo", "Cerdo desmigado con salsa BBQ y ensalada de col.", 5.00, "bbq pulled pork sandwich with coleslaw"),
    ("Bocadillo de Pechuga Empanada", "bocadillo", "Pechuga crujiente de pollo con alioli.", 4.00, "crispy breaded chicken breast sandwich with mayo"),
    ("Burger Clásica", "bocadillo", "Hamburguesa de ternera con queso, lechuga y tomate.", 4.50, "classic beef burger with cheese lettuce tomato"),
    ("Bocadillo de Ternera", "bocadillo", "Filete de ternera a la plancha con pimientos.", 4.80, "grilled beef steak sandwich with green peppers"),
    ("Sándwich de Salmón", "bocadillo", "Salmón ahumado, queso crema y eneldo.", 4.50, "smoked salmon and cream cheese sandwich"),
    ("Baguette de Queso Brie", "bocadillo", "Queso brie fundido con cebolla caramelizada.", 4.00, "melted brie cheese and caramelized onion sandwich"),
    ("Bocadillo de Morcilla", "bocadillo", "Morcilla frita con pimientos del piquillo.", 3.80, "fried blood sausage sandwich with red peppers"),
    ("Wrap de Pollo", "bocadillo", "Tortilla de trigo rellena de pollo, lechuga y salsa.", 3.50, "chicken wrap with lettuce and sauce"),

    # ---- BEBIDAS (20) ----
    ("Coca-Cola Original", "bebida", "Lata 33cl bien fría.", 1.50, "can of Coca Cola with ice cubes"),
    ("Coca-Cola Zero", "bebida", "Lata 33cl sin azúcar.", 1.50, "can of Coca Cola Zero with ice cubes"),
    ("Fanta Naranja", "bebida", "Lata 33cl sabor naranja.", 1.50, "can of Fanta Orange with ice cubes"),
    ("Fanta Limón", "bebida", "Lata 33cl sabor limón.", 1.50, "can of Fanta Lemon with ice cubes"),
    ("Agua Mineral", "bebida", "Botella de agua natural 50cl.", 1.00, "bottle of fresh mineral water"),
    ("Zumo de Naranja Natural", "bebida", "Zumo recién exprimido.", 2.50, "glass of fresh squeezed orange juice"),
    ("Zumo de Melocotón", "bebida", "Botellín de zumo de melocotón.", 1.80, "glass of peach juice"),
    ("Té Helado Lipton", "bebida", "Té helado sabor limón 33cl.", 1.80, "glass of iced tea with lemon"),
    ("Café Solo", "bebida", "Espresso intenso.", 1.20, "cup of dark espresso coffee black"),
    ("Café Cortado", "bebida", "Espresso con una nube de leche.", 1.30, "cup of cortado coffee with milk"),
    ("Café con Leche", "bebida", "Café espresso con leche caliente cremosa.", 1.50, "cup of cafe con leche latte coffee"),
    ("Cappuccino", "bebida", "Café con leche y abundante espuma, toque de cacao.", 1.80, "cup of cappuccino coffee with foam and cocoa"),
    ("Batido de Chocolate", "bebida", "Batido frío de chocolate.", 2.50, "glass of cold chocolate milkshake"),
    ("Batido de Fresa", "bebida", "Batido frío de fresa natural.", 2.50, "glass of cold strawberry milkshake"),
    ("Cerveza Estrella", "bebida", "Cerveza rubia en lata 33cl.", 1.80, "can of lager beer cold"),
    ("Cerveza 0,0", "bebida", "Cerveza sin alcohol 33cl.", 1.80, "can of zero alcohol beer cold"),
    ("Red Bull", "bebida", "Bebida energética 25cl.", 2.50, "can of red bull energy drink"),
    ("Aquarius Limón", "bebida", "Bebida isotónica sabor limón 33cl.", 1.80, "can of isotonic lemon drink"),
    ("Nestea", "bebida", "Té negro con limón sin gas.", 1.80, "can of nestea lemon iced tea"),
    ("Café Americano", "bebida", "Espresso largo con agua caliente.", 1.30, "cup of hot americano coffee"),

    # ---- POSTRES (20) ----
    ("Tarta de Queso", "postre", "Tarta casera horneada estilo viña.", 3.50, "creamy basque burnt cheesecake slice"),
    ("Tarta de Muerte por Chocolate", "postre", "Bizcocho denso y capas de ganache de chocolate.", 3.80, "slice of rich dark chocolate cake"),
    ("Tiramisú", "postre", "Clásico postre italiano con café y mascarpone.", 3.50, "slice of authentic italian tiramisu dessert"),
    ("Brownie con Nueces", "postre", "Bizcocho de chocolate intenso con nueces.", 2.50, "chocolate fudge brownie with walnuts"),
    ("Cookie de Chocolate", "postre", "Galleta extra grande con pepitas de chocolate.", 1.50, "large soft chocolate chip cookie"),
    ("Donut Glaseado", "postre", "Tierna rosquilla con glaseado de azúcar.", 1.20, "classic sugar glazed donut"),
    ("Donut de Chocolate", "postre", "Rosquilla cubierta de chocolate fondant.", 1.30, "chocolate frosted donut"),
    ("Croissant de Mantequilla", "postre", "Cruasán francés recién horneado.", 1.50, "fresh baked buttery french croissant"),
    ("Napolitana de Chocolate", "postre", "Hojaldre relleno de crema de cacao.", 1.60, "pain au chocolat chocolate pastry"),
    ("Crepe de Nutella", "postre", "Crepe recién hecha rellena de abundante Nutella.", 3.00, "fresh crepe folded with nutella and chocolate sauce"),
    ("Gofre con Chocolate", "postre", "Gofre belga caliente con sirope de chocolate.", 3.00, "belgian waffle with chocolate syrup drizzled"),
    ("Helado de Vainilla", "postre", "Tarrina de helado artesanal de vainilla.", 2.50, "scoop of vanilla ice cream in a bowl"),
    ("Muffin de Arándanos", "postre", "Magdalena esponjosa con arándanos frescos.", 2.00, "blueberry muffin fresh baked"),
    ("Flan Casero", "postre", "Flan de huevo tradicional con caramelo líquido.", 2.50, "creme caramel traditional egg flan dessert"),
    ("Natillas", "postre", "Natillas caseras con galleta y canela.", 2.50, "spanish natillas vanilla custard with cookie and cinnamon"),
    ("Arroz con Leche", "postre", "Arroz cremoso con toque de limón y canela.", 2.50, "creamy rice pudding with cinnamon"),
    ("Coulant de Chocolate", "postre", "Bizcochito relleno de chocolate caliente fundido.", 3.50, "chocolate lava cake with molten center"),
    ("Palmera de Chocolate", "postre", "Hojaldre en forma de corazón bañado en chocolate.", 1.80, "huge chocolate covered palmera pastry"),
    ("Tarta de Manzana", "postre", "Base de hojaldre con láminas de manzana horneada.", 3.00, "slice of apple tart with puff pastry"),
    ("Macarons Variados", "postre", "Pack de 3 macarons franceses de sabores (fresa, vainilla, pistacho).", 3.00, "three colorful french macarons stacked"),

    # ---- SALUDABLE (20) ----
    ("Ensalada César", "saludable", "Lechuga, pechuga asada, picatostes, parmesano y salsa.", 4.50, "classic chicken caesar salad with croutons and parmesan"),
    ("Ensalada Mediterránea", "saludable", "Lechuga, tomate, atún, cebolla, aceitunas y huevo duro.", 4.50, "mediterranean tuna salad with olives and egg"),
    ("Bowl de Quinoa", "saludable", "Quinoa, aguacate, cherrys, maíz y aliño de limón.", 5.00, "healthy quinoa bowl with avocado and cherry tomatoes"),
    ("Ensalada Caprese", "saludable", "Tomate fresco, mozzarella de búfala y albahaca.", 4.20, "fresh caprese salad with tomato mozzarella basil"),
    ("Yogur con Granola", "saludable", "Yogur natural con granola crujiente y miel.", 2.50, "bowl of natural yogurt with crunchy granola and honey"),
    ("Yogur con Frutas", "saludable", "Yogur natural con mezcla de frutos rojos.", 2.80, "yogurt bowl with mixed berries and strawberries"),
    ("Macedonia de Frutas", "saludable", "Mezcla de fruta fresca de temporada cortada.", 3.00, "fresh fruit salad bowl macedonia"),
    ("Plátano", "saludable", "Pieza de plátano de Canarias.", 0.80, "single ripe banana fruit"),
    ("Manzana", "saludable", "Pieza de manzana fuji crujiente.", 0.80, "single crisp fuji apple fruit"),
    ("Tostada Integral con Aguacate", "saludable", "Pan integral tostado con aguacate machacado y AOVE.", 2.50, "whole wheat toast with smashed avocado and olive oil"),
    ("Tostada Integral con Pavo", "saludable", "Pan integral con lonchas de pavo braseado.", 2.20, "whole wheat toast with sliced turkey breast"),
    ("Batido Detox Verde", "saludable", "Espinacas, manzana, jengibre y pepino.", 3.50, "green detox smoothie glass"),
    ("Avena con Manzana y Canela", "saludable", "Gachas de avena calientes con trozos de manzana.", 3.00, "bowl of hot oatmeal porridge with apple cinnamon"),
    ("Zumo de Zanahoria y Naranja", "saludable", "Zumo vitamínico 100% natural exprimidor.", 2.80, "glass of fresh carrot and orange juice"),
    ("Ensalada de Pasta Integral", "saludable", "Pasta integral con verduras asadas y pesto.", 4.50, "whole wheat pasta salad with roasted vegetables"),
    ("Wrap Vegano", "saludable", "Hummus, espinacas, zanahoria y pimientos en rosco integral.", 4.00, "vegan wrap with hummus spinach carrots"),
    ("Hummus con Crudités", "saludable", "Hummus casero acompañado de bastones de zanahoria y apio.", 3.50, "bowl of hummus with fresh carrot and celery sticks"),
    ("Edamames", "saludable", "Ración de edamames al vapor con sal en escamas.", 3.00, "bowl of steamed edamame beans with sea salt"),
    ("Poke Bowl de Tofu", "saludable", "Tofu marinado, arroz, edamames, algas, aguacate.", 6.00, "tofu poke bowl with rice avocado edamame seaweed"),
    ("Tostada Tomate y Aceite", "saludable", "Pan rústico con tomate natural rallado y aceite oliva virgen extra.", 1.80, "spanish pan tumaca toast with grated tomato and olive oil"),
]

def run():
    print("Iniciando inyección de 80 productos con imágenes de alta calidad...")
    
    # Limpiar los productos actuales para evitar duplicados si se corre varias veces
    ProductDocument.objects.delete()
    
    count = 0
    for name, cat, desc, price, _ in PRODUCTS:
        # Generar un ID unívoco
        pid = "prod_" + str(uuid.uuid4())[:8]

        # URL de imagen curada de Unsplash (sin API key, 100% fiable)
        img_url = get_image_url(name, cat)
        
        prod = ProductDocument(
            product_id=pid,
            name=name,
            category=cat,
            description=desc,
            price=price,
            image_url=img_url,
            is_available=True,
            stock=100, # Valor fijo para consistencia
            preparation_minutes=5,
            is_deleted=False
        )
        prod.save()
        count += 1
        print(f"[{count}/80] Añadido: {name} ({cat})")

    print("¡Proceso completado exitosamente! Tienes 80 productos en la BDD.")

if __name__ == '__main__':
    run()
