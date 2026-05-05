from dataclasses import dataclass
from core.domain.entities.order import OrderStatus
from core.domain.ports.order_repository import OrderRepository
from core.domain.ports.notification_service import NotificationService

# Mensajes que recibe el alumno en su móvil según el nuevo estado
NOTIFICATION_MESSAGES = {
    OrderStatus.PREPARING: {
        "title": "Tu pedido está en preparación",
        "body": "La cafetería está preparando tu pedido. Estará listo pronto.",
    },
    OrderStatus.READY: {
        "title": "Tu pedido está listo",
        "body": "Pasa a recogerlo con tu código. ¡No tardes!",
    },
    OrderStatus.COLLECTED: {
        "title": "Pedido recogido",
        "body": "Gracias. ¡Que aproveche!",
    },
}

# Transiciones válidas: qué método llamar en la entidad según el status pedido
VALID_TRANSITIONS = {
    "preparing": ("mark_as_preparing", OrderStatus.PREPARING),
    "ready":     ("mark_as_ready",     OrderStatus.READY),
    "collected": ("mark_as_collected", OrderStatus.COLLECTED),
}


@dataclass
class UpdateOrderStatusInput:
    order_id: str
    new_status: str         # "preparing" | "ready" | "collected"
    changed_by: str = ""    # email del admin — para logging futuro


@dataclass
class UpdateOrderStatusOutput:
    order_id: str
    status: str             # nuevo estado como string
    notification_sent: bool


class UpdateOrderStatusUseCase:

    def __init__(
        self,
        order_repo: OrderRepository,
        notification_service: NotificationService,
    ):
        self.order_repo = order_repo
        self.notification_service = notification_service

    def execute(self, input_data: UpdateOrderStatusInput) -> UpdateOrderStatusOutput:
        # 1. Obtener el pedido
        order = self.order_repo.find_by_id(input_data.order_id)
        if order is None:
            raise LookupError(f"Pedido '{input_data.order_id}' no encontrado")

        # 2. Validar que el nuevo estado es reconocido
        transition = VALID_TRANSITIONS.get(input_data.new_status)
        if transition is None:
            valid = ", ".join(VALID_TRANSITIONS.keys())
            raise ValueError(
                f"Estado '{input_data.new_status}' no válido. "
                f"Estados permitidos: {valid}"
            )

        method_name, target_status = transition

        # 3. Ejecutar la transición en la entidad
        #    Si el estado actual no permite esta transición, la entidad
        #    lanza ValueError — lo dejamos propagarse hacia la vista.
        try:
            getattr(order, method_name)()
        except ValueError as e:
            # Re-lanzar con contexto: "No se puede pasar de X a Y"
            raise ValueError(
                f"Transición inválida: el pedido está en estado "
                f"'{order.status.value}' y no puede pasar a '{input_data.new_status}'. "
                f"Detalle: {e}"
            )

        # 4. Persistir
        self.order_repo.save(order)

        # 5. Notificación push (no bloquea si falla)
        notification_sent = False
        try:
            msg = NOTIFICATION_MESSAGES.get(target_status, {})
            if msg:
                notification_sent = self.notification_service.send_order_status_update(
                    user_id=order.user_id,
                    order_id=order.id,
                    new_status=target_status.value,
                    pickup_code=order.pickup_code,
                )
        except Exception as exc:
            # Las notificaciones no deben romper el flujo principal
            print(f"[NOTIF ERROR] No se pudo enviar notificación: {exc}")

        return UpdateOrderStatusOutput(
            order_id=order.id,
            status=order.status.value,
            notification_sent=notification_sent,
        )