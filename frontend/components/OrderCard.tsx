import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OrderItem {
  product_name: string;
  quantity: number;
}

interface OrderProps {
  order: {
    id: string;
    total: number;
    status: string;
    pickup_code: string | null;
    items: OrderItem[];
    created_at: string;
  };
}

export default function OrderCard({ order }: OrderProps) {
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'preparing': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'ready': return { bg: '#fff3e0', text: '#ef6c00' };
      default: return { bg: '#f5f5f5', text: '#616161' };
    }
  };

  const statusStyle = getStatusStyle(order.status);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Pedido #{order.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.badgeText, { color: statusStyle.text }]}>
            {order.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.itemsContainer}>
        {order.items.map((item, index) => (
          <Text key={index} style={styles.itemText}>
            {item.quantity}x {item.product_name}
          </Text>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.total}>{order.total}€</Text>
        {order.pickup_code && (
          <View style={styles.pickupBox}>
            <Text style={styles.pickupLabel}>RECOGIDA</Text>
            <Text style={styles.pickupCode}>{order.pickup_code}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontWeight: '700', color: '#1a1a2e', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  itemsContainer: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10, marginBottom: 10 },
  itemText: { fontSize: 14, color: '#555', marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { fontSize: 18, fontWeight: '800', color: '#FF6B35' },
  pickupBox: { alignItems: 'center', backgroundColor: '#f8f9fa', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  pickupLabel: { fontSize: 9, color: '#999', fontWeight: '700' },
  pickupCode: { fontSize: 18, fontWeight: '900', color: '#1a1a2e' }
});