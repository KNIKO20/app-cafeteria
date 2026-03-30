# Gestiona las franjas horarias de recogida.
# Controla cuántos pedidos puede recibir cada franja.

from dataclasses import dataclass
from datetime import time

@dataclass
class TimeSlot:
    id: str
    start_time: time          # Ej: time(10, 30) → 10:30
    end_time: time            # Ej: time(11, 0)  → 11:00
    max_orders: int = 20      # Máximo de pedidos en esta franja
    current_orders: int = 0
    is_open: bool = True
    
    @property
    def label(self) -> str:
        return f"{self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')}"
    
    def has_capacity(self) -> bool:
        """¿Puede aceptar más pedidos?"""
        return self.is_open and self.current_orders < self.max_orders
    
    def reserve_slot(self):
        """Reserva una plaza en esta franja"""
        if not self.has_capacity():
            raise ValueError(f"La franja {self.label} está llena o cerrada")
        self.current_orders += 1
    
    def close(self):
        """El personal cierra esta franja"""
        self.is_open = False