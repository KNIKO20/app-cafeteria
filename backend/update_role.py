import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from config.db import get_database

db = get_database()

result = db['users'].update_many(
    {'email': {'$in': ['engelnieves000@gmail.com', 'engelnieves103@gmail.com', 'engellnieves103@gmail.com']}},
    {'$set': {'role': 'admin'}}
)

print(f"Matched count: {result.matched_count}, Modified count: {result.modified_count}")

users = list(db['users'].find())
for u in users:
    print(f"{u['email']} -> {u['role']}")
