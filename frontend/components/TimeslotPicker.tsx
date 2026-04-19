// components/TimeslotPicker.tsx — Selector de franjas horarias
// Conecta con la API real para mostrar franjas con su capacidad actual.
// Icono sugerido (Ionicons): "time-outline" junto al título

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { getSlots } from '../services/api';
import { C, radius, shadow } from '../theme';

interface SlotData {
  id: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  current_orders?: number;
  is_active: boolean;
}

// Slots de respaldo si la API no responde
const FALLBACK_SLOTS: SlotData[] = [
  { id: 'slot_1', start_time: '10:00', end_time: '10:30', max_orders: 20, current_orders: 0,  is_active: true },
  { id: 'slot_2', start_time: '10:30', end_time: '11:00', max_orders: 20, current_orders: 8,  is_active: true },
  { id: 'slot_3', start_time: '11:00', end_time: '11:30', max_orders: 20, current_orders: 15, is_active: true },
  { id: 'slot_4', start_time: '11:30', end_time: '12:00', max_orders: 20, current_orders: 20, is_active: true },
  { id: 'slot_5', start_time: '12:00', end_time: '12:30', max_orders: 20, current_orders: 4,  is_active: true },
];

interface Props {
  onSelect: (slotId: string, date: string) => void;
}

// ── Tarjeta de una franja ────────────────────────────────────────────
function SlotCard({
  slot, selected, onPress, index,
}: {
  slot: SlotData; selected: boolean; onPress: () => void; index: number;
}) {
  const current  = slot.current_orders ?? 0;
  const full     = current >= slot.max_orders;
  const pct      = Math.min((current / slot.max_orders) * 100, 100);
  const remaining = slot.max_orders - current;

  const capacityColor =
    pct >= 100 ? C.danger :
    pct >= 70  ? C.warning :
    C.mid;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 60, friction: 14, delay: index * 55,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange: [0,1], outputRange: [0.88,1] }) }],
    }}>
      <TouchableOpacity
        style={[
          sc.card,
          selected && sc.cardSelected,
          full && sc.cardFull,
        ]}
        onPress={onPress}
        disabled={full}
        activeOpacity={full ? 1 : 0.8}
      >
        {/* Horas */}
        <Text style={[sc.startTime, selected && sc.textSelected, full && sc.textFull]}>
          {slot.start_time}
        </Text>
        <Text style={[sc.endTime, selected && sc.endSelected, full && sc.textFull]}>
          {slot.end_time}
        </Text>

        {/* Separador */}
        <View style={[sc.separator, selected && sc.separatorSelected]} />

        {/* Barra de capacidad */}
        <View style={sc.capTrack}>
          <View style={[
            sc.capFill,
            {
              width: `${pct}%` as any,
              backgroundColor: selected ? C.accent : capacityColor,
            },
          ]} />
        </View>

        {/* Etiqueta de disponibilidad */}
        <Text style={[
          sc.capLabel,
          selected && { color: 'rgba(255,255,255,0.7)' },
          full && sc.textFull,
        ]}>
          {full ? 'Lleno' : `${remaining} libres`}
        </Text>

        {/* Indicador de selección */}
        {selected && <View style={sc.selectedDot} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: {
    width: 90, paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: C.white,
    borderWidth: 2, borderColor: C.subtle,
    alignItems: 'center', gap: 4,
    ...shadow.card,
  },
  cardSelected: {
    backgroundColor: C.dark,
    borderColor: C.dark,
  },
  cardFull: {
    backgroundColor: C.subtle,
    borderColor: C.subtle,
    opacity: 0.55,
  },
  startTime: {
    fontSize: 17, fontWeight: '900', color: C.dark, letterSpacing: -0.3,
  },
  endTime: {
    fontSize: 12, fontWeight: '600', color: C.muted,
  },
  endSelected: { color: 'rgba(255,255,255,0.55)' },
  textSelected: { color: C.white },
  textFull: { color: C.muted },

  separator: {
    width: 24, height: 1.5,
    backgroundColor: C.subtle, borderRadius: 1,
    marginVertical: 2,
  },
  separatorSelected: { backgroundColor: 'rgba(255,255,255,0.15)' },

  capTrack: {
    width: '100%', height: 3,
    backgroundColor: C.subtle,
    borderRadius: 2, overflow: 'hidden',
  },
  capFill: { height: '100%', borderRadius: 2 },

  capLabel: {
    fontSize: 9, fontWeight: '800',
    color: C.muted, letterSpacing: 0.3,
    marginTop: 2,
  },

  // Punto verde cuando está seleccionado
  selectedDot: {
    position: 'absolute', top: 8, right: 8,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.accent,
  },
});

// ── Componente principal ─────────────────────────────────────────────
export default function TimeslotPicker({ onSelect }: Props) {
  const [slots, setSlots]       = useState<SlotData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    getSlots()
      .then(data => setSlots(data.filter((s: SlotData) => s.is_active)))
      .catch(() => setSlots(FALLBACK_SLOTS))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (slot: SlotData) => {
    const full = (slot.current_orders ?? 0) >= slot.max_orders;
    if (full) return;
    setSelected(slot.id);
    onSelect(slot.id, today);
  };

  return (
    <View style={tp.wrap}>
      {/* Título — Ionicons "time-outline" antes del texto */}
      <View style={tp.titleRow}>
        {/* Reloj dibujado con Views */}
        <View style={tp.clockIcon}>
          <View style={tp.clockFace} />
          <View style={tp.clockHandH} />
          <View style={tp.clockHandM} />
        </View>
        <View>
          <Text style={tp.title}>Franja de recogida</Text>
          <Text style={tp.sub}>¿A qué hora pasas a recoger?</Text>
        </View>
      </View>

      {loading ? (
        <View style={tp.loadRow}>
          <ActivityIndicator size="small" color={C.mid} />
          <Text style={tp.loadText}>Cargando horarios disponibles...</Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={s => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tp.list}
          renderItem={({ item, index }) => (
            <SlotCard
              slot={item}
              index={index}
              selected={selected === item.id}
              onPress={() => handleSelect(item)}
            />
          )}
        />
      )}

      {/* Confirmación de selección */}
      {selected && !loading && (
        <View style={tp.selectionConfirm}>
          <View style={tp.confirmDot} />
          <Text style={tp.confirmText}>
            Recogida a las{' '}
            <Text style={tp.confirmBold}>
              {slots.find(s => s.id === selected)?.start_time}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const tp = StyleSheet.create({
  wrap: { marginVertical: 16 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },

  // Ícono de reloj hecho con Views (usar Ionicons "time-outline" como alternativa)
  clockIcon: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: C.mid,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  clockFace: {
    position: 'absolute',
    width: '100%', height: '100%', borderRadius: 14,
  },
  clockHandH: {
    position: 'absolute',
    width: 1.5, height: 7,
    backgroundColor: C.mid, borderRadius: 1,
    bottom: '50%', left: '50%',
    transformOrigin: 'bottom',
    transform: [{ translateX: -0.75 }, { rotate: '-30deg' }],
  } as any,
  clockHandM: {
    position: 'absolute',
    width: 1.5, height: 9,
    backgroundColor: C.mid, borderRadius: 1,
    bottom: '50%', left: '50%',
    transform: [{ translateX: -0.75 }, { rotate: '60deg' }],
  } as any,

  title: { fontSize: 15, fontWeight: '800', color: C.dark, letterSpacing: -0.2 },
  sub:   { fontSize: 12, color: C.muted, fontWeight: '500', marginTop: 1 },

  loadRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 16,
  },
  loadText: { fontSize: 13, color: C.muted },

  list: { gap: 8, paddingVertical: 4, paddingHorizontal: 2 },

  // Confirmación visual de slot seleccionado
  selectionConfirm: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginTop: 10,
    backgroundColor: C.successBg,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  confirmDot: {
    width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.mid,
  },
  confirmText: { fontSize: 13, color: C.success, fontWeight: '600' },
  confirmBold: { fontWeight: '900' },
});