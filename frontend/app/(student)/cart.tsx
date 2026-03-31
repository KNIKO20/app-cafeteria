import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../../stores/cartStore';
import { createOrder } from '../../services/api';
import TimeslotPicker from '../../components/TimeslotPicker';

export default function CartScreen() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleOrder = async () => {
    if (!selectedSlot) {
      Alert.alert('Selecciona una franja horaria de recogida');
      return;
    }
    
    setLoading(true);
    try {
      const result = await createOrder({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        pickup_timeslot_id: selectedSlot,
        pickup_date: selectedDate!,
      });
      
      clearCart();
      // Navegar a la pantalla de pago con el order_id
      router.push({ pathname: '/(student)/payment', params: { orderId: result.order_id, total: result.total } });
      
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudo crear el pedido');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu pedido</Text>
      
      <FlatList
        data={items}
        keyExtractor={i => i.product_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.product_name}</Text>
            <View style={styles.itemControls}>
              <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity - 1)}>
                <Text style={styles.qtyBtn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => updateQuantity(item.product_id, item.quantity + 1)}>
                <Text style={styles.qtyBtn}>+</Text>
              </TouchableOpacity>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)}€</Text>
            </View>
          </View>
        )}
      />
      
      {/* Selector de franja horaria */}
      <TimeslotPicker
        onSelect={(slotId, date) => { setSelectedSlot(slotId); setSelectedDate(date); }}
      />
      
      {/* Total y botón */}
      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: {total().toFixed(2)}€</Text>
        <TouchableOpacity
          style={[styles.orderBtn, loading && styles.orderBtnDisabled]}
          onPress={handleOrder}
          disabled={loading}
        >
          <Text style={styles.orderBtnText}>
            {loading ? 'Procesando...' : 'Continuar al pago →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemName: { fontSize: 16, flex: 1 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { fontSize: 20, color: '#FF6B35', fontWeight: '700', paddingHorizontal: 8 },
  qty: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  itemPrice: { fontSize: 16, fontWeight: '600', color: '#333', minWidth: 60, textAlign: 'right' },
  footer: { paddingTop: 16, gap: 12 },
  totalText: { fontSize: 20, fontWeight: '700' },
  orderBtn: { backgroundColor: '#FF6B35', padding: 16, borderRadius: 12, alignItems: 'center' },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});