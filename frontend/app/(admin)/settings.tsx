// [NEW] Pantalla de administración de franjas horarias y estado del servicio.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, Modal, ScrollView,
} from 'react-native';
import { getSlots, updateSlot } from '../../services/api';

interface TimeSlot {
  id: string;
  start_time: string;   // "10:30"
  end_time: string;     // "11:00"
  max_orders: number;
  current_orders?: number;
  is_active: boolean;
}

// ── Modal para editar franja ─────────────────────────────────────────
interface EditModalProps {
  slot: TimeSlot | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<TimeSlot>) => Promise<void>;
}

function EditSlotModal({ slot, visible, onClose, onSave }: EditModalProps) {
  const [maxOrders, setMaxOrders] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (slot) {
      setMaxOrders(String(slot.max_orders));
      setIsActive(slot.is_active);
    }
  }, [slot]);

  const handleSave = async () => {
    const max = parseInt(maxOrders, 10);
    if (isNaN(max) || max < 1) {
      Alert.alert('Error', 'El límite debe ser un número mayor que 0.');
      return;
    }
    setSaving(true);
    try {
      await onSave(slot!.id, { max_orders: max, is_active: isActive });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la franja horaria.');
    } finally {
      setSaving(false);
    }
  };

  if (!slot) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Editar Franja</Text>
          <Text style={modalStyles.slotTime}>{slot.start_time} — {slot.end_time}</Text>

          <Text style={modalStyles.fieldLabel}>Límite de pedidos</Text>
          <TextInput
            style={modalStyles.input}
            value={maxOrders}
            onChangeText={setMaxOrders}
            keyboardType="numeric"
            maxLength={3}
          />

          {/* Toggle activo */}
          <View style={modalStyles.toggleRow}>
            <Text style={modalStyles.fieldLabel}>Franja activa</Text>
            <TouchableOpacity
              style={[modalStyles.toggleBtn, isActive ? modalStyles.toggleOn : modalStyles.toggleOff]}
              onPress={() => setIsActive(v => !v)}
            >
              <Text style={modalStyles.toggleText}>{isActive ? '✓ Activa' : '✗ Inactiva'}</Text>
            </TouchableOpacity>
          </View>

          <View style={modalStyles.actions}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.saveBtn, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={modalStyles.saveText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  slotTime: { fontSize: 28, fontWeight: '900', color: '#FF6B35', marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14,
    fontSize: 20, fontWeight: '700', color: '#1a1a2e', marginBottom: 16,
  },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toggleOn: { backgroundColor: '#d4edda' },
  toggleOff: { backgroundColor: '#f8d7da' },
  toggleText: { fontWeight: '700', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#f5f5f5', alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: '#666' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#FF6B35', alignItems: 'center' },
  saveText: { fontWeight: '700', color: '#fff', fontSize: 15 },
});

// ── Pantalla principal de configuración ──────────────────────────────
export default function SettingsScreen() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { loadSlots(); }, []);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const data = await getSlots();
      setSlots(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las franjas horarias.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async (id: string, data: Partial<TimeSlot>) => {
    await updateSlot(id, data);
    await loadSlots();
  };

  const openEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setModalVisible(true);
  };

  // ── Ocupación visual ──────────────────────────────────────────────
  const OccupancyBar = ({ current = 0, max }: { current?: number; max: number }) => {
    const pct = Math.min((current / max) * 100, 100);
    const color = pct > 80 ? '#e74c3c' : pct > 50 ? '#f39c12' : '#2ecc71';
    return (
      <View style={occStyles.container}>
        <View style={occStyles.track}>
          <View style={[occStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={occStyles.label}>{current}/{max}</Text>
      </View>
    );
  };

  const occStyles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    track: { flex: 1, height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 3 },
    label: { fontSize: 12, fontWeight: '700', color: '#666', minWidth: 36, textAlign: 'right' },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>Franjas Horarias</Text>
      <Text style={styles.pageSubtitle}>Configura los límites y la disponibilidad de cada tramo</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <Text style={styles.loadingText}>Cargando franjas...</Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={s => s.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.slotCard} onPress={() => openEdit(item)}>
              <View style={styles.slotHeader}>
                <View>
                  <Text style={styles.slotTime}>{item.start_time} — {item.end_time}</Text>
                  <Text style={styles.slotSub}>Límite: {item.max_orders} pedidos</Text>
                </View>
                <View style={[styles.statusBadge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={styles.statusBadgeText}>{item.is_active ? 'Activa' : 'Inactiva'}</Text>
                </View>
              </View>

              <OccupancyBar current={item.current_orders} max={item.max_orders} />

              <Text style={styles.editHint}>Toca para editar →</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>No hay franjas configuradas.</Text>
            </View>
          }
        />
      )}

      <EditSlotModal
        slot={editingSlot}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveSlot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a2e' },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 20, marginTop: 4 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, color: '#aaa' },
  slotCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  slotHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  slotTime: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  slotSub: { fontSize: 13, color: '#aaa', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeActive: { backgroundColor: '#d4edda' },
  badgeInactive: { backgroundColor: '#f8d7da' },
  statusBadgeText: { fontSize: 12, fontWeight: '700' },
  editHint: { fontSize: 11, color: '#ccc', marginTop: 10, textAlign: 'right' },
});
