# core/domain/ports/timeslot_repository.py
#
# ¿QUÉ ES?
# Puerto (contrato abstracto) para acceder a las franjas horarias.
# El dominio solo conoce esta interfaz — jamás importa Mongoengine.
#
# Implementaciones concretas viven en adapters/persistence/repositories/.

from abc import ABC, abstractmethod
from typing import List, Optional
from core.domain.entities.timeslot import TimeSlot


class TimeSlotRepository(ABC):

    @abstractmethod
    def find_all(self) -> List[TimeSlot]:
        """Devuelve todas las franjas (activas e inactivas)."""
        pass

    @abstractmethod
    def find_active(self) -> List[TimeSlot]:
        """Solo las franjas activas — usadas al crear pedidos."""
        pass

    @abstractmethod
    def find_by_id(self, slot_id: str) -> Optional[TimeSlot]:
        pass

    @abstractmethod
    def save(self, slot: TimeSlot) -> TimeSlot:
        """Crea o actualiza una franja horaria."""
        pass

    @abstractmethod
    def increment_orders(self, slot_id: str) -> None:
        """
        Incrementa current_orders de forma atómica (operación $inc en Mongo).
        Se usa al confirmar un pedido para evitar race conditions.
        """
        pass