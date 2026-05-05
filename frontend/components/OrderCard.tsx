import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C, radius, shadow } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface OrderItem { product_name: string; quantity: number; }
interface OrderData {
  id: string;
  total: number;
  status: string;
  pickup_code: string | null;
  items: OrderItem[];
  created_at: string;
}

// ── Configuración visual de estados ─────────────────────────────────
const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; stripe: string; icon: keyof typeof Ionicons.glyphMap;
}> = {
  pending_payment: { label: 'Pendiente de pago', color: C.muted, bg: C.subtle, stripe: C.muted, icon: 'time-outline' },
  paid:            { label: 'Pagado',            color: C.warning, bg: C.warningBg, stripe: C.accent, icon: 'card-outline' },
  preparing:       { label: 'En preparación',     color: C.info,    bg: C.infoBg,    stripe: C.info,   icon: 'hammer-outline' },
  ready:           { label: 'Listo para recoger', color: C.success, bg: C.successBg, stripe: C.mid,    icon: 'checkmark-circle-outline' },
  collected:       { label: 'Recogido',           color: C.muted,   bg: C.subtle,    stripe: C.muted,  icon: 'archive-outline' },
};

export default function OrderCard({ order }: { order: OrderData }) {
  const st = STATUS_CONFIG[order.status.toLowerCase()] ?? STATUS_CONFIG.pending_payment;

  const date = new Date(order.created_at).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 50, friction: 14,
    }).start();
  }, []);

  return (
    <Animated.View style={[s.wrap, {
      opacity: anim,
      transform: [{
        translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
      }],
    }]}>
      <View style={s.card}>
        <View style={[s.stripe, { backgroundColor: st.stripe }]} />

        <View style={s.body}>
          <View style={s.header}>
            <View>
              <Text style={s.orderLabel}>PEDIDO</Text>
              <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: st.bg }]}>
              <Ionicons name={st.icon} size={12} color={st.color} style={{ marginRight: 4 }} />
              <Text style={[s.badgeText, { color: st.color }]}>
                {st.label.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={s.itemsSection}>
            {order.items.map((item, i) => (
              <View key={i} style={s.itemRow}>
                <Ionicons name="caret-forward-outline" size={10} color={C.mid} />
                <Text style={s.itemText}>
                  <Text style={s.itemQty}>{item.quantity}×  </Text>
                  {item.product_name}
                </Text>
              </View>
            ))}
          </View>

          <View style={s.footer}>
            <View>
              <View style={s.dateRow}>
                <Ionicons name="calendar-outline" size={12} color={C.muted} style={{ marginRight: 4 }} />
                <Text style={s.dateText}>{date}</Text>
              </View>
              <Text style={s.totalText}>{order.total.toFixed(2)} €</Text>
            </View>

            {order.pickup_code && (
              <View style={s.codeBox}>
                <Ionicons name="barcode-outline" size={18} color={C.muted} />
                <Text style={s.codeLabel}>RECOGER CON</Text>
                <Text style={s.codeValue}>{order.pickup_code}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 12 },
  card: { flexDirection: 'row', backgroundColor: C.white, borderRadius: radius.md, overflow: 'hidden', ...shadow.card },
  stripe: { width: 5 },
  body: { flex: 1, padding: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderLabel: { fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 1.5 },
  orderId: { fontSize: 16, fontWeight: '900', color: C.dark, letterSpacing: 0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  itemsSection: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.subtle, paddingVertical: 10, marginBottom: 12, gap: 6 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemText: { fontSize: 13, color: '#444', fontWeight: '500', flex: 1 },
  itemQty: { fontWeight: '900', color: C.mid },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  dateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  dateText: { fontSize: 11, color: C.muted, fontWeight: '500' },
  totalText: { fontSize: 22, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  codeBox: { alignItems: 'center', backgroundColor: C.dark, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, minWidth: 110 },
  codeLabel: { fontSize: 8, fontWeight: '900', color: C.muted, letterSpacing: 1.2, marginTop: 4 },
  codeValue: { fontSize: 24, fontWeight: '900', color: C.accent, letterSpacing: 4, marginTop: 0 },
});