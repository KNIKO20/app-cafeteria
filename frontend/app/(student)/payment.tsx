import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  ScrollView, Animated, TextInput, KeyboardAvoidingView, Platform,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { processPayment } from '../../services/api';
import ActionModal from '../../components/ActionModal';
import { Ionicons } from '@expo/vector-icons';

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

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId, total } = useLocalSearchParams<{ orderId: string; total: string }>();
  
  // Estados del formulario
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ title: '', message: '', success: false });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // Validación básica
  const isFormValid = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length === 3;

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const matched = cleaned.match(/.{1,4}/g);
    return matched ? matched.join(' ') : cleaned;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    return cleaned;
  };

  const handlePayment = async () => {
    if (!isFormValid) return;

    try {
      setLoading(true);
      // Enviamos un token simulado basado en el número (para que el backend responda)
      const token = cardNumber.includes('4242') ? 'tok_visa_success' : 'fail_token';
      
      const result = await processPayment(orderId as string, token);
      
      setModalData({
        title: 'Pago Confirmado',
        message: `¡Gracias! Tu pedido está en cocina.\n\nCódigo de recogida: ${result.pickup_code}`,
        success: true,
      });
      setModalVisible(true);
    } catch (error: any) {
      setModalData({ 
        title: 'Error en el pago', 
        message: error.response?.data?.error || 'La tarjeta ha sido rechazada por fondos insuficientes.', 
        success: false 
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Card de Resumen */}
        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
          <Text style={styles.summaryLabel}>TOTAL A PAGAR</Text>
          <Text style={styles.totalAmount}>{Number(total ?? 0).toFixed(2)} €</Text>
          <View style={styles.orderBadge}>
             <Text style={styles.orderText}>Pedido #{orderId?.slice(0,8).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Datos de la tarjeta</Text>
        
        <View style={styles.formCard}>
          {/* Input Numero */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de tarjeta</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color={C.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0000 0000 0000 0000"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                maxLength={19}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
              />
            </View>
          </View>

          <View style={styles.row}>
            {/* Expiración */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Expiración</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/YY"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                maxLength={5}
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
              />
            </View>
            
            {/* CVV */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>CVC/CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#A0A0A0"
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
                value={cvv}
                onChangeText={setCvv}
              />
            </View>
          </View>
        </View>

        {/* Botón de Pago */}
        <Pressable 
          style={[styles.payButton, (!isFormValid || loading) && styles.btnDisabled]} 
          onPress={handlePayment}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={18} color={C.white} />
              <Text style={styles.payButtonText}>Pagar ahora</Text>
            </>
          )}
        </Pressable>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Cancelar y volver</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Usa "4242 4242..." para simular éxito.{'\n'}
          Entorno de pruebas seguro.
        </Text>

      </ScrollView>

      <ActionModal
        visible={modalVisible}
        title={modalData.title}
        confirmText={modalData.success ? 'Ir a mis pedidos' : 'Corregir datos'}
        onClose={() => setModalVisible(false)}
        onConfirm={() => {
          setModalVisible(false);
          if (modalData.success) router.replace('/(student)/orders');
        }}
        confirmColor={modalData.success ? C.mid : C.error}
      >
        <Text style={styles.modalText}>{modalData.message}</Text>
      </ActionModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 60 },
  summaryCard: {
    backgroundColor: C.dark,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
      android: { elevation: 10 }
    })
  },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  totalAmount: { color: C.white, fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  orderBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 15 },
  orderText: { color: C.light, fontSize: 12, fontWeight: '600' },
  
  sectionTitle: { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 16, marginLeft: 4 },
  formCard: { backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 20, marginBottom: 30 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: C.muted, marginLeft: 2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  inputIcon: { marginLeft: 15 },
  input: { flex: 1, padding: 16, fontSize: 16, color: C.dark, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 15 },
  
  payButton: { 
    backgroundColor: C.mid, 
    flexDirection: 'row', 
    height: 64, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12 
  },
  btnDisabled: { backgroundColor: '#CCC' },
  payButtonText: { color: C.white, fontSize: 18, fontWeight: '800' },
  
  backBtn: { marginTop: 20, alignItems: 'center' },
  backText: { color: C.muted, fontWeight: '600', fontSize: 14 },
  disclaimer: { marginTop: 30, textAlign: 'center', color: '#BBB', fontSize: 12, lineHeight: 18 },
  modalText: { fontSize: 16, color: '#555', lineHeight: 24, textAlign: 'center' }
});