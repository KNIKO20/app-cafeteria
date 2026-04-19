// components/OrderCard.tsx — Tarjeta de pedido del alumno rediseñada
// Iconos sugeridos (Ionicons de @expo/vector-icons):
//   Código de recogida: "barcode-outline"
//   Reloj:              "time-outline"
//   Estado listo:       "checkmark-circle-outline"

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C, radius, shadow } from '../theme';

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
  label: string; color: string; bg: string; stripe: string;
}> = {
  pending_payment: { label: 'Pendiente de pago',  color: C.muted,   bg: C.subtle,    stripe: C.muted   },
  paid:            { label: 'Pagado',              color: C.warning, bg: C.warningBg, stripe: C.accent  },
  preparing:       { label: 'En preparación',      color: C.info,    bg: C.infoBg,    stripe: C.info    },
  ready:           { label: 'Listo para recoger',  color: C.success, bg: C.successBg, stripe: C.mid     },
  collected:       { label: 'Recogido',            color: C.muted,   bg: C.subtle,    stripe: C.muted   },
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
        translateY: anim.interpolate({ inputRange: [0,1], outputRange: [12,0] }),
      }],
    }]}>
      <View style={s.card}>
        {/* Barra lateral de color según estado */}
        <View style={[s.stripe, { backgroundColor: st.stripe }]} />

        <View style={s.body}>
          {/* Cabecera: ID + badge de estado */}
          <View style={s.header}>
            <View>
              <Text style={s.orderLabel}>PEDIDO</Text>
              <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[s.badge, { backgroundColor: st.bg }]}>
              <Text style={[s.badgeText, { color: st.color }]}>
                {st.label.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Lista de productos */}
          <View style={s.itemsSection}>
            {order.items.map((item, i) => (
              <View key={i} style={s.itemRow}>
                <View style={s.bullet} />
                <Text style={s.itemText}>
                  <Text style={s.itemQty}>{item.quantity}×  </Text>
                  {item.product_name}
                </Text>
              </View>
            ))}
          </View>

          {/* Footer: fecha, total y código */}
          <View style={s.footer}>
            <View>
              <Text style={s.dateText}>{date}</Text>
              <Text style={s.totalText}>{order.total.toFixed(2)} €</Text>
            </View>

            {order.pickup_code && (
              <View style={s.codeBox}>
                {/* Ionicons "barcode-outline" encima del código */}
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

  card: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },

  stripe: { width: 5 },

  body: { flex: 1, padding: 14 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderLabel: {
    fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 1.5,
  },
  orderId: {
    fontSize: 16, fontWeight: '900', color: C.dark, letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 10, maxWidth: 160,
  },
  badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },

  itemsSection: {
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: C.subtle,
    paddingVertical: 8, marginBottom: 10, gap: 4,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.mid },
  itemText: { fontSize: 13, color: '#444', fontWeight: '500', flex: 1 },
  itemQty: { fontWeight: '900', color: C.mid },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateText: { fontSize: 11, color: C.muted, fontWeight: '500', marginBottom: 2 },
  totalText: { fontSize: 20, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },

  // Código de recogida — prominente y oscuro
  codeBox: {
    alignItems: 'center',
    backgroundColor: C.dark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  codeLabel: {
    fontSize: 8, fontWeight: '900',
    color: C.muted, letterSpacing: 1.5,
  },
  codeValue: {
    fontSize: 22, fontWeight: '900',
    color: C.accent, letterSpacing: 4,
    marginTop: 2,
  },
});