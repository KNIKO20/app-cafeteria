import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, Switch,
} from 'react-native';
import { router } from 'expo-router';
import {
  getPendingOrders, updateOrderStatus,
  verifyPickupCode, toggleCafeteriaStatus,
  confirmOrdersBatch,
} from '../../services/api';

interface OrderItem { product_id: string; name: string; qty: number; }
interface Order {
  id: string; pickup_code: string;
  pickup_timeslot: string; status: string; items: OrderItem[];
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [codeInput, setCodeInput] = useState('');
  const [cafeteriaOpen, setCafeteriaOpen] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [confirmingBatch, setConfirmingBatch] = useState(false);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    const data = await getPendingOrders();
    setOrders(data);
  };

  // ── Verificar código de recogida ──────────────────────────────────
  const handleVerifyCode = async () => {
    if (!codeInput.trim()) return;
    const result = await verifyPickupCode(codeInput.trim());
    if (result.valid) {
      Alert.alert(
        '✅ Pedido válido',
        `${result.items.map((i: OrderItem) => `${i.qty}x ${i.name}`).join('\n')}\nTotal: ${result.total}€\n${result.is_paid ? '✅ Pagado' : '❌ No pagado'}`
      );
    } else {
      Alert.alert('❌ Código no encontrado');
    }
    setCodeInput('');
  };

  // ── Abrir / Cerrar cafetería ───────────────────────────────────────
  const handleToggleCafeteria = async (value: boolean) => {
    Alert.alert(
      value ? 'Abrir cafetería' : 'Cerrar pedidos',
      value
        ? '¿Deseas abrir la cafetería para nuevos pedidos?'
        : '¿Seguro que quieres cerrar los pedidos? Los alumnos no podrán hacer nuevos pedidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: value ? 'default' : 'destructive',
          onPress: async () => {
            setTogglingStatus(true);
            try {
              await toggleCafeteriaStatus(value);
              setCafeteriaOpen(value);
            } catch {
              Alert.alert('Error', 'No se pudo cambiar el estado de la cafetería.');
            } finally {
              setTogglingStatus(false);
            }
          },
        },
      ]
    );
  };

  // ── Confirmación masiva ───────────────────────────────────────────
  const handleConfirmBatch = async () => {
    const preparingIds = orders.filter(o => o.status === 'preparing').map(o => o.id);
    if (preparingIds.length === 0) {
      Alert.alert('Sin pedidos', 'No hay pedidos en preparación para confirmar.');
      return;
    }
    Alert.alert(
      'Confirmar pedidos',
      `¿Marcar ${preparingIds.length} pedido(s) como listos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Confirmar ${preparingIds.length}`,
          onPress: async () => {
            setConfirmingBatch(true);
            try {
              await confirmOrdersBatch(preparingIds);
              loadOrders();
            } catch {
              Alert.alert('Error', 'No se pudo confirmar los pedidos.');
            } finally {
              setConfirmingBatch(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabecera con estado */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Panel de Cafetería</Text>
        <View style={styles.statusControl}>
          <Text style={[styles.statusLabel, { color: cafeteriaOpen ? '#2ecc71' : '#e74c3c' }]}>
            {cafeteriaOpen ? 'ABIERTA' : 'CERRADA'}
          </Text>
          <Switch
            value={cafeteriaOpen}
            onValueChange={handleToggleCafeteria}
            trackColor={{ false: '#e74c3c', true: '#2ecc71' }}
            thumbColor="#fff"
            disabled={togglingStatus}
          />
        </View>
      </View>

      {/* Accesos rápidos admin */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnSettings]}
          onPress={() => router.push('/(admin)/settings')}
        >
          <Text style={styles.quickBtnEmoji}>🕐</Text>
          <Text style={styles.quickBtnLabel}>Franjas Horarias</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnInventory]}
          onPress={() => router.push('/(admin)/inventory')}
        >
          <Text style={styles.quickBtnEmoji}>📦</Text>
          <Text style={styles.quickBtnLabel}>Inventario</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, styles.quickBtnBatch, confirmingBatch && { opacity: 0.5 }]}
          onPress={handleConfirmBatch}
          disabled={confirmingBatch}
        >
          <Text style={styles.quickBtnEmoji}>✅</Text>
          <Text style={styles.quickBtnLabel}>
            {confirmingBatch ? 'Procesando...' : 'Confirmar lote'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verificador de código */}
      <View style={styles.codeVerifier}>
        <TextInput
          style={styles.codeInput}
          placeholder="Código de recogida"
          value={codeInput}
          onChangeText={setCodeInput}
          keyboardType="numeric"
          maxLength={4}
          returnKeyType="done"
          onSubmitEditing={handleVerifyCode}
        />
        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode}>
          <Text style={styles.verifyBtnText}>✓ Verificar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de pedidos */}
      <Text style={styles.subtitle}>Pedidos Pendientes ({orders.length})</Text>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderCode}>#{item.pickup_code}</Text>
              <Text style={styles.orderSlot}>{item.pickup_timeslot}</Text>
              <Text style={[styles.badge, item.status === 'paid' ? styles.badgePaid : styles.badgePreparing]}>
                {item.status === 'paid' ? 'Pagado' : 'Preparando'}
              </Text>
            </View>

            {item.items.map((i, idx) => (
              <Text key={idx} style={styles.orderItem}>• {i.qty}x {i.name}</Text>
            ))}

            <View style={styles.orderActions}>
              {item.status === 'paid' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.preparingBtn]}
                  onPress={async () => { await updateOrderStatus(item.id, 'preparing'); loadOrders(); }}
                >
                  <Text style={styles.actionBtnText}>Iniciar preparación</Text>
                </TouchableOpacity>
              )}
              {item.status === 'preparing' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.readyBtn]}
                  onPress={async () => { await updateOrderStatus(item.id, 'ready'); loadOrders(); }}
                >
                  <Text style={styles.actionBtnText}>✅ Listo para recoger</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  statusControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  quickActions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  quickBtnSettings: { backgroundColor: '#1a1a2e' },
  quickBtnInventory: { backgroundColor: '#3498db' },
  quickBtnBatch: { backgroundColor: '#2ecc71' },
  quickBtnEmoji: { fontSize: 20 },
  quickBtnLabel: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, color: '#555' },
  codeVerifier: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  codeInput: {
    flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 10,
    fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: '700',
  },
  verifyBtn: { backgroundColor: '#2ecc71', padding: 14, borderRadius: 10, justifyContent: 'center' },
  verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  orderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  orderCode: { fontSize: 22, fontWeight: '800', color: '#FF6B35' },
  orderSlot: { fontSize: 14, color: '#666', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700' },
  badgePaid: { backgroundColor: '#d4edda', color: '#155724' },
  badgePreparing: { backgroundColor: '#fff3cd', color: '#856404' },
  orderItem: { fontSize: 15, color: '#444', marginBottom: 2 },
  orderActions: { marginTop: 12 },
  actionBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
  preparingBtn: { backgroundColor: '#3498db' },
  readyBtn: { backgroundColor: '#2ecc71' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
