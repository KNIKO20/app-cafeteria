from dataclasses import dataclass
from core.domain.ports.cafeteria_settings_repository import CafeteriaSettingsRepository


@dataclass
class ToggleCafeteriaStatusInput:
    is_open: bool
    changed_by: str = ""    # email del admin — para auditoría


@dataclass
class ToggleCafeteriaStatusOutput:
    is_open: bool
    last_changed_by: str
    message: str


class ToggleCafeteriaStatusUseCase:

    def __init__(self, settings_repo: CafeteriaSettingsRepository):
        self.settings_repo = settings_repo

    def execute(self, input_data: ToggleCafeteriaStatusInput) -> ToggleCafeteriaStatusOutput:
        settings = self.settings_repo.get()

        if input_data.is_open:
            settings.open(changed_by=input_data.changed_by)
            msg = "Cafetería abierta para nuevos pedidos"
        else:
            settings.close(changed_by=input_data.changed_by)
            msg = "Cafetería cerrada. No se aceptan nuevos pedidos"

        self.settings_repo.save(settings)

        return ToggleCafeteriaStatusOutput(
            is_open=settings.is_open,
            last_changed_by=settings.last_changed_by,
            message=msg,
        )