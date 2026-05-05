import jwt
import sys

print(f"Python version: {sys.version}")
print(f"jwt module file: {jwt.__file__}")
try:
    print(f"jwt version: {jwt.__version__}")
except AttributeError:
    print("jwt module has no __version__")

print(f"jwt attributes: {dir(jwt)}")

try:
    print("Testing jwt.encode...")
    token = jwt.encode({'test': 'data'}, 'secret', algorithm='HS256')
    print(f"Success! Token: {token}")
except Exception as e:
    print(f"Failed to encode: {e}")
