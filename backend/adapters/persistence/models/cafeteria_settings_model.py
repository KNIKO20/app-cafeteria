from mongoengine import Document, StringField, BooleanField, DateTimeField
from datetime import datetime
 
 
class CafeteriaSettingsDocument(Document):
    meta = {
        'collection': 'cafeteria_settings',
        'indexes': ['settings_id'],
    }
 
    settings_id       = StringField(required=True, unique=True, default='cafeteria_singleton')
    is_open           = BooleanField(required=True, default=True)
    last_changed_by   = StringField(default='')
    last_changed_at   = DateTimeField(default=datetime.now)
 