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

  // ── Validaciones antes de pagar ──────────────────────────────────
  const handleOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Añade al menos un producto antes de continuar.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Franja horaria requerida', 'Selecciona a qué hora quieres recoger tu pedido.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Fecha requerida', 'Selecciona la fecha de recogida.');
      return;
    }

    setLoading(true);
    try {
      const result = await createOrder({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        pickup_timeslot_id: selectedSlot,
        pickup_date: selectedDate,
      });

      clearCart();

      // Navegación a pago con orderId y total
      router.push({
        pathname: '/payment',
        params: {
          orderId: result.order_id,
          total: String(result.total),
        },
      });
    } catch (error: any) {
      const msg = error.response?.data?.error || 'No se pudo crear el pedido. Inténtalo de nuevo.';
      Alert.alert('Error al crear pedido', msg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛒</Text>
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Añade productos desde el menú</Text>
        <TouchableOpacity style={styles.goMenuBtn} onPress={() => router.push('/')}>
          <Text style={styles.goMenuText}>Ver menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu pedido</Text>

      <FlatList
        data={items}
        keyExtractor={i => i.product_id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <Text style={styles.itemUnitPrice}>{item.price.toFixed(2)}€ / ud</Text>
            </View>
            <View style={styles.itemControls}>
              <TouchableOpacity
                style={styles.qtyBtnWrap}
                onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
              >
                <Text style={styles.qtyBtn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtnWrap}
                onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
              >
                <Text style={styles.qtyBtn}>+</Text>
              </TouchableOpacity>
              <Text style={styles.itemPrice}>{(item.price * item.quantity).toFixed(2)}€</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          /* Selector de franja horaria */
          <TimeslotPicker
            onSelect={(slotId, date) => { setSelectedSlot(slotId); setSelectedDate(date); }}
          />
        }
      />

      {/* Footer: total + botón */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{total().toFixed(2)}€</Text>
        </View>

        {selectedSlot && (
          <View style={styles.slotConfirm}>
            <Text style={styles.slotConfirmText}>✅ Recogida seleccionada</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.orderBtn, (loading || !selectedSlot) && styles.orderBtnDisabled]}
          onPress={handleOrder}
          disabled={loading || !selectedSlot}
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
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyEmoji: { fontSize: 60 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  emptySubtitle: { fontSize: 15, color: '#aaa' },
  goMenuBtn: { marginTop: 8, backgroundColor: '#FF6B35', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  goMenuText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16, color: '#1a1a2e' },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#333' },
  itemUnitPrice: { fontSize: 12, color: '#aaa', marginTop: 2 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtnWrap: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF0EB', alignItems: 'center', justifyContent: 'center',
  },
  qtyBtn: { fontSize: 18, color: '#FF6B35', fontWeight: '700', lineHeight: 20 },
  qty: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center', color: '#1a1a2e' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#333', minWidth: 56, textAlign: 'right' },
  footer: { paddingTop: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 16, color: '#666', fontWeight: '600' },
  totalAmount: { fontSize: 26, fontWeight: '900', color: '#FF6B35' },
  slotConfirm: {
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  slotConfirmText: { color: '#166534', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  orderBtn: { backgroundColor: '#FF6B35', padding: 16, borderRadius: 14, alignItems: 'center' },
  orderBtnDisabled: { opacity: 0.45 },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
