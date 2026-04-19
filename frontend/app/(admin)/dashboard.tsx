// (admin)/dashboard.tsx — Panel de administración rediseñado
// Iconos sugeridos (Ionicons de @expo/vector-icons):
//   Panel: "grid-outline"          Franjas: "time-outline"
//   Inventario: "cube-outline"     Lote: "checkmark-done-outline"
//   Verificar: "scan-outline"      Vista alumno: "person-outline"
//   Abierta: "lock-open-outline"   Cerrada: "lock-closed-outline"

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, Switch, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import {
  getPendingOrders, updateOrderStatus,
  verifyPickupCode, toggleCafeteriaStatus,
  confirmOrdersBatch,
} from '../../services/api';
import { C, radius, shadow } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
interface OrderItem { product_id: string; name: string; qty: number; }
interface Order {
  id: string;
  pickup_code: string;
  pickup_timeslot: string;
  status: string;
  items: OrderItem[];
}

// ── Tarjeta de estadística ───────────────────────────────────────────
function StatCard({
  label, value, color, index,
}: {
  label: string; value: number; color: string; index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, useNativeDriver: true,
      tension: 60, friction: 12, delay: index * 80,
    }).start();
  }, []);
  return (
    <Animated.View style={[sc.card, {
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [12,0] }) }],
    }]}>
      <View style={[sc.dot, { backgroundColor: color }]} />
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </Animated.View>
  );
}

const sc = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: C.white, borderRadius: radius.md,
    padding: 14, alignItems: 'center', gap: 4, ...shadow.card,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  value: { fontSize: 26, fontWeight: '900', color: C.dark, letterSpacing: -1 },
  label: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
});

// ── Botón de acción rápida ───────────────────────────────────────────
function QuickAction({
  label, color, onPress, disabled = false,
  iconSlot,   // Pasa un elemento SVG/View como ícono
}: {
  label: string; color: string; onPress: () => void;
  disabled?: boolean; iconSlot?: React.ReactNode;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true, tension: 300 }).start();
  const pressOut = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, tension: 300 }).start();

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        style={[qa.btn, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        {iconSlot && <View style={qa.icon}>{iconSlot}</View>}
        <Text style={qa.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const qa = StyleSheet.create({
  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  icon: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.white, fontSize: 11, fontWeight: '800', textAlign: 'center', letterSpacing: 0.3 },
});

// ── Tarjeta de pedido ────────────────────────────────────────────────
function OrderRow({ item, onUpdate }: { item: Order; onUpdate: () => void }) {
  const isPaid       = item.status === 'paid';
  const isPreparing  = item.status === 'preparing';

  return (
    <View style={or.card}>
      {/* Indicador de estado lateral */}
      <View style={[or.statusBar, { backgroundColor: isPaid ? C.accent : C.mid }]} />

      <View style={or.body}>
        {/* Cabecera */}
        <View style={or.row}>
          <View style={or.codeWrap}>
            <Text style={or.codeLabel}>CÓDIGO</Text>
            <Text style={or.code}>{item.pickup_code}</Text>
          </View>
          <View style={or.metaRight}>
            <Text style={or.slot}>{item.pickup_timeslot}</Text>
            <View style={[or.badge, isPaid ? or.badgePaid : or.badgePreparing]}>
              <Text style={[or.badgeText, { color: isPaid ? C.warning : C.mid }]}>
                {isPaid ? 'PAGADO' : 'PREPARANDO'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items del pedido */}
        <View style={or.items}>
          {item.items.map((i, idx) => (
            <Text key={idx} style={or.itemText}>
              <Text style={or.itemQty}>{i.qty}  </Text>{i.name}
            </Text>
          ))}
        </View>

        {/* Acciones */}
        {(isPaid || isPreparing) && (
          <TouchableOpacity
            style={[or.actionBtn, { backgroundColor: isPaid ? C.mid : C.accent }]}
            onPress={async () => {
              await updateOrderStatus(item.id, isPaid ? 'preparing' : 'ready');
              onUpdate();
            }}
          >
            <Text style={[or.actionText, { color: isPaid ? C.white : C.dark }]}>
              {isPaid ? 'Iniciar preparación' : 'Marcar como listo'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const or = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: C.white,
    borderRadius: radius.md, marginBottom: 10, overflow: 'hidden', ...shadow.card,
  },
  statusBar: { width: 4 },
  body: { flex: 1, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  codeWrap: {},
  codeLabel: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5 },
  code: { fontSize: 28, fontWeight: '900', color: C.dark, letterSpacing: -1 },
  metaRight: { alignItems: 'flex-end', gap: 6 },
  slot: { fontSize: 13, fontWeight: '700', color: C.dark },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgePaid:      { backgroundColor: C.warningBg },
  badgePreparing: { backgroundColor: C.successBg },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  items: { borderTopWidth: 1, borderTopColor: C.subtle, paddingTop: 8, marginBottom: 10, gap: 3 },
  itemText: { fontSize: 13, color: '#444' },
  itemQty: { fontWeight: '800', color: C.mid },
  actionBtn: {
    padding: 11, borderRadius: radius.sm,
    alignItems: 'center',
  },
  actionText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
});

// ── Pantalla principal ───────────────────────────────────────────────
export default function AdminDashboard() {
  const [orders, setOrders]               = useState<Order[]>([]);
  const [codeInput, setCodeInput]         = useState('');
  const [cafeteriaOpen, setCafeteriaOpen] = useState(true);
  const [togglingStatus, setTogglingStatus]   = useState(false);
  const [confirmingBatch, setConfirmingBatch] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 50, friction: 12,
    }).start();
    loadOrders();
    const interval = setInterval(loadOrders, 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    const data = await getPendingOrders();
    setOrders(data);
  };

  // Contadores por estado
  const countPaid      = orders.filter(o => o.status === 'paid').length;
  const countPreparing = orders.filter(o => o.status === 'preparing').length;
  const countReady     = orders.filter(o => o.status === 'ready').length;

  const handleVerifyCode = async () => {
    if (!codeInput.trim()) return;
    const result = await verifyPickupCode(codeInput.trim());
    if (result.valid) {
      const items = result.items.map((i: OrderItem) => `${i.qty}x ${i.name}`).join('\n');
      Alert.alert(
        'Pedido válido',
        `${items}\n\nTotal: ${result.total}€\n${result.is_paid ? 'Pagado' : 'Sin pagar'}`
      );
    } else {
      Alert.alert('No encontrado', 'El código no corresponde a ningún pedido.');
    }
    setCodeInput('');
  };

  const handleToggle = async (value: boolean) => {
    Alert.alert(
      value ? 'Abrir cafetería' : 'Cerrar pedidos',
      value
        ? '¿Deseas abrir para nuevos pedidos?'
        : '¿Seguro? Los alumnos no podrán pedir hasta que abras de nuevo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: value ? 'default' : 'destructive',
          onPress: async () => {
            setTogglingStatus(true);
            try { await toggleCafeteriaStatus(value); setCafeteriaOpen(value); }
            catch { Alert.alert('Error', 'No se pudo cambiar el estado.'); }
            finally { setTogglingStatus(false); }
          },
        },
      ]
    );
  };

  const handleBatch = async () => {
    const ids = orders.filter(o => o.status === 'preparing').map(o => o.id);
    if (!ids.length) { Alert.alert('Sin pedidos', 'No hay pedidos en preparación.'); return; }
    Alert.alert(
      'Confirmar lote',
      `¿Marcar ${ids.length} pedido(s) como listos para recoger?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Confirmar ${ids.length}`,
          onPress: async () => {
            setConfirmingBatch(true);
            try { await confirmOrdersBatch(ids); loadOrders(); }
            catch { Alert.alert('Error', 'No se pudo confirmar el lote.'); }
            finally { setConfirmingBatch(false); }
          },
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      {/* Cabecera oscura */}
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-8,0] }) }],
      }]}>
        <View>
          <Text style={s.headerLabel}>PANEL DE CONTROL</Text>
          <Text style={s.headerTitle}>Cafetería</Text>
        </View>

        <View style={s.headerRight}>
          {/* Toggle estado cafetería */}
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: cafeteriaOpen ? '#4ade80' : '#f87171' }]} />
            <Text style={[s.statusText, { color: cafeteriaOpen ? '#4ade80' : '#f87171' }]}>
              {cafeteriaOpen ? 'ABIERTA' : 'CERRADA'}
            </Text>
            <Switch
              value={cafeteriaOpen}
              onValueChange={handleToggle}
              trackColor={{ false: '#f87171', true: '#4ade80' }}
              thumbColor={C.white}
              disabled={togglingStatus}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>

          {/* Botón vista alumno */}
          <TouchableOpacity
            style={s.studentViewBtn}
            onPress={() => router.push('/(student)/index')}
          >
            {/* Ionicons "person-outline" — 16px, color C.accent */}
            <View style={s.personIcon}>
              <View style={s.personHead} />
              <View style={s.personBody} />
            </View>
            <Text style={s.studentViewText}>Vista alumno</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard label="Pagados"     value={countPaid}      color={C.accent} index={0} />
          <StatCard label="Preparando"  value={countPreparing} color={C.mid}    index={1} />
          <StatCard label="Listos"      value={countReady}     color={C.success} index={2} />
        </View>

        {/* Acciones rápidas */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCIONES</Text>
          <View style={s.quickRow}>
            <QuickAction
              label="Franjas horarias"
              color={C.dark}
              onPress={() => router.push('/(admin)/settings')}
              // Ionicons "time-outline" recomendado
            />
            <QuickAction
              label="Inventario"
              color="#1D5F8A"
              onPress={() => router.push('/(admin)/inventory')}
              // Ionicons "cube-outline" recomendado
            />
            <QuickAction
              label={confirmingBatch ? 'Procesando...' : 'Lote listo'}
              color={C.mid}
              onPress={handleBatch}
              disabled={confirmingBatch}
              // Ionicons "checkmark-done-outline" recomendado
            />
          </View>
        </View>

        {/* Verificador de código */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>VERIFICAR RECOGIDA</Text>
          <View style={s.verifyRow}>
            <TextInput
              style={s.codeInput}
              placeholder="_ _ _ _"
              placeholderTextColor={C.muted}
              value={codeInput}
              onChangeText={setCodeInput}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={handleVerifyCode}
            />
            <TouchableOpacity style={s.verifyBtn} onPress={handleVerifyCode}>
              {/* Ionicons "scan-outline" recomendado */}
              <Text style={s.verifyBtnText}>Verificar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de pedidos */}
        <View style={s.section}>
          <View style={s.listHeader}>
            <Text style={s.sectionLabel}>PEDIDOS ACTIVOS</Text>
            <Text style={s.listCount}>{orders.length}</Text>
          </View>
          {orders.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIcon} />
              <Text style={s.emptyText}>Sin pedidos pendientes</Text>
            </View>
          ) : (
            orders.map(order => (
              <OrderRow key={order.id} item={order} onUpdate={loadOrders} />
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Ícono "persona" hecho con Views (alternativa: Ionicons "person-outline")
const personIconStyles = StyleSheet.create({
  wrap:   { width: 16, height: 16, alignItems: 'center' },
  head:   { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.accent, marginBottom: 1 },
  body:   { width: 11, height: 6, borderRadius: 6, backgroundColor: C.accent, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
});

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.dark,
    paddingTop: 56, paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerLabel: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.5, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  studentViewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(203,162,88,0.15)',
    borderWidth: 1, borderColor: 'rgba(203,162,88,0.3)',
    borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6,
  },
  personIcon: { width: 16, height: 16, alignItems: 'center' },
  personHead: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.accent, marginBottom: 1 },
  personBody: { width: 11, height: 6, borderRadius: 6, backgroundColor: C.accent },
  studentViewText: { fontSize: 11, fontWeight: '700', color: C.accent },

  scroll: { flex: 1 },

  statsRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginTop: 16, marginBottom: 4,
  },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionLabel: {
    fontSize: 9, fontWeight: '900', color: C.muted,
    letterSpacing: 2, marginBottom: 10,
  },
  quickRow: { flexDirection: 'row', gap: 8 },

  // Verificador
  verifyRow: { flexDirection: 'row', gap: 10 },
  codeInput: {
    flex: 1, backgroundColor: C.white,
    borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 16,
    fontSize: 22, fontWeight: '900',
    letterSpacing: 8, textAlign: 'center',
    color: C.dark, ...shadow.card,
  },
  verifyBtn: {
    backgroundColor: C.mid, borderRadius: radius.md,
    paddingHorizontal: 20, justifyContent: 'center', ...shadow.card,
  },
  verifyBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listCount: {
    fontSize: 13, fontWeight: '900', color: C.dark,
    backgroundColor: C.subtle, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },

  emptyBox: { alignItems: 'center', padding: 32, gap: 10 },
  emptyIcon: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: C.subtle,
  },
  emptyText: { fontSize: 14, color: C.muted, fontWeight: '500' },
});