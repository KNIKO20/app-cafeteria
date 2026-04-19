from typing import List
from core.domain.entities.timeslot import TimeSlot
from core.domain.ports.timeslot_repository import TimeSlotRepository


class GetSlotsUseCase:

    def __init__(self, slot_repo: TimeSlotRepository):
        self.slot_repo = slot_repo

    def execute(self, active_only: bool = False) -> List[TimeSlot]:
        """
        active_only=True  → frontend del alumno (solo franjas disponibles)
        active_only=False → panel admin (todas, para poder editarlas)
        """
        if active_only:
            return self.slot_repo.find_active()
        return self.slot_repo.find_all()


