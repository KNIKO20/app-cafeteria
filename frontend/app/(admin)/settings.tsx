import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Alert, Modal, Animated, Pressable, ActivityIndicator
} from 'react-native';
import { getSlots, updateSlot } from '../../services/api';
import { C, radius, shadow } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  current_orders?: number;
  is_active: boolean;
}

// ── Barra de ocupación ───────────────────────────────────────────────
function OccupancyBar({ current = 0, max }: { current?: number; max: number }) {
  const pct   = Math.min((current / max) * 100, 100);
  const color = pct > 80 ? C.danger : pct > 50 ? C.warning : C.mid;

  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={ob.wrap}>
      <View style={ob.track}>
        <Animated.View
          style={[ob.fill, {
            backgroundColor: color,
            width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }]}
        />
      </View>
      <Text style={[ob.label, { color }]}>{current}/{max}</Text>
    </View>
  );
}

const ob = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  track: { flex: 1, height: 5, backgroundColor: C.subtle, borderRadius: 3, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '800', minWidth: 40, textAlign: 'right' },
});

// ── Modal de edición ─────────────────────────────────────────────────
interface EditModalProps {
  slot: TimeSlot | null;
  visible: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<TimeSlot>) => Promise<void>;
}

function EditSlotModal({ slot, visible, onClose, onSave }: EditModalProps) {
  const [maxOrders, setMaxOrders] = useState('');
  const [isActive, setIsActive]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (slot) { setMaxOrders(String(slot.max_orders)); setIsActive(slot.is_active); }
  }, [slot]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 300,
      useNativeDriver: true, tension: 70, friction: 14,
    }).start();
  }, [visible]);

  const handleSave = async () => {
    const max = parseInt(maxOrders, 10);
    if (isNaN(max) || max < 1) { Alert.alert('Error', 'El límite debe ser un número mayor que 0.'); return; }
    setSaving(true);
    try { await onSave(slot!.id, { max_orders: max, is_active: isActive }); onClose(); }
    catch { Alert.alert('Error', 'No se pudo guardar.'); }
    finally { setSaving(false); }
  };

  if (!slot) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={em.backdrop} onPress={onClose}>
        <Animated.View
          style={[em.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <Pressable>
            <View style={em.handle} />

            <View style={em.headerRow}>
               <Ionicons name="time-outline" size={18} color={C.muted} />
               <Text style={em.label}>EDITAR FRANJA</Text>
            </View>
            <Text style={em.timeDisplay}>{slot.start_time} – {slot.end_time}</Text>

            <Text style={em.fieldLabel}>Límite de pedidos</Text>
            <View style={em.inputRow}>
              <TouchableOpacity
                style={em.stepper}
                onPress={() => setMaxOrders(v => String(Math.max(1, parseInt(v || '1') - 1)))}
              >
                <Ionicons name="remove-outline" size={24} color={C.dark} />
              </TouchableOpacity>
              <TextInput
                style={em.input}
                value={maxOrders}
                onChangeText={setMaxOrders}
                keyboardType="numeric"
                maxLength={3}
                textAlign="center"
              />
              <TouchableOpacity
                style={em.stepper}
                onPress={() => setMaxOrders(v => String(parseInt(v || '0') + 1))}
              >
                <Ionicons name="add-outline" size={24} color={C.dark} />
              </TouchableOpacity>
            </View>

            <View style={em.toggleRow}>
              <View>
                <Text style={em.fieldLabel}>Estado de la franja</Text>
                <Text style={em.toggleSub}>
                  {isActive ? 'Visible para los alumnos' : 'Oculta para los alumnos'}
                </Text>
              </View>
              <TouchableOpacity
                style={[em.togglePill, isActive ? em.pillOn : em.pillOff]}
                onPress={() => setIsActive(v => !v)}
              >
                <Animated.View style={[em.pillThumb, isActive ? em.thumbRight : em.thumbLeft]} />
              </TouchableOpacity>
            </View>

            <View style={em.actions}>
              <TouchableOpacity style={em.cancelBtn} onPress={onClose}>
                <Text style={em.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[em.saveBtn, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={em.saveText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const em = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(26,51,41,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.light, alignSelf: 'center', marginBottom: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  label: { fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 2 },
  timeDisplay: { fontSize: 34, fontWeight: '900', color: C.dark, letterSpacing: -1, marginBottom: 24 },
  fieldLabel: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  stepper: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: C.bg, borderRadius: radius.md,
    padding: 12, fontSize: 24, fontWeight: '900', color: C.dark,
    borderWidth: 2, borderColor: C.light,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 28,
  },
  toggleSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  togglePill: {
    width: 52, height: 28, borderRadius: 14, padding: 3,
    justifyContent: 'center',
  },
  pillOn:  { backgroundColor: C.mid },
  pillOff: { backgroundColor: C.subtle },
  pillThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.white,
    ...shadow.card,
  },
  thumbRight: { alignSelf: 'flex-end' },
  thumbLeft:  { alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: radius.md,
    backgroundColor: C.subtle, alignItems: 'center',
  },
  cancelText: { fontWeight: '700', color: C.muted, fontSize: 14 },
  saveBtn: {
    flex: 2, padding: 14, borderRadius: radius.md,
    backgroundColor: C.dark, alignItems: 'center',
  },
  saveText: { fontWeight: '800', color: C.white, fontSize: 14 },
});

// ── Tarjeta de franja ────────────────────────────────────────────────
function SlotCard({ item, index, onPress }: { item: TimeSlot; index: number; onPress: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 50, friction: 12, delay: index * 60,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [16,0] }) }],
    }}>
      <TouchableOpacity style={sc2.card} onPress={onPress} activeOpacity={0.8}>
        <View style={[sc2.statusStripe, { backgroundColor: item.is_active ? C.mid : C.subtle }]} />

        <View style={sc2.content}>
          <View style={sc2.topRow}>
            <View>
              <Text style={sc2.timeText}>{item.start_time} – {item.end_time}</Text>
              <Text style={sc2.limitText}>Límite: {item.max_orders} pedidos</Text>
            </View>
            <View style={[sc2.badge, item.is_active ? sc2.badgeActive : sc2.badgeInactive]}>
              <Ionicons 
                name={item.is_active ? "checkmark-circle-outline" : "close-circle-outline"} 
                size={14} 
                color={item.is_active ? C.mid : C.muted} 
              />
              <Text style={[sc2.badgeText, { color: item.is_active ? C.mid : C.muted }]}>
                {item.is_active ? 'Activa' : 'Inactiva'}
              </Text>
            </View>
          </View>

          <OccupancyBar current={item.current_orders} max={item.max_orders} />

          <View style={sc2.footer}>
            <Ionicons name="pencil-outline" size={12} color={C.muted} />
            <Text style={sc2.editHint}>Toca para editar</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const sc2 = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: C.white,
    borderRadius: radius.md, marginBottom: 10,
    overflow: 'hidden', ...shadow.card,
  },
  statusStripe: { width: 5 },
  content: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  timeText: { fontSize: 20, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  limitText: { fontSize: 12, color: C.muted, marginTop: 2, fontWeight: '500' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  badgeActive:   { backgroundColor: C.successBg },
  badgeInactive: { backgroundColor: C.subtle },
  badgeText: { fontSize: 11, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 8 },
  editHint: { fontSize: 10, color: C.muted, letterSpacing: 0.3 },
});

// ── Pantalla principal ───────────────────────────────────────────────
export default function SettingsScreen() {
  const [slots, setSlots]             = useState<TimeSlot[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { loadSlots(); }, []);

  const loadSlots = async () => {
    setLoading(true);
    try { const data = await getSlots(); setSlots(data); }
    catch { Alert.alert('Error', 'No se pudieron cargar las franjas horarias.'); }
    finally { setLoading(false); }
  };

  const handleSave = async (id: string, data: Partial<TimeSlot>) => {
    await updateSlot(id, data);
    await loadSlots();
  };

  const openEdit = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setModalVisible(true);
  };

  return (
    <View style={ps.root}>
      <View style={ps.subHeader}>
        <Text style={ps.pageLabel}>CONFIGURACIÓN</Text>
        <Text style={ps.pageTitle}>Franjas Horarias</Text>
        <Text style={ps.pageSub}>
          Define límites de capacidad y activa o desactiva tramos.
        </Text>
      </View>

      {loading ? (
        <View style={ps.loading}>
          <ActivityIndicator size="large" color={C.mid} />
          <Text style={ps.loadingText}>Cargando franjas...</Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={s => s.id}
          renderItem={({ item, index }) => (
            <SlotCard item={item} index={index} onPress={() => openEdit(item)} />
          )}
          contentContainerStyle={ps.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={ps.loading}>
               <Ionicons name="calendar-outline" size={48} color={C.subtle} />
              <Text style={ps.loadingText}>No hay franjas configuradas.</Text>
            </View>
          }
        />
      )}

      <EditSlotModal
        slot={editingSlot}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}
const ps = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  subHeader: {
    backgroundColor: C.white, paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: C.subtle,
  },
  pageLabel: { fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 2, marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  pageSub: { fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 18 },
  list: { padding: 16, paddingBottom: 40 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  loadingDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.mid },
  loadingText: { fontSize: 14, color: C.muted },
});