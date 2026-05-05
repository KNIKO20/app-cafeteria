
from abc import ABC, abstractmethod


class NotificationService(ABC):

    @abstractmethod
    def send_order_status_update(
        self,
        user_id: str,           # email o ID del usuario destinatario
        order_id: str,
        new_status: str,        # valor del enum OrderStatus (ej: "ready")
        pickup_code: str | None = None,
    ) -> bool:
        """
        Envía una notificación push al alumno cuando cambia el estado
        de su pedido. Devuelve True si se envió correctamente.
        """
        pass

    @abstractmethod
    def send_cafeteria_closing_soon(
        self,
        minutes_remaining: int,
    ) -> bool:
        """
        Notificación broadcast: la cafetería cerrará en X minutos.
        (Para uso futuro desde un task scheduler.)
        """
        pass