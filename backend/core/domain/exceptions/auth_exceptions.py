class AuthException(Exception):
    """Clase base para excepciones de autenticación."""
    pass

class InvalidCredentialsError(AuthException):
    """Lanzada cuando el token o las credenciales son inválidas."""
    pass

class UserNotFoundError(AuthException):
    """Lanzada cuando no se encuentra al usuario."""
    pass

class UserInactiveError(AuthException):
    """Lanzada cuando el usuario está desactivado."""
    pass
