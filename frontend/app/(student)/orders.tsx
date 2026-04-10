// Pantalla "Mis Pedidos" — paleta verde, sin emojis, repetir pedido.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { getMyOrders } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';

const C = {
  dark:  '#1E3932',
  mid:   '#00754A',
  light: '#D4E9E2',
  white: '#FFFFFF',
  bg:    '#F2F0EB',
  muted: '#6B8E7F',
};

interface OrderItem { product_id: string; name: string; qty: number; price: number; }
interface Order {
  id: string; created_at: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number; pickup_code?: string; pickup_timeslot?: string; items: OrderItem[];
}

const STATUS: Record<string, { label: string; textColor: string; bg: string }> = {
  pending:   { label: 'Pendiente',  textColor: '#856404', bg: '#fff3cd' },
  paid:      { label: 'Pagado',     textColor: '#155724', bg: C.light   },
  preparing: { label: 'Preparando', textColor: '#0c5460', bg: '#d1ecf1' },
  ready:     { label: 'Listo',      textColor: C.mid,    bg: C.light   },
  delivered: { label: 'Entregado',  textColor: C.muted,  bg: '#f0f0f0' },
  cancelled: { label: 'Cancelado',  textColor: '#721c24', bg: '#f8d7da' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function OrderCard({ order, onRepeat }: { order: Order; onRepeat: () => void }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS[order.status] ?? STATUS.pending;

  return (
    <TouchableOpacity style={s.card} onPress={() => setOpen(v => !v)} activeOpacity={0.85}>
      {/* Cabecera */}
      <View style={s.cardTop}>
        <View>
          <Text style={s.cardDate}>{fmt(order.created_at)}</Text>
          {order.pickup_code
            ? <Text style={s.code}>Código: <Text style={s.codeBold}>{order.pickup_code}</Text></Text>
            : null
          }
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[s.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[s.badgeText, { color: cfg.textColor }]}>{cfg.label}</Text>
          </View>
          <Text style={s.total}>{order.total.toFixed(2)} €</Text>
        </View>
      </View>

      {/* Resumen en una línea */}
      <Text style={s.summary} numberOfLines={open ? undefined : 1}>
        {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
      </Text>

      {/* Detalle expandido */}
      {open && (
        <View style={s.detail}>
          {order.items.map((i, idx) => (
            <View key={idx} style={s.detailRow}>
              <Text style={s.detailName}>{i.name}</Text>
              <Text style={s.detailQty}>{i.qty} ud</Text>
              <Text style={s.detailPrice}>{(i.price * i.qty).toFixed(2)} €</Text>
            </View>
          ))}
          {order.pickup_timeslot
            ? <Text style={s.slotInfo}>Recogida: {order.pickup_timeslot}</Text>
            : null
          }
        </View>
      )}

      {/* Pie */}
      <View style={s.footer}>
        <Text style={s.expandHint}>{open ? 'Ocultar detalle' : 'Ver detalle'}</Text>
        <TouchableOpacity style={s.repeatBtn} onPress={(e) => { e.stopPropagation?.(); onRepeat(); }}>
          <Text style={s.repeatText}>Repetir pedido</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { addItem, clearCart, itemCount } = useCartStore();

  const load = useCallback(async () => {
    try {
      const data = await getMyOrders();
      setOrders([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus pedidos.');
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleRepeat = (order: Order) => {
    const doIt = () => {
      clearCart();
      order.items.forEach(i => addItem({ product_id: i.product_id, product_name: i.name, price: i.price, quantity: i.qty }));
      router.push('/(student)/cart');
    };
    if (itemCount() > 0) {
      Alert.alert('Carrito con artículos', '¿Reemplazar el carrito con este pedido?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reemplazar', style: 'destructive', onPress: doIt },
      ]);
    } else { doIt(); }
  };

  if (orders.length === 0 && !refreshing) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Sin pedidos todavía</Text>
        <Text style={s.emptySub}>Cuando hagas tu primer pedido aparecerá aquí.</Text>
        <TouchableOpacity style={s.goBtn} onPress={() => router.push('/(student)/index')}>
          <Text style={s.goBtnText}>Ir al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mis Pedidos</Text>
        <Text style={s.headerCount}>{orders.length} pedido{orders.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item }) => <OrderCard order={item} onRepeat={() => handleRepeat(item)} />}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mid} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  header:      { backgroundColor: C.dark, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.white },
  headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  list:        { padding: 16, paddingBottom: 40 },

  card:        {
    backgroundColor: C.white, borderRadius: 14, marginBottom: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDate:    { fontSize: 13, color: C.muted, fontWeight: '600' },
  code:        { fontSize: 13, color: '#555', marginTop: 2 },
  codeBold:    { fontWeight: '800', color: C.mid },
  badge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:   { fontSize: 12, fontWeight: '700' },
  total:       { fontSize: 20, fontWeight: '900', color: C.dark },
  summary:     { fontSize: 13, color: C.muted, marginBottom: 10, lineHeight: 18 },

  detail:      { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 10, gap: 6 },
  detailRow:   { flexDirection: 'row', alignItems: 'center' },
  detailName:  { flex: 1, fontSize: 14, color: C.dark, fontWeight: '500' },
  detailQty:   { fontSize: 13, color: C.muted, marginRight: 8 },
  detailPrice: { fontSize: 14, fontWeight: '700', color: C.dark, minWidth: 52, textAlign: 'right' },
  slotInfo:    { fontSize: 12, color: C.muted, marginTop: 4 },

  footer:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  expandHint:  { fontSize: 12, color: '#ccc', fontWeight: '600' },
  repeatBtn:   {
    backgroundColor: C.light, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: C.mid,
  },
  repeatText:  { color: C.mid, fontWeight: '700', fontSize: 13 },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: C.bg },
  emptyTitle:  { fontSize: 22, fontWeight: '800', color: C.dark },
  emptySub:    { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },
  goBtn:       { marginTop: 8, backgroundColor: C.mid, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  goBtnText:   { color: C.white, fontWeight: '700', fontSize: 15 },
});
