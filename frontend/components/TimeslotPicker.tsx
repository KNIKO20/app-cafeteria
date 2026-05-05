import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { getSlots } from '../services/api';
import { C, radius, shadow } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface SlotData {
  id: string;
  start_time: string;
  end_time: string;
  max_orders: number;
  current_orders?: number;
  is_active: boolean;
}

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

function SlotCard({
  slot, selected, onPress, index,
}: {
  slot: SlotData; selected: boolean; onPress: () => void; index: number;
}) {
  const current   = slot.current_orders ?? 0;
  const full      = current >= slot.max_orders;
  const pct       = Math.min((current / slot.max_orders) * 100, 100);
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
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
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
        <Text style={[sc.startTime, selected && sc.textSelected, full && sc.textFull]}>
          {slot.start_time}
        </Text>
        <Text style={[sc.endTime, selected && sc.endSelected, full && sc.textFull]}>
          {slot.end_time}
        </Text>

        <View style={[sc.separator, selected && sc.separatorSelected]} />

        <View style={sc.capTrack}>
          <View style={[
            sc.capFill,
            {
              width: `${pct}%` as any,
              backgroundColor: selected ? C.accent : capacityColor,
            },
          ]} />
        </View>

        <Text style={[
          sc.capLabel,
          selected && { color: 'rgba(255,255,255,0.7)' },
          full && sc.textFull,
        ]}>
          {full ? 'Lleno' : `${remaining} libres`}
        </Text>

        {selected && (
          <View style={sc.selectedCheck}>
            <Ionicons name="checkmark-circle" size={16} color={C.accent} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: {
    width: 95, paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: radius.md, backgroundColor: C.white,
    borderWidth: 2, borderColor: C.subtle,
    alignItems: 'center', gap: 4, ...shadow.card,
  },
  cardSelected: { backgroundColor: C.dark, borderColor: C.dark },
  cardFull: { backgroundColor: C.subtle, borderColor: C.subtle, opacity: 0.55 },
  startTime: { fontSize: 17, fontWeight: '900', color: C.dark, letterSpacing: -0.3 },
  endTime: { fontSize: 12, fontWeight: '600', color: C.muted },
  endSelected: { color: 'rgba(255,255,255,0.55)' },
  textSelected: { color: C.white },
  textFull: { color: C.muted },
  separator: { width: 24, height: 1.5, backgroundColor: C.subtle, marginVertical: 2 },
  separatorSelected: { backgroundColor: 'rgba(255,255,255,0.15)' },
  capTrack: { width: '100%', height: 3, backgroundColor: C.subtle, borderRadius: 2, overflow: 'hidden' },
  capFill: { height: '100%', borderRadius: 2 },
  capLabel: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 0.3, marginTop: 2 },
  selectedCheck: { position: 'absolute', top: -6, right: -6, backgroundColor: C.dark, borderRadius: 10 },
});

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
    if ((slot.current_orders ?? 0) >= slot.max_orders) return;
    setSelected(slot.id);
    onSelect(slot.id, today);
  };

  return (
    <View style={tp.wrap}>
      <View style={tp.titleRow}>
        <View style={tp.iconBox}>
          <Ionicons name="time-outline" size={22} color={C.mid} />
        </View>
        <View>
          <Text style={tp.title}>Franja de recogida</Text>
          <Text style={tp.sub}>¿A qué hora pasas a recoger?</Text>
        </View>
      </View>

      {loading ? (
        <View style={tp.loadRow}>
          <ActivityIndicator size="small" color={C.mid} />
          <Text style={tp.loadText}>Consultando horarios...</Text>
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

      {selected && !loading && (
        <View style={tp.selectionConfirm}>
          <Ionicons name="notifications-outline" size={16} color={C.mid} style={{ marginRight: 6 }} />
          <Text style={tp.confirmText}>
            Recogida confirmada a las{' '}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBox: { 
    width: 38, height: 38, borderRadius: 10, 
    backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' 
  },
  title: { fontSize: 16, fontWeight: '800', color: C.dark },
  sub:   { fontSize: 12, color: C.muted, fontWeight: '500' },
  loadRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 20 },
  loadText: { fontSize: 13, color: C.muted },
  list: { gap: 12, paddingVertical: 8, paddingHorizontal: 4 },
  selectionConfirm: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, backgroundColor: C.successBg,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: radius.md, alignSelf: 'flex-start',
  },
  confirmText: { fontSize: 13, color: C.success, fontWeight: '600' },
  confirmBold: { fontWeight: '900' },
});