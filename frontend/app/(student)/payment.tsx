import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { processPayment } from '../../services/api';
import ActionModal from '../../components/ActionModal';

// ── Tarjeta de método de pago ────────────────────────────────────────
interface PayMethodProps {
  label: string;
  sub: string;
  color: string;
  emoji: string;
  token: string;
  onPress: (token: string) => void;
  disabled: boolean;
}

function PayMethod({ label, sub, color, emoji, token, onPress, disabled }: PayMethodProps) {
  return (
    <TouchableOpacity
      style={[cardStyle.card, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={() => onPress(token)}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={cardStyle.emoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={cardStyle.label}>{label}</Text>
        <Text style={cardStyle.sub}>{sub}</Text>
      </View>
      <View style={[cardStyle.arrow, { backgroundColor: color }]}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>→</Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyle = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  emoji: { fontSize: 28 },
  label: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  sub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  arrow: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
});

// ── Pantalla de pago ─────────────────────────────────────────────────
export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, total } = useLocalSearchParams<{ orderId: string; total: string }>();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', success: false });

  const handlePayment = async (token: string) => {
    try {
      setLoading(true);
      const result = await processPayment(orderId as string, token);
      setModalData({
        title: '¡Pago Confirmado! 🎉',
        message: `Tu pedido está en preparación.\n\nCódigo de recogida:\n${result.pickup_code}`,
        success: true,
      });
      setModalVisible(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Pago rechazado. Inténtalo de nuevo.';
      setModalData({ title: 'Pago Rechazado ❌', message: errorMsg, success: false });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    if (modalData.success) {
      router.replace('/(student)/orders');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* Resumen del pedido */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>RESUMEN DEL PEDIDO</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Nº Pedido</Text>
            <Text style={styles.summaryVal}>#{orderId?.toString().slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalAmount}>{total}€</Text>
          </View>
        </View>

        {/* Seguridad */}
        <View style={styles.secureRow}>
          <Text style={styles.secureText}>🔒 Pago seguro simulado · SSL</Text>
        </View>

        {/* Métodos de pago */}
        <Text style={styles.sectionTitle}>Elige tu método</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Procesando pago...</Text>
          </View>
        ) : (
          <>
            <PayMethod
              label="Visa Débito"
              sub="**** **** **** 4242 · Sim. éxito"
              color="#2ecc71"
              emoji="💳"
              token="tok_visa_success"
              onPress={handlePayment}
              disabled={loading}
            />
            <PayMethod
              label="Mastercard"
              sub="**** **** **** 5555 · Sim. éxito"
              color="#3498db"
              emoji="💳"
              token="tok_mastercard_test"
              onPress={handlePayment}
              disabled={loading}
            />
            <PayMethod
              label="Simular fondos insuficientes"
              sub="Prueba de error de pago"
              color="#e74c3c"
              emoji="❌"
              token="fail_token"
              onPress={handlePayment}
              disabled={loading}
            />
          </>
        )}

        {/* Cancelar */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>← Volver al carrito</Text>
        </TouchableOpacity>

        {/* Disclaimer simulador */}
        <Text style={styles.disclaimer}>
          ⚠️ Este es un simulador de pasarela de pago. Ningún cargo real será procesado.
        </Text>
      </ScrollView>

      <ActionModal
        visible={modalVisible}
        title={modalData.title}
        confirmText={modalData.success ? 'Ver mis pedidos' : 'Reintentar'}
        onClose={() => setModalVisible(false)}
        onConfirm={handleModalConfirm}
        confirmColor={modalData.success ? '#2ecc71' : '#FF6B35'}
      >
        <Text style={{ color: '#444', fontSize: 16, lineHeight: 24 }}>{modalData.message}</Text>
      </ActionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 5,
  },
  summaryLabel: {
    fontSize: 11, fontWeight: '800', color: '#FF6B35',
    letterSpacing: 2, marginBottom: 14,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey: { fontSize: 14, color: '#666' },
  summaryVal: { fontSize: 14, fontWeight: '700', color: '#333', fontVariant: ['tabular-nums'] },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  totalLabel: { fontSize: 16, color: '#666', fontWeight: '600' },
  totalAmount: { fontSize: 32, fontWeight: '900', color: '#FF6B35' },
  secureRow: { alignItems: 'center', marginBottom: 20 },
  secureText: { fontSize: 12, color: '#aaa', fontWeight: '600' },
  sectionTitle: {
    fontSize: 14, fontWeight: '800', color: '#999',
    letterSpacing: 1, marginBottom: 12,
  },
  loadingBox: { alignItems: 'center', paddingVertical: 30, gap: 12 },
  loadingText: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  cancelBtn: { marginTop: 8, alignItems: 'center', padding: 14 },
  cancelText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  disclaimer: {
    marginTop: 20, fontSize: 11, color: '#bbb',
    textAlign: 'center', lineHeight: 16,
  },
});
