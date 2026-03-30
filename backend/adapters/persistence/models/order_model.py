# El modelo de MongoDB (Mongoengine).
# SOLO existe en el adaptador de persistencia.
# El dominio nunca hace import de esto.

from mongoengine import Document, StringField, FloatField, ListField, \
                        EmbeddedDocument, EmbeddedDocumentField, \
                        DateTimeField, BooleanField, IntField
from datetime import datetime

#Document: Equivale a una Fila/Registro
#Collection: Equivale a una Tabla
#EmbeddedDocument: Es un objeto dentro de otro
#Field: Equivale a una Columna

# lo que en sql serían dos tablas y para consultar un JOIN
# en mongo nos trae todos los items que queremos en la misma query

# Un EmbeddedDocument no tiene una colección propia en la base de datos
class OrderItemDocument(EmbeddedDocument):
    """Ítem embebido dentro del pedido (MongoDB embeds)"""
    product_id = StringField(required=True)
    product_name = StringField(required=True)
    unit_price = FloatField(required=True)
    quantity = IntField(required=True, min_value=1)

# en monogodb se verá como un JSON
class OrderDocument(Document):
    """Documento MongoDB para un pedido"""
    meta = {
        'collection': 'orders',
        # se crean indexes para mejorar la busqueda
        'indexes': [
            'user_id',
            'status',
            'pickup_code',
            {'fields': ['created_at'], 'expireAfterSeconds': 30 * 24 * 3600}  # TTL 30 días
            # para que se borre d ela base de datos a los 30 dias
        ]
    }
    
    order_id = StringField(required=True, unique=True)    # nuestro UUID del dominio
    user_id = StringField(required=True)

    # es una lista de ítems, y cada ítem debe seguir la 
    # estructura de OrderItemDocument
    items = ListField(EmbeddedDocumentField(OrderItemDocument))

    pickup_timeslot = StringField(required=True)
    pickup_date = DateTimeField(required=True)
    status = StringField(required=True, default='pending_payment')
    pickup_code = StringField()
    payment_reference = StringField()
    created_at = DateTimeField(default=datetime.now)