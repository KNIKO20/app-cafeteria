# NOTA sobre increment_orders():
#   Usa update_one con $inc para garantizar atomicidad.
#   Esto evita race conditions cuando dos alumnos piden en la misma franja
#   al mismo tiempo (sin usar transacciones distribuidas).
 
import uuid
from datetime import time as TimeType
from typing import List, Optional
 
from mongoengine import connection
from pymongo import ReturnDocument
 
from core.domain.entities.timeslot import TimeSlot
from core.domain.ports.timeslot_repository import TimeSlotRepository
from adapters.persistence.models.timeslots_model import TimeSlotDocument
 
def _str_to_time(s: str) -> TimeType:
    """Convierte "HH:MM" → datetime.time"""
    h, m = map(int, s.split(":"))
    return TimeType(h, m)
 
 
def _time_to_str(t: TimeType) -> str:
    """Convierte datetime.time → "HH:MM" """
    return t.strftime("%H:%M")
 
 
class MongoTimeSlotRepository(TimeSlotRepository):
 
    def find_all(self) -> List[TimeSlot]:
        docs = TimeSlotDocument.objects().order_by('start_time')
        return [self._to_entity(d) for d in docs]
 
    def find_active(self) -> List[TimeSlot]:
        docs = TimeSlotDocument.objects(is_active=True).order_by('start_time')
        return [self._to_entity(d) for d in docs]
 
    def find_by_id(self, slot_id: str) -> Optional[TimeSlot]:
        doc = TimeSlotDocument.objects(slot_id=slot_id).first()
        return self._to_entity(doc) if doc else None
 
    def save(self, slot: TimeSlot) -> TimeSlot:
        doc = TimeSlotDocument.objects(slot_id=slot.id).first()
        if doc is None:
            doc = TimeSlotDocument(slot_id=slot.id)
 
        doc.start_time     = _time_to_str(slot.start_time)
        doc.end_time       = _time_to_str(slot.end_time)
        doc.max_orders     = slot.max_orders
        doc.current_orders = slot.current_orders
        doc.is_active      = slot.is_active
        doc.save()
 
        return slot
 
    def increment_orders(self, slot_id: str) -> None:
        """
        Operación atómica $inc — evita race conditions.
        Si la franja no existe, lanza ValueError.
        """
        col = TimeSlotDocument._get_collection()
        result = col.find_one_and_update(
            {"slot_id": slot_id},
            {"$inc": {"current_orders": 1}},
            return_document=ReturnDocument.AFTER,
        )
        if result is None:
            raise ValueError(f"Franja horaria '{slot_id}' no encontrada")
 
    @staticmethod
    def _to_entity(doc: TimeSlotDocument) -> TimeSlot:
        return TimeSlot(
            id=doc.slot_id,
            start_time=_str_to_time(doc.start_time),
            end_time=_str_to_time(doc.end_time),
            max_orders=doc.max_orders,
            current_orders=doc.current_orders,
            is_active=doc.is_active,
        )
DEFAULT_SLOTS = [
    ("10:00", "10:30"),
    ("10:30", "11:00"),
    ("11:00", "11:30"),
    ("11:30", "12:00"),
    ("12:00", "12:30"),
]
 
 
def seed_default_slots(max_orders: int = 20) -> int:
    """
    Inserta las franjas por defecto si la colección está vacía.
    Devuelve el número de franjas creadas (0 si ya existían).
    """
    if TimeSlotDocument.objects.count() > 0:
        return 0
 
    for i, (start, end) in enumerate(DEFAULT_SLOTS, start=1):
        TimeSlotDocument(
            slot_id=f"slot_{i}",
            start_time=start,
            end_time=end,
            max_orders=max_orders,
            current_orders=0,
            is_active=True,
        ).save()
 
    return len(DEFAULT_SLOTS)
 