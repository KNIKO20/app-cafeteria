from mongoengine import Document, ListField, QuerySet, StringField, FloatField, BooleanField, IntField

class ProductDocument(Document):
    meta = {
        'collection': 'products',
        'indexes' : [
            'product_id',
            'category',
            
        ]
    }
    objects: QuerySet

    product_id = StringField(required=True, unique=True)
    name = StringField(required=True)
    category = StringField()
    price = FloatField(required=True)
    description = StringField(default="")
    image_url = StringField(default="")
    is_available = BooleanField(default=True)
    stock = IntField(null=True)
    preparation_minutes = IntField()
    is_deleted = BooleanField(default=False)
    allergens = ListField(StringField(), default=[])

    