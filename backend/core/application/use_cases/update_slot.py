from dataclasses import dataclass
from typing import Optional
from datetime import time as TimeType
from core.domain.entities.timeslot import TimeSlot
from core.domain.ports.timeslot_repository import TimeSlotRepository


@dataclass
class UpdateSlotInput:
    slot_id: str
    max_orders: Optional[int] = None
    is_active: Optional[bool] = None
    start_time: Optional[str] = None   # formato "HH:MM"
    end_time: Optional[str] = None     # formato "HH:MM"


@dataclass
class UpdateSlotOutput:
    slot: TimeSlot


class UpdateSlotUseCase:

    def __init__(self, slot_repo: TimeSlotRepository):
        self.slot_repo = slot_repo

    def execute(self, input_data: UpdateSlotInput) -> UpdateSlotOutput:
        slot = self.slot_repo.find_by_id(input_data.slot_id)
        if slot is None:
            raise ValueError(f"Franja horaria '{input_data.slot_id}' no encontrada")

        # Aplicar solo los campos enviados (PATCH semántico)
        if input_data.max_orders is not None:
            if input_data.max_orders < 1:
                raise ValueError("El límite de pedidos debe ser al menos 1")
            slot.max_orders = input_data.max_orders

        if input_data.is_active is not None:
            slot.is_active = input_data.is_active
            # Si se desactiva, se cierra para nuevos pedidos
            if not input_data.is_active:
                slot.close()

        if input_data.start_time is not None:
            h, m = map(int, input_data.start_time.split(":"))
            slot.start_time = TimeType(h, m)

        if input_data.end_time is not None:
            h, m = map(int, input_data.end_time.split(":"))
            slot.end_time = TimeType(h, m)

        saved = self.slot_repo.save(slot)
        return UpdateSlotOutput(slot=saved)