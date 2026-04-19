
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity,
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
import ActionModal from '../../components/ActionModal';

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
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
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
  iconName, // Nombre del icono de Ionicons
}: {
  label: string; color: string; onPress: () => void;
  disabled?: boolean; iconName: keyof typeof Ionicons.glyphMap;
}) {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true, tension: 300 }).start();
  const pressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 300 }).start();

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
        <Ionicons name={iconName} size={22} color={C.white} />
        <Text style={qa.label}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const qa = StyleSheet.create({
  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 4, alignItems: 'center', gap: 6, minHeight: 85, justifyContent: 'center' },
  label: { color: C.white, fontSize: 10, fontWeight: '800', textAlign: 'center', letterSpacing: 0.3 },
});

// ── Tarjeta de pedido ────────────────────────────────────────────────
function OrderRow({ item, onUpdate }: { item: Order; onUpdate: () => void }) {
  const isPaid = item.status === 'paid';
  const isPreparing = item.status === 'preparing';

  return (
    <View style={or.card}>
      <View style={[or.statusBar, { backgroundColor: isPaid ? C.accent : C.mid }]} />

      <View style={or.body}>
        <View style={or.row}>
          <View style={or.codeWrap}>
            <Text style={or.codeLabel}>CÓDIGO</Text>
            <Text style={or.code}>{item.pickup_code}</Text>
          </View>
          <View style={or.metaRight}>
            <View style={or.timeRow}>
              <Ionicons name="time-outline" size={14} color={C.dark} />
              <Text style={or.slot}>{item.pickup_timeslot}</Text>
            </View>
            <View style={[or.badge, isPaid ? or.badgePaid : or.badgePreparing]}>
              <Text style={[or.badgeText, { color: isPaid ? C.warning : C.mid }]}>
                {isPaid ? 'PAGADO' : 'PREPARANDO'}
              </Text>
            </View>
          </View>
        </View>

        <View style={or.items}>
          {item.items.map((i, idx) => (
            <Text key={idx} style={or.itemText}>
              <Text style={or.itemQty}>{i.qty}  </Text>{i.name}
            </Text>
          ))}
        </View>

        {(isPaid || isPreparing) && (
          <TouchableOpacity
            style={[or.actionBtn, { backgroundColor: isPaid ? C.mid : C.accent }]}
            onPress={async () => {
              await updateOrderStatus(item.id, isPaid ? 'preparing' : 'ready');
              onUpdate();
            }}
          >
            <Ionicons 
                name={isPaid ? "play-outline" : "checkmark-circle-outline"} 
                size={16} 
                color={isPaid ? C.white : C.dark} 
                style={{ marginRight: 6 }}
            />
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
  card: { flexDirection: 'row', backgroundColor: C.white, borderRadius: radius.md, marginBottom: 10, overflow: 'hidden', ...shadow.card },
  statusBar: { width: 4 },
  body: { flex: 1, padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  codeWrap: {},
  codeLabel: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 1.5 },
  code: { fontSize: 28, fontWeight: '900', color: C.dark, letterSpacing: -1 },
  metaRight: { alignItems: 'flex-end', gap: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slot: { fontSize: 13, fontWeight: '700', color: C.dark },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgePaid: { backgroundColor: C.warningBg },
  badgePreparing: { backgroundColor: C.successBg },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  items: { borderTopWidth: 1, borderTopColor: C.subtle, paddingTop: 8, marginBottom: 10, gap: 3 },
  itemText: { fontSize: 13, color: '#444' },
  itemQty: { fontWeight: '800', color: C.mid },
  actionBtn: { padding: 11, borderRadius: radius.sm, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  actionText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
});

// ── Pantalla principal ───────────────────────────────────────────────
export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [cafeteriaOpen, setCafeteriaOpen] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [confirmingBatch, setConfirmingBatch] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 12 }).start();
    loadOrders();
    const interval = setInterval(loadOrders, 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    const data = await getPendingOrders();
    setOrders(data);
  };

  const countPaid = orders.filter(o => o.status === 'paid').length;
  const countPreparing = orders.filter(o => o.status === 'preparing').length;
  const countReady = orders.filter(o => o.status === 'ready').length;

  const handleVerifyCode = async () => {
    if (!codeInput.trim()) return;
      const result = await verifyPickupCode(codeInput.trim());
      
      if (result.valid) {
        showActionModal({
          title: 'Pedido Verificado',
          confirmText: 'Entregar Pedido',
          confirmColor: C.mid,
          onConfirm: async () => {
            await updateOrderStatus(result.order_id, 'delivered');
            loadOrders();
            closeActionModal();
          },
          visible: true,
          content: (
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: '800', color: C.dark }}>Artículos:</Text>
              {result.items.map((i: any, idx: number) => (
                <Text key={idx} style={{ color: '#444' }}>• {i.qty}x {i.name}</Text>
              ))}
              <View style={{ marginTop: 10, padding: 10, backgroundColor: C.subtle, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700' }}>TOTAL: {Number(result.total).toFixed(2)}€</Text>
                <Text style={{ fontSize: 12, color: result.is_paid ? C.success : C.danger }}>
                  {result.is_paid ? '✓ PAGADO' : '✗ PENDIENTE DE PAGO'}
                </Text>
              </View>
            </View>
          )
        });
      } else {
        // Modal de Error simple
        showActionModal({
          title: 'Error de Código',
          confirmText: 'Reintentar',
          confirmColor: C.danger,
          onConfirm: closeActionModal,
          visible: true,
          content: <Text>El código "{codeInput}" no es válido o ha expirado.</Text>
        });
      }
    setCodeInput('');
  };
const [modalConfig, setModalConfig] = useState({
  visible: false,
  title: '',
  confirmText: '',
  confirmColor: C.mid,
  onConfirm: () => {},
  content: null as React.ReactNode,
});

// Función auxiliar para disparar el modal personalizado
const showActionModal = (config: typeof modalConfig) => {
  setModalConfig({ ...config, visible: true });
};

const closeActionModal = () => {
  setModalConfig(prev => ({ ...prev, visible: false }));
};
const handleToggle = async (value: boolean) => {
  showActionModal({
      title: value ? '¿Abrir cafetería?' : '¿Cerrar pedidos?',
      confirmText: value ? 'Abrir' : 'Cerrar',
      confirmColor: value ? C.success : C.danger,
      onConfirm: async () => {
        setTogglingStatus(true);
        closeActionModal();
        try {
          await toggleCafeteriaStatus(value);
          setCafeteriaOpen(value);
        } catch {
          // Podrías mostrar otro modal de error aquí
        } finally {
          setTogglingStatus(false);
        }
      },
      visible: true,
      content: (
        <Text style={{ color: C.muted, fontSize: 14, lineHeight: 20 }}>
          {value 
            ? 'Los alumnos podrán volver a realizar pedidos normalmente.' 
            : 'Se pausará la recepción de nuevos pedidos hasta que vuelvas a abrir.'}
        </Text>
      )
    });
  };

  const handleBatch = async () => {
// 1. Filtrar los pedidos que están en preparación
  const ordersToReady = orders.filter(o => o.status === 'preparing');
  const ids = ordersToReady.map(o => o.id);

  // 2. Si no hay pedidos, mostrar modal de aviso (usando el mismo ActionModal)
  if (!ids.length) {
    showActionModal({
      title: 'Sin pedidos',
      confirmText: 'Entendido',
      confirmColor: C.muted,
      onConfirm: closeActionModal,
      visible: true,
      content: (
        <Text style={{ color: C.muted }}>
          No hay pedidos actualmente en estado "Preparando" para marcar como listos.
        </Text>
      )
    });
    return;
  }

  // 3. Mostrar modal de confirmación para el lote
  showActionModal({
    title: 'Confirmar entrega por lote',
    confirmText: `Marcar ${ids.length} pedidos`,
    confirmColor: C.success,
    visible: true,
    onConfirm: async () => {
      setConfirmingBatch(true);
      closeActionModal(); // Cerramos el modal inmediatamente para mostrar el feedback en la lista
      try {
        await confirmOrdersBatch(ids);
        await loadOrders(); // Recargamos la lista para ver los cambios
      } catch (error) {
        // Opcional: Mostrar modal de error si falla la API
        console.error("Error en batch:", error);
      } finally {
        setConfirmingBatch(false);
      }
    },
    content: (
      <View>
        <Text style={{ marginBottom: 12, color: C.dark }}>
          ¿Estás seguro de marcar estos <Text style={{ fontWeight: '900' }}>{ids.length}</Text> pedidos como listos para recoger?
        </Text>
        <View style={{ maxHeight: 120, backgroundColor: C.subtle, borderRadius: radius.sm, padding: 10 }}>
           <ScrollView>
             {ordersToReady.map((o, idx) => (
               <Text key={o.id} style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                 #{o.pickup_code} — {o.items.length} productos
               </Text>
             ))}
           </ScrollView>
        </View>
      </View>
    )
  });
  };

  return (
    <View style={s.root}>
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }]}>
        <View>
          <View style={s.headerRowTitle}>
             <Ionicons name="grid-outline" size={16} color={C.muted} style={{marginRight: 6}} />
             <Text style={s.headerLabel}>PANEL DE CONTROL</Text>
          </View>
          <Text style={s.headerTitle}>Cafetería</Text>
        </View>

        <View style={s.headerRight}>
          <View style={s.statusRow}>
            <Ionicons name={cafeteriaOpen ? "lock-open-outline" : "lock-closed-outline"} size={14} color={cafeteriaOpen ? '#4ade80' : '#f87171'} />
            <Text style={[s.statusText, { color: cafeteriaOpen ? '#4ade80' : '#f87171' }]}>
              {cafeteriaOpen ? 'ABIERTA' : 'CERRADA'}
            </Text>
            <Switch
              value={cafeteriaOpen}
              onValueChange={handleToggle}
              trackColor={{ false: '#f87171', true: '#4ade80' }}
              thumbColor={C.white}
              disabled={togglingStatus}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>

          <TouchableOpacity
            style={s.studentViewBtn}
            onPress={() => router.push('/(student)/index')}
          >
            <Ionicons name="person-outline" size={14} color={C.accent} />
            <Text style={s.studentViewText}>Vista alumno</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.statsRow}>
          <StatCard label="Pagados" value={countPaid} color={C.accent} index={0} />
          <StatCard label="Preparando" value={countPreparing} color={C.mid} index={1} />
          <StatCard label="Listos" value={countReady} color={C.success} index={2} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCIONES</Text>
          <View style={s.quickRow}>
            <QuickAction
              label="Franjas"
              iconName="time-outline"
              color={C.dark}
              onPress={() => router.push('/(admin)/settings')}
            />
            <QuickAction
              label="Inventario"
              iconName="cube-outline"
              color="#1D5F8A"
              onPress={() => router.push('/(admin)/inventory')}
            />
            <QuickAction
              label={confirmingBatch ? '...' : 'Lote listo'}
              iconName="checkmark-done-outline"
              color={C.mid}
              onPress={handleBatch}
              disabled={confirmingBatch}
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>VERIFICAR RECOGIDA</Text>
          <View style={s.verifyRow}>
            <View style={s.inputContainer}>
                <Ionicons name="barcode-outline" size={20} color={C.muted} style={s.inputIcon} />
                <TextInput
                    style={s.codeInput}
                    placeholder="0000"
                    placeholderTextColor={C.muted}
                    value={codeInput}
                    onChangeText={setCodeInput}
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyCode}
                />
            </View>
            <TouchableOpacity style={s.verifyBtn} onPress={handleVerifyCode}>
              <Ionicons name="scan-outline" size={20} color={C.white} />
              <Text style={s.verifyBtnText}>Verificar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.listHeader}>
            <View style={s.headerRowTitle}>
                <Ionicons name="list-outline" size={14} color={C.muted} style={{marginRight: 4}} />
                <Text style={s.sectionLabel}>PEDIDOS ACTIVOS</Text>
            </View>
            <Text style={s.listCount}>{orders.length}</Text>
          </View>
          {orders.length === 0 ? (
            <View style={s.emptyBox}>
              <Ionicons name="cafe-outline" size={40} color={C.subtle} />
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
      <ActionModal
        visible={modalConfig.visible}
        title={modalConfig.title}
        confirmText={modalConfig.confirmText}
        confirmColor={modalConfig.confirmColor}
        onClose={closeActionModal}
        onConfirm={modalConfig.onConfirm}
      >
        {modalConfig.content}
      </ActionModal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.dark, paddingTop: 26, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerRowTitle: { flexDirection: 'row', alignItems: 'center' },
  headerLabel: { fontSize: 9, fontWeight: '800', color: C.muted, letterSpacing: 2 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: C.white, letterSpacing: -0.5, marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  studentViewBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(203,162,88,0.15)', borderWidth: 1, borderColor: 'rgba(203,162,88,0.3)', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 },
  studentViewText: { fontSize: 11, fontWeight: '700', color: C.accent },
  scroll: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 4 },
  section: { marginHorizontal: 16, marginTop: 20 },
  sectionLabel: { fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 2, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 8 },
  verifyRow: { flexDirection: 'row', gap: 10 },
  inputContainer: { flex: 1, position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  codeInput: { backgroundColor: C.white, borderRadius: radius.md, paddingVertical: 14, paddingLeft: 40, paddingRight: 16, fontSize: 20, fontWeight: '900', color: C.dark, ...shadow.card },
  verifyBtn: { backgroundColor: C.mid, borderRadius: radius.md, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, ...shadow.card },
  verifyBtnText: { color: C.white, fontWeight: '800', fontSize: 14 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  listCount: { fontSize: 13, fontWeight: '900', color: C.dark, backgroundColor: C.subtle, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  emptyBox: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 14, color: C.muted, fontWeight: '500' },
});