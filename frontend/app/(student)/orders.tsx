
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, Animated, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { getMyOrders } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import ActionModal from '../../components/ActionModal';

const C = {
  dark:   '#1A3329',
  mid:    '#00704A',
  accent: '#CBA258',
  light:  '#D4E9E2',
  white:  '#FFFFFF',
  bg:     '#F7F4EF',
  muted:  '#8BA99A',
  shadow: '#0D2018',
  subtle: '#E8F0EC',
};

interface OrderItem { product_id: string; name: string; qty: number; price: number; }
interface Order {
  id: string; created_at: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total: number; pickup_code?: string; pickup_timeslot?: string; items: OrderItem[];
}

const STATUS: Record<string, { label: string; textColor: string; bg: string; dot: string }> = {
  pending:   { label: 'Pendiente',   textColor: '#92600A', bg: '#FEF3C7', dot: '#F59E0B' },
  paid:      { label: 'Pagado',      textColor: '#065F46', bg: C.light,   dot: C.mid    },
  preparing: { label: 'Preparando',  textColor: '#0369A1', bg: '#E0F2FE', dot: '#0284C7' },
  ready:     { label: 'Listo',       textColor: C.mid,     bg: C.subtle,  dot: C.mid    },
  delivered: { label: 'Entregado',   textColor: C.muted,   bg: '#F3F4F6', dot: '#9CA3AF' },
  cancelled: { label: 'Cancelado',   textColor: '#991B1B', bg: '#FEE2E2', dot: '#DC2626' },
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Tarjeta de pedido con animación de expansión ──────────────────────
function OrderCard({ 
  order, 
  onRepeat, 
  onPay, 
  // onDelete, 
  index 
}: { 
  order: Order; 
  onRepeat: () => void; 
  onPay: () => void;
  // onDelete: () => void;
  index: number 
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS[order.status] ?? STATUS.pending;
  const isPending = order.status === 'pending';

  const enterAnim = useRef(new Animated.Value(0)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1, useNativeDriver: true,
      tension: 50, friction: 10, delay: index * 70,
    }).start();
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    Animated.parallel([
      Animated.spring(expandAnim, { toValue: next ? 1 : 0, useNativeDriver: false, tension: 80, friction: 14 }),
      Animated.spring(arrowAnim, { toValue: next ? 1 : 0, useNativeDriver: true, tension: 80, friction: 14 }),
    ]).start();
  };

  const arrowRotate = arrowAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.View style={[s.card, { opacity: enterAnim, transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      <View style={[s.statusBar, { backgroundColor: cfg.dot }]} />
      <Pressable onPress={toggle} style={s.cardInner}>
        <View style={s.cardTop}>
          <View style={s.cardTopLeft}>
            <Text style={s.cardDate}>{fmt(order.created_at)}</Text>
            {order.pickup_code && (
              <View style={s.codeRow}>
                <Text style={s.codeLabel}>Código </Text>
                <Text style={s.codeBold}>{order.pickup_code}</Text>
              </View>
            )}
          </View>
          <View style={s.cardTopRight}>
            <View style={[s.badge, { backgroundColor: cfg.bg }]}>
              <View style={[s.dot, { backgroundColor: cfg.dot }]} />
              <Text style={[s.badgeText, { color: cfg.textColor }]}>{cfg.label}</Text>
            </View>
            <Text style={s.total}>{order.total.toFixed(2)} €</Text>
          </View>
        </View>

        <Text style={s.summary} numberOfLines={open ? undefined : 2}>
          {order.items.map(i => `${i.qty}× ${i.name}`).join('  ·  ')}
        </Text>

        {open && (
          <View style={s.detail}>
            {order.items.map((i, idx) => (
              <View key={idx} style={s.detailRow}>
                <View style={s.detailDot} />
                <Text style={s.detailName}>{i.name}</Text>
                <Text style={s.detailQty}>{i.qty} ud</Text>
                <Text style={s.detailPrice}>{(i.price * i.qty).toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.footer}>
          <TouchableOpacity onPress={toggle} style={s.expandRow}>
            <Animated.Text style={[s.arrow, { transform: [{ rotate: arrowRotate }] }]}>▾</Animated.Text>
            <Text style={s.expandHint}>{open ? 'Menos' : 'Detalles'}</Text>
          </TouchableOpacity>

          <View style={s.actionGroup}>
            {isPending ? (
              <>
                {/* <TouchableOpacity style={s.deleteBtn} onPress={onDelete}>
                  <Text style={s.deleteText}>Eliminar</Text>
                </TouchableOpacity> */}
                <TouchableOpacity style={s.payBtn} onPress={onPay}>
                  <Text style={s.payText}>Pagar ahora</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={s.repeatBtn} onPress={onRepeat}>
                <Text style={s.repeatText}>Repetir</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { addItem, clearCart, itemCount } = useCartStore();
  
  // Estado para el Modal Personalizado
  const [modal, setModal] = useState({ visible: false, title: '', content: null as any, onConfirm: () => {}, confirmText: '', confirmColor: C.mid });

  const load = useCallback(async () => {
    try {
      const data = await getMyOrders();
      setOrders([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch {
      // Error silencioso en polling o manejar con un pequeño toast
    }
  }, []);

  // Polling cada 15 segundos
  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRepeat = (order: Order) => {
    const doRepeat = () => {
      clearCart();
      order.items.forEach(i => addItem({ product_id: i.product_id, product_name: i.name, price: i.price, quantity: i.qty }));
      setModal(prev => ({ ...prev, visible: false }));
      router.push('/(student)/cart');
    };

    if (itemCount() > 0) {
      setModal({
        visible: true,
        title: 'Carrito ocupado',
        confirmText: 'Reemplazar',
        confirmColor: '#DC2626',
        onConfirm: doRepeat,
        content: <Text style={{color: C.muted}}>¿Quieres vaciar tu carrito actual y añadir los productos de este pedido?</Text>
      });
    } else {
      doRepeat();
    }
  };

  // const handleDeletePending = (orderId: string) => {
  //   setModal({
  //     visible: true,
  //     title: 'Eliminar pedido',
  //     confirmText: 'Eliminar',
  //     confirmColor: '#991B1B',
  //     onConfirm: async () => {
  //       try {
  //         await deleteOrder(orderId);
  //         setModal(prev => ({ ...prev, visible: false }));
  //         load();
  //       } catch (e) { console.log(e); }
  //     },
  //     content: <Text style={{color: C.muted}}>Esta acción cancelará el pedido pendiente. No se puede deshacer.</Text>
  //   });
  // };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerLabel}>MIS PEDIDOS</Text>
          <Text style={s.headerTitle}>Historial</Text>
        </View>
        <TouchableOpacity 
          onPress={onRefresh} 
          style={s.refreshCircle}
          disabled={refreshing}
        >
          <Text style={{ fontSize: 20, color: C.white }}>{refreshing ? '...' : '↻'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item, index }) => (
          <OrderCard 
            order={item} 
            index={index}
            onRepeat={() => handleRepeat(item)}
            // onDelete={() => handleDeletePending(item.id)}
            onPay={() => router.push({ pathname: '/(student)/cart', params: { orderId: item.id } })}
          />
        )}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.mid} />}
      />

      <ActionModal
        visible={modal.visible}
        title={modal.title}
        confirmText={modal.confirmText}
        confirmColor={modal.confirmColor}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
        onConfirm={modal.onConfirm}
      >
        {modal.content}
      </ActionModal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          {
    backgroundColor: C.dark,
    paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20,
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between'
  },
  headerLeft: {
  flex: 1, 
},
  headerLabel:     { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2, marginBottom: 4 },
  headerTitle:     { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  headerBadge:     {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  headerBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  list:            { padding: 16, paddingBottom: 50 },

  card:            {
    backgroundColor: C.white, borderRadius: 20, marginBottom: 14, overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.08,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  statusBar:       { height: 4, width: '100%' },
  cardInner:       { padding: 16 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTopLeft:     { gap: 4 },
  cardTopRight:    { alignItems: 'flex-end', gap: 6 },
  cardDate:        { fontSize: 13, color: C.muted, fontWeight: '600', letterSpacing: 0.2 },
  codeRow:         { flexDirection: 'row', alignItems: 'center' },
  codeLabel:       { fontSize: 12, color: C.muted },
  codeBold:        { fontSize: 13, fontWeight: '900', color: C.mid, letterSpacing: 1 },
  badge:           {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  dot:             { width: 6, height: 6, borderRadius: 3 },
  badgeText:       { fontSize: 12, fontWeight: '700' },
  total:           { fontSize: 22, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  summary:         { fontSize: 13, color: C.muted, lineHeight: 19, marginBottom: 12 },

  detail:          {
    backgroundColor: C.bg, borderRadius: 12, padding: 12,
    marginBottom: 12, gap: 8,
  },
  detailRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailDot:       { width: 4, height: 4, borderRadius: 2, backgroundColor: C.mid },
  detailName:      { flex: 1, fontSize: 14, color: C.dark, fontWeight: '500' },
  detailQty:       { fontSize: 12, color: C.muted, minWidth: 32 },
  detailPrice:     { fontSize: 14, fontWeight: '800', color: C.dark, minWidth: 52, textAlign: 'right' },
  slotRow:         {
    marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  slotLabel:       { fontSize: 12, color: C.muted, fontWeight: '600' },
  slotValue:       { fontSize: 13, color: C.dark, fontWeight: '700' },

  footer:          {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12,
  },
  expandRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expandHint:      { fontSize: 12, color: C.muted, fontWeight: '600' },
  arrow:           { fontSize: 14, color: C.muted },
  repeatBtn:       {
    backgroundColor: C.subtle, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: C.light,
  },
  repeatText:      { color: C.mid, fontWeight: '800', fontSize: 13 },

  empty:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14, backgroundColor: C.bg },
  emptyIcon:       {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  emptyIconText:   { fontSize: 36, color: C.mid },
  emptyTitle:      { fontSize: 22, fontWeight: '900', color: C.dark, letterSpacing: -0.3 },
  emptySub:        { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },
  refreshCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2
  },
  actionGroup: { flexDirection: 'row', gap: 8 },
  payBtn: {
    backgroundColor: C.mid, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  payText: { color: C.white, fontWeight: '800', fontSize: 12 },
  deleteBtn: {
    backgroundColor: '#FEE2E2', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#FECACA'
  },
  deleteText: { color: '#991B1B', fontWeight: '700', fontSize: 12 },
  goBtn:           { marginTop: 4, backgroundColor: C.mid, paddingHorizontal: 32, paddingVertical: 15, borderRadius: 14 },
  goBtnText:       { color: C.white, fontWeight: '800', fontSize: 15 },
});
