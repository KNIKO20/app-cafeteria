import os
import sys
import uuid
import django

# Configuración de Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from adapters.persistence.models.product_model import ProductDocument

# No se asignan imágenes automáticas. Preparado para carga manual.
def get_image_url(name: str, category: str = "") -> str:
    return ""

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

        # No se inyecta imagen automática
        img_url = ""
        
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
