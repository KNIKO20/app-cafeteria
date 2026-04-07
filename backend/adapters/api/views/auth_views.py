from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from config.di_container import get_login_with_google_use_case, get_current_user_use_case
from core.domain.exceptions.auth_exceptions import UserNotFoundError, UserInactiveError


class GoogleLoginView(APIView):
    # Cualquiera puede intentar loguearse, no pedimos token previo
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "El token de Google es requerido"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            use_case = get_login_with_google_use_case()
            # El caso de uso devuelve directamente el JWT como string
            access_token = use_case.execute(token)
            return Response({"access_token": access_token}, status=status.HTTP_200_OK)
        except ValueError as e:
            with open("google_auth_error_log.txt", "w") as f:
                f.write(f"ValueError: {str(e)}\nToken Recibido: {token}")
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except UserInactiveError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"error": "Error interno al iniciar sesión."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeView(APIView):
    # Solo usuarios con JWT válido pueden ver su perfil
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            use_case = get_current_user_use_case()
            # request.user.id viene del token JWT validado por JWTAuthentication
            user = use_case.execute(str(request.user.id))

            return Response({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value,
                "avatar_url": user.avatar_url
            }, status=status.HTTP_200_OK)
        except UserNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": "Error interno del servidor"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)