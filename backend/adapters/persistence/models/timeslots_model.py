from mongoengine import Document, StringField, IntField, BooleanField
 
 
class TimeSlotDocument(Document):
    meta = {
        'collection': 'timeslots',
        'indexes': ['slot_id', 'is_active'],
        'ordering': ['start_time'],
    }
 
    slot_id         = StringField(required=True, unique=True)
    start_time      = StringField(required=True)    # "10:30"
    end_time        = StringField(required=True)    # "11:00"
    max_orders      = IntField(required=True, default=20, min_value=1)
    current_orders  = IntField(default=0)
    is_active       = BooleanField(default=True)