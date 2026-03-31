import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

// Timeslots provisionales (puedes cambiarlos luego)
const TIMESLOTS = [
  { id: 'slot_1', label: '10:00 - 10:30' },
  { id: 'slot_2', label: '10:30 - 11:00' },
  { id: 'slot_3', label: '11:00 - 11:30' },
  { id: 'slot_4', label: '11:30 - 12:00' },
  { id: 'slot_5', label: '12:00 - 12:30' },
];

interface Props {
  onSelect: (slotId: string, date: string) => void;
}

export default function TimeslotPicker({ onSelect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  // Fecha provisional: hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const handleSelect = (slotId: string) => {
    setSelected(slotId);
    onSelect(slotId, today);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una franja horaria</Text>

      <FlatList
        data={TIMESLOTS}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.slot,
              selected === item.id && styles.slotActive
            ]}
            onPress={() => handleSelect(item.id)}
          >
            <Text style={selected === item.id ? styles.slotTextActive : styles.slotText}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 24 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  slot: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 12,
    marginRight: 10,
  },
  slotActive: {
    backgroundColor: '#FF6B35',
  },
  slotText: {
    color: '#333',
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
