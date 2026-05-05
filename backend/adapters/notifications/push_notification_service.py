# FLUJO:
#   1. El frontend guarda el Expo Push Token al hacer login.
#      (Necesitas un endpoint /api/auth/push-token/ y campo push_token en User.)
#   2. Este servicio lo recupera de la BD y llama a la API de Expo.
#   3. Si el token no existe o el envío falla, se loguea y retorna False
#      SIN lanzar excepción (las notificaciones no deben romper el flujo).
#
# MODO DESARROLLO:
#   Si EXPO_PUSH_ENABLED=False en .env, se loguea en consola en lugar de
#   hacer la llamada HTTP real. Útil para desarrollo local.
 
import json
import logging
from typing import Optional
 
import requests
from decouple import config
 
from core.domain.ports.notification_service import NotificationService
 
logger = logging.getLogger(__name__)
 
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
 
# Mensajes por estado — lo que ve el alumno en su móvil
STATUS_COPY = {
    "paid": {
        "title": "Pedido confirmado",
        "body":  "Tu pedido ha sido recibido y pagado.",
    },
    "preparing": {
        "title": "En preparación",
        "body":  "La cafetería está preparando tu pedido.",
    },
    "ready": {
        "title": "Listo para recoger",
        "body":  "Tu pedido está listo. Pasa a buscarlo con tu código.",
    },
    "collected": {
        "title": "Recogido",
        "body":  "Pedido entregado. ¡Que aproveche!",
    },
}
 
 
class ExpoPushNotificationService(NotificationService):
    """
    Envía notificaciones push mediante la API de Expo.
    Requiere que los usuarios tengan guardado su Expo Push Token.
    """
 
    def __init__(self, user_token_resolver=None):
        """
        user_token_resolver: callable(user_id: str) -> Optional[str]
            Función que dado el user_id devuelve su Expo Push Token.
            Si es None, se usa el resolver por defecto que consulta MongoDB.
        """
        self._enabled = config("EXPO_PUSH_ENABLED", default=False, cast=bool)
        self._resolver = user_token_resolver or self._default_token_resolver
 
    # ── Puerto: send_order_status_update ─────────────────────────────
    def send_order_status_update(
        self,
        user_id: str,
        order_id: str,
        new_status: str,
        pickup_code: Optional[str] = None,
    ) -> bool:
        copy = STATUS_COPY.get(new_status, {
            "title": "Actualización de pedido",
            "body":  f"Tu pedido ha pasado a estado: {new_status}",
        })
 
        # Añadir el código de recogida al body cuando está listo
        body = copy["body"]
        if new_status == "ready" and pickup_code:
            body = f"{body} Código: {pickup_code}"
 
        return self._send(
            user_id=user_id,
            title=copy["title"],
            body=body,
            data={"order_id": order_id, "status": new_status},
        )
 
    # ── Puerto: send_cafeteria_closing_soon ──────────────────────────
    def send_cafeteria_closing_soon(self, minutes_remaining: int) -> bool:
        # Broadcast: en una app real enviarías a todos los usuarios.
        # Aquí se deja como punto de extensión.
        logger.info(f"[NOTIF] Cafetería cierra en {minutes_remaining} min (broadcast no implementado)")
        return True
 
    # ── Lógica interna ───────────────────────────────────────────────
    def _send(
        self,
        user_id: str,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> bool:
        push_token = self._resolver(user_id)
 
        if not push_token:
            logger.debug(f"[NOTIF] Sin push token para user '{user_id}' — omitiendo")
            return False
 
        if not self._enabled:
            # Modo dev: solo log
            logger.info(
                f"[NOTIF MOCK] → {user_id}\n"
                f"  Title: {title}\n"
                f"  Body:  {body}\n"
                f"  Data:  {json.dumps(data)}"
            )
            return True
 
        payload = {
            "to":    push_token,
            "title": title,
            "body":  body,
            "sound": "default",
            "data":  data or {},
        }
 
        try:
            resp = requests.post(
                EXPO_PUSH_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
            resp.raise_for_status()
            result = resp.json()
 
            # La API de Expo devuelve errors individuales dentro del body
            ticket = result.get("data", {})
            if ticket.get("status") == "error":
                logger.warning(f"[NOTIF] Error de Expo: {ticket.get('message')}")
                return False
 
            logger.info(f"[NOTIF] Enviada a {user_id}: {title}")
            return True
 
        except requests.RequestException as e:
            logger.error(f"[NOTIF] Fallo HTTP al enviar push: {e}")
            return False
 
    @staticmethod
    def _default_token_resolver(user_id: str) -> Optional[str]:
        """
        Busca el push token usando el repositorio de dominio.
        """
        try:
            # 1. Obtener la instancia del repositorio
            # Dependiendo de cómo inicialices tu app, podrías necesitar 
            # importar el contenedor de dependencias o la db_collection aquí.
            from adapters.persistence.repositories.mongo_user_repository import MongoUserRepository # O donde sea que instancies tu MongoUserRepository
            
            # 2. Buscar al usuario por ID
            user = MongoUserRepository.find_by_id(user_id)
            
            # 3. Retornar el token si el usuario existe
            return user.push_token if user else None
            
        except Exception as e:
            logger.debug(f"[NOTIF] No se pudo resolver token para {user_id}: {e}")
            return None
 
 
# ── Implementación nula (para tests y entornos sin notificaciones) ────────────
 
class NullNotificationService(NotificationService):
    """
    Implementación que no hace nada.
    Úsala en tests y en entornos donde no quieras notificaciones.
    """
 
    def send_order_status_update(self, user_id, order_id, new_status, pickup_code=None):
        logger.debug(f"[NULL NOTIF] Status update ignorado: {order_id} → {new_status}")
        return True
 
    def send_cafeteria_closing_soon(self, minutes_remaining):
        return True