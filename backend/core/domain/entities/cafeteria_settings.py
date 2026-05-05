 
from dataclasses import dataclass, field
from datetime import datetime
 
 
@dataclass
class CafeteriaSettings:
    # ID fijo (singleton) — siempre el mismo documento en MongoDB
    id: str = "cafeteria_singleton"
 
    is_open: bool = True
 
    # Metadatos de auditoría
    last_changed_by: str = ""           # email del admin que hizo el cambio
    last_changed_at: datetime = field(default_factory=datetime.now)
 
    def open(self, changed_by: str = "") -> None:
        """Abre la cafetería para nuevos pedidos."""
        self.is_open = True
        self.last_changed_by = changed_by
        self.last_changed_at = datetime.now()
 
    def close(self, changed_by: str = "") -> None:
        """Cierra la cafetería. Los pedidos en curso no se ven afectados."""
        self.is_open = False
        self.last_changed_by = changed_by
        self.last_changed_at = datetime.now()
 
    def can_accept_orders(self) -> bool:
        """Punto de consulta único para saber si se aceptan pedidos."""
        return self.is_open