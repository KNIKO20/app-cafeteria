
from datetime import datetime
from core.domain.entities.cafeteria_settings import CafeteriaSettings
from core.domain.ports.cafeteria_settings_repository import CafeteriaSettingsRepository
from adapters.persistence.models.cafeteria_settings_model import CafeteriaSettingsDocument
 
SINGLETON_ID = "cafeteria_singleton"
 
 
class MongoCafeteriaSettingsRepository(CafeteriaSettingsRepository):
 
    def get(self) -> CafeteriaSettings:
        doc = CafeteriaSettingsDocument.objects(settings_id=SINGLETON_ID).first()
 
        # Si la BD está vacía, crear el singleton con valores por defecto
        if doc is None:
            doc = CafeteriaSettingsDocument(
                settings_id=SINGLETON_ID,
                is_open=True,
                last_changed_by="",
                last_changed_at=datetime.now(),
            )
            doc.save()
 
        return self._to_entity(doc)
 
    def save(self, settings: CafeteriaSettings) -> CafeteriaSettings:
        doc = CafeteriaSettingsDocument.objects(settings_id=SINGLETON_ID).first()
        if doc is None:
            doc = CafeteriaSettingsDocument(settings_id=SINGLETON_ID)
 
        doc.is_open         = settings.is_open
        doc.last_changed_by = settings.last_changed_by
        doc.last_changed_at = settings.last_changed_at
        doc.save()
 
        return settings
 
    @staticmethod
    def _to_entity(doc: CafeteriaSettingsDocument) -> CafeteriaSettings:
        return CafeteriaSettings(
            id=doc.settings_id,
            is_open=doc.is_open,
            last_changed_by=doc.last_changed_by or "",
            last_changed_at=doc.last_changed_at or datetime.now(),
        )