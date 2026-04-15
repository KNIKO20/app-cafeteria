from decouple import config
import os

print(f"Current Directory: {os.getcwd()}")
print(f"Env file exists: {os.path.exists('.env')}")
print(f"ADMIN_EMAILS from config: '{config('ADMIN_EMAILS', default='NOT_FOUND')}'")
