// Pantalla de pago — diseño premium y coherente con la paleta verde
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { processPayment } from '../../services/api';
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
  error:  '#DC2626',
};

// ── Método de pago animado ────────────────────────────────────────────
interface PayMethodProps {
  label: string; sub: string;
  accentColor: string; icon: string;
  token: string; onPress: (token: string) => void;
  disabled: boolean; index: number;
  isError?: boolean;
}

function PayMethod({ label, sub, accentColor, icon, token, onPress, disabled, index, isError }: PayMethodProps) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1, useNativeDriver: true,
      tension: 60, friction: 12, delay: index * 80,
    }).start();
  }, []);

  const handlePressIn = () => {
    if (!disabled) Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, tension: 200, friction: 10 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start(() => {
      if (!disabled) onPress(token);
    });
  };

  return (
    <Animated.View style={[
      pm.wrapper,
      {
        opacity: enterAnim,
        transform: [
          { scale: pressScale },
          { translateX: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
        ],
      },
    ]}>
      <Pressable
        style={[pm.card, { borderLeftColor: accentColor }, disabled && pm.disabled]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {/* Icono */}
        <View style={[pm.iconBox, { backgroundColor: isError ? '#FEE2E2' : C.subtle }]}>
          <Text style={pm.iconText}>{icon}</Text>
        </View>

        {/* Texto */}
        <View style={pm.textBlock}>
          <Text style={[pm.label, isError && { color: C.error }]}>{label}</Text>
          <Text style={pm.sub}>{sub}</Text>
        </View>

        {/* Flecha */}
        <View style={[pm.arrowBox, { backgroundColor: accentColor }]}>
          <Text style={pm.arrowText}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const pm = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 18,
    padding: 16, gap: 14, borderLeftWidth: 4,
    shadowColor: C.shadow, shadowOpacity: 0.07,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  disabled: { opacity: 0.5 },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22 },
  textBlock: { flex: 1 },
  label: { fontSize: 15, fontWeight: '800', color: C.dark, letterSpacing: 0.1 },
  sub: { fontSize: 12, color: C.muted, marginTop: 2, letterSpacing: 0.1 },
  arrowBox: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: C.white, fontWeight: '900', fontSize: 16 },
});

// ── Pantalla de pago ─────────────────────────────────────────────────
export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, total } = useLocalSearchParams<{ orderId: string; total: string }>();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', success: false });

  // Animaciones de entrada
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headerAnim,  { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }),
      Animated.spring(summaryAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 12 }),
    ]).start();
  }, []);

  const handlePayment = async (token: string) => {
    try {
      setLoading(true);
      const result = await processPayment(orderId as string, token);
      setModalData({
        title: 'Pago Confirmado',
        message: `Tu pedido está siendo preparado.\n\nCódigo de recogida:\n${result.pickup_code}`,
        success: true,
      });
      setModalVisible(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Pago rechazado. Inténtalo de nuevo.';
      setModalData({ title: 'Pago rechazado', message: errorMsg, success: false });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    if (modalData.success) router.replace('/(student)/orders');
  };

  const shortId = orderId?.toString().slice(0, 8).toUpperCase() ?? '—';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Resumen del pedido */}
        <Animated.View style={[styles.summaryCard, {
          opacity: summaryAnim,
          transform: [{ translateY: summaryAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>RESUMEN DEL PEDIDO</Text>
              <Text style={styles.orderId}>#{shortId}</Text>
            </View>
            <View style={styles.secureTag}>
              <Text style={styles.secureText}>Pago seguro</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{total} €</Text>
          </View>

          {/* Barra decorativa verde */}
          <View style={styles.accentBar} />
        </Animated.View>

        {/* Métodos */}
        <Animated.View style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
            <Text style={styles.sectionTitle}>Elige cómo pagar</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.mid} />
              <Text style={styles.loadingText}>Procesando pago...</Text>
            </View>
          ) : (
            <>
              <PayMethod
                label="Visa Débito" sub="**** **** **** 4242 · Simulación éxito"
                accentColor={C.mid} icon="💳" token="tok_visa_success"
                onPress={handlePayment} disabled={loading} index={0}
              />
              <PayMethod
                label="Mastercard" sub="**** **** **** 5555 · Simulación éxito"
                accentColor="#2563EB" icon="💳" token="tok_mastercard_test"
                onPress={handlePayment} disabled={loading} index={1}
              />
              <PayMethod
                label="Simular fondos insuficientes" sub="Prueba de rechazo de pago"
                accentColor={C.error} icon="⊘" token="fail_token"
                onPress={handlePayment} disabled={loading} index={2} isError
              />
            </>
          )}
        </Animated.View>

        {/* Volver */}
        <Pressable style={styles.cancelBtn} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.cancelText}>← Volver al carrito</Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          Simulador de pasarela de pago · Ningún cargo real será procesado
        </Text>
      </ScrollView>

      <ActionModal
        visible={modalVisible}
        title={modalData.title}
        confirmText={modalData.success ? 'Ver mis pedidos' : 'Reintentar'}
        onClose={() => setModalVisible(false)}
        onConfirm={handleModalConfirm}
        confirmColor={modalData.success ? C.mid : C.error}
      >
        <Text style={{ color: '#444', fontSize: 16, lineHeight: 26 }}>{modalData.message}</Text>
      </ActionModal>
    </View>
  );
}

const styles = StyleSheet.create({
  content:       { padding: 20, paddingBottom: 50 },
  summaryCard:   {
    backgroundColor: C.white, borderRadius: 22, padding: 20, marginBottom: 24, overflow: 'hidden',
    shadowColor: C.shadow, shadowOpacity: 0.10,
    shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  summaryTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryLabel:  { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2, marginBottom: 6 },
  orderId:       { fontSize: 20, fontWeight: '900', color: C.dark, letterSpacing: 1 },
  secureTag:     {
    backgroundColor: C.subtle, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.light,
  },
  secureText:    { fontSize: 11, color: C.mid, fontWeight: '700', letterSpacing: 0.3 },
  divider:       { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel:    { fontSize: 16, color: C.muted, fontWeight: '600' },
  totalAmount:   { fontSize: 38, fontWeight: '900', color: C.dark, letterSpacing: -1 },
  accentBar:     {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 4, backgroundColor: C.mid,
  },
  sectionHeader: { marginBottom: 14 },
  sectionLabel:  { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2, marginBottom: 4 },
  sectionTitle:  { fontSize: 20, fontWeight: '900', color: C.dark, letterSpacing: -0.3 },
  loadingBox:    { alignItems: 'center', paddingVertical: 40, gap: 14 },
  loadingText:   { color: C.muted, fontSize: 15, fontWeight: '600' },
  cancelBtn:     { marginTop: 16, alignItems: 'center', padding: 14 },
  cancelText:    { color: C.muted, fontSize: 14, fontWeight: '700' },
  disclaimer:    { marginTop: 12, fontSize: 11, color: '#C0C0C0', textAlign: 'center', lineHeight: 16 },
});
