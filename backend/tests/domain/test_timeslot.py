# Tests para la entidad TimeSlot y sus reglas de negocio.

import unittest
import sys
import os
from datetime import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from core.domain.entities.timeslot import TimeSlot


class TestTimeSlot(unittest.TestCase):
    """Tests de la entidad TimeSlot."""

    def _make_timeslot(self, **overrides) -> TimeSlot:
        """Helper: crea un timeslot con valores por defecto."""
        defaults = {
            "id": "ts-1",
            "start_time": time(10, 30),
            "end_time": time(11, 0),
            "max_orders": 20,
            "current_orders": 0,
            "is_open": True,
        }
        defaults.update(overrides)
        return TimeSlot(**defaults)

    # ── label ───────────────────────────────────────────────

    def test_label_format(self):
        """El label muestra el rango en formato HH:MM-HH:MM."""
        ts = self._make_timeslot()
        self.assertEqual(ts.label, "10:30-11:00")

    def test_label_different_times(self):
        """El label con otros horarios."""
        ts = self._make_timeslot(start_time=time(8, 0), end_time=time(8, 30))
        self.assertEqual(ts.label, "08:00-08:30")

    # ── has_capacity ────────────────────────────────────────

    def test_has_capacity_empty(self):
        """Franja vacía y abierta → tiene capacidad."""
        ts = self._make_timeslot(current_orders=0, max_orders=20)
        self.assertTrue(ts.has_capacity())

    def test_has_capacity_partial(self):
        """Franja parcialmente llena → tiene capacidad."""
        ts = self._make_timeslot(current_orders=10, max_orders=20)
        self.assertTrue(ts.has_capacity())

    def test_has_capacity_full(self):
        """Franja llena → NO tiene capacidad."""
        ts = self._make_timeslot(current_orders=20, max_orders=20)
        self.assertFalse(ts.has_capacity())

    def test_has_capacity_closed(self):
        """Franja cerrada → NO tiene capacidad incluso con plazas."""
        ts = self._make_timeslot(current_orders=0, is_open=False)
        self.assertFalse(ts.has_capacity())

    # ── reserve_slot ────────────────────────────────────────

    def test_reserve_slot(self):
        """Reservar incrementa current_orders en 1."""
        ts = self._make_timeslot(current_orders=5)
        ts.reserve_slot()
        self.assertEqual(ts.current_orders, 6)

    def test_reserve_slot_multiple(self):
        """Múltiples reservas incrementan correctamente."""
        ts = self._make_timeslot(current_orders=0)
        ts.reserve_slot()
        ts.reserve_slot()
        ts.reserve_slot()
        self.assertEqual(ts.current_orders, 3)

    def test_reserve_slot_full(self):
        """Error al reservar una franja llena."""
        ts = self._make_timeslot(current_orders=20, max_orders=20)
        with self.assertRaises(ValueError):
            ts.reserve_slot()

    def test_reserve_slot_closed(self):
        """Error al reservar una franja cerrada."""
        ts = self._make_timeslot(is_open=False)
        with self.assertRaises(ValueError):
            ts.reserve_slot()

    # ── close ───────────────────────────────────────────────

    def test_close(self):
        """Cerrar una franja → is_open = False."""
        ts = self._make_timeslot(is_open=True)
        ts.close()
        self.assertFalse(ts.is_open)

    def test_close_already_closed(self):
        """Cerrar una franja ya cerrada no da error."""
        ts = self._make_timeslot(is_open=False)
        ts.close()
        self.assertFalse(ts.is_open)


if __name__ == '__main__':
    unittest.main()
