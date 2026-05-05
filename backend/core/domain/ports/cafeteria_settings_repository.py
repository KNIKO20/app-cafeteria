

from abc import ABC, abstractmethod
from core.domain.entities.cafeteria_settings import CafeteriaSettings


class CafeteriaSettingsRepository(ABC):

    @abstractmethod
    def get(self) -> CafeteriaSettings:
        """
        Obtiene la configuración actual.
        Si no existe en la BD, crea el singleton con valores por defecto.
        """
        pass

    @abstractmethod
    def save(self, settings: CafeteriaSettings) -> CafeteriaSettings:
        """Guarda (upsert) la configuración."""
        pass