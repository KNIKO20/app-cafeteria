
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert, Animated } from 'react-native';
import { router } from 'expo-router';
import { useCartStore } from '../../stores/cartStore';
import { createOrder } from '../../services/api';
import TimeslotPicker from '../../components/TimeslotPicker';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';

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

// ── Ítem de carrito animado ──────────────────────────────────────────
function CartItem({
  item, onInc, onDec, index,
}: {
  item: { product_id: string; product_name: string; price: number; quantity: number };
  onInc: () => void; onDec: () => void; index: number;
}) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const qtyScale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1, useNativeDriver: true,
      tension: 65, friction: 11, delay: index * 40, // Un poco más rápido al entrar
    }).start();
  }, []);

  // Animación tipo "Pop" rápida
  const animateQty = (callback: () => void) => {
    // 1. Ejecutamos el cambio de estado inmediatamente para que el UI responda ya
    callback(); 

    // 2. Reiniciamos y disparamos la animación en paralelo
    qtyScale.setValue(1); 
    Animated.spring(qtyScale, {
      toValue: 1.4,
      useNativeDriver: true,
      tension: 600, // Tensión muy alta para velocidad
      friction: 10,
    }).start(() => {
      Animated.spring(qtyScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 10,
      }).start();
    });
  };

  return (
    <Animated.View style={[
      s.item,
      {
        opacity: enterAnim,
        transform: [{ 
          translateX: enterAnim.interpolate({ 
            inputRange: [0, 1], 
            outputRange: [-20, 0] 
          }) 
        }],
      },
    ]}>
      {/* Icono con inicial */}
      <View style={s.itemIcon}>
        <Text style={s.itemIconText}>{item.product_name[0].toUpperCase()}</Text>
      </View>

      <View style={s.itemInfo}>
        <Text style={s.itemName} numberOfLines={1}>{item.product_name}</Text>
        <Text style={s.itemUnit}>{item.price.toFixed(2)} €/ud</Text>
      </View>

      <View style={s.itemControls}>
        <Pressable
          style={({ pressed }) => [s.qtyBtn, pressed && { opacity: 0.6 }]}
          onPress={() => animateQty(onDec)}
        >
          <Ionicons name="remove-circle-outline" size={26} color={C.muted} />
        </Pressable>

        <View style={s.qtyContainer}>
          <Animated.Text style={[s.qty, { transform: [{ scale: qtyScale }] }]}>
            {item.quantity}
          </Animated.Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.qtyBtn, pressed && { opacity: 0.6 }]}
          onPress={() => animateQty(onInc)}
        >
          <Ionicons name="add-circle" size={26} color={C.mid} />
        </Pressable>

        <View style={s.totalContainer}>
           <Text style={s.itemTotal}>{(item.price * item.quantity).toFixed(2)}€</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function CartScreen() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCartStore();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  // Animaciones generales
  const headerAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(footerAnim, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
    ]).start();
  }, []);
  const handleOrder = async () => {
    // 1. Validaciones previas
    if (items.length === 0) return;
    if (!selectedSlot || !selectedDate) {
      Alert.alert('Faltan datos', 'Selecciona hora y fecha de recogida.');
      return;
    }

    setLoading(true);
    try {
      // 2. Crear pedido en el backend y obtener el Client Secret de Stripe
      const result = await createOrder({
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        pickup_timeslot_id: selectedSlot,
        pickup_date: selectedDate,
      });

      // 3. Inicializar la hoja de pago de Stripe con el secreto recibido
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.client_secret, 
        merchantDisplayName: 'Cafetería DAW',
        defaultBillingDetails: { name: 'Alumno' }
      });

      if (initError) throw new Error(initError.message);

      // 4. Mostrar la pasarela de Stripe
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        // El usuario canceló o falló el pago, pero el pedido ya está creado como 'pending'
        Alert.alert('Pago no completado', 'Puedes intentar pagar de nuevo desde "Mis Pedidos"');
        router.push('/(student)/orders');
      } else {
        // 5. ¡Éxito!
        clearCart();
        Alert.alert('¡Éxito!', 'Pedido realizado y pagado correctamente.');
        router.push('/(student)/orders');
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Error al procesar el pedido';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // Estado vacío
  if (items.length === 0) {
    return (
      <View style={s.empty}>
        <View style={s.emptyIcon}><Text style={s.emptyIconGlyph}>⊡</Text></View>
        <Text style={s.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={s.emptySub}>Añade productos desde el menú para comenzar tu pedido</Text>
        <Pressable style={s.goMenuBtn} onPress={() => router.push('/(student)/index')}>
          <Text style={s.goMenuText}>Ver menú</Text>
        </Pressable>
      </View>
    );
  }

  const canOrder = !loading && !!selectedSlot && !!selectedDate;

  return (
    <View style={s.container}>
      {/* Header */}
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }]}>
        <Text style={s.headerLabel}>MI PEDIDO</Text>
        <Text style={s.headerTitle}>Carrito</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{items.length} producto{items.length !== 1 ? 's' : ''}</Text>
        </View>
      </Animated.View>

      <FlatList
        data={items}
        keyExtractor={i => i.product_id}
        renderItem={({ item, index }) => (
          <CartItem
            item={item} index={index}
            onInc={() => updateQuantity(item.product_id, item.quantity + 1)}
            onDec={() => updateQuantity(item.product_id, item.quantity - 1)}
          />
        )}
        ListFooterComponent={
          <TimeslotPicker
            onSelect={(slotId, date) => { setSelectedSlot(slotId); setSelectedDate(date); }}
          />
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer */}
      <Animated.View style={[s.footer, {
        opacity: footerAnim,
        transform: [{ translateY: footerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total del pedido</Text>
          <Text style={s.totalAmount}>{total().toFixed(2)} €</Text>
        </View>

        {selectedSlot && (
          <View style={s.slotConfirm}>
            <View style={s.slotDot} />
            <Text style={s.slotText}>Franja horaria seleccionada</Text>
          </View>
        )}

        <Pressable
          style={[s.orderBtn, !canOrder && s.orderBtnOff]}
          onPress={handleOrder}
          disabled={!canOrder}
        >
          <Text style={s.orderBtnText}>
            {loading ? 'Procesando...' : 'Continuar al pago →'}
          </Text>
        </Pressable>

        {!selectedSlot && (
          <Text style={s.hintText}>Selecciona una franja horaria para continuar</Text>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.dark, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  headerLabel:  { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2, marginBottom: 4 },
  headerTitle:  { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  headerBadge:  {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  headerBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  listContent:  { padding: 16, paddingBottom: 20 },

  item:         {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 16, marginBottom: 10, padding: 14,
    shadowColor: '#0D2018', shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  itemIcon:     {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  itemIconText: { fontSize: 18, fontWeight: '800', color: C.mid },
  itemInfo:     { flex: 1, marginRight: 8 },
  itemName:     { fontSize: 15, fontWeight: '700', color: C.dark, letterSpacing: 0.1 },
  itemUnit:     { fontSize: 12, color: C.muted, marginTop: 3 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:       {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.light,
  },
  qtyBtnAdd:    { backgroundColor: C.mid, borderColor: C.mid },
  qtyBtnText:   { fontSize: 18, color: C.dark, fontWeight: '700', lineHeight: 20 },
  qtyBtnAddText:{ color: C.white },
  qty:          { fontSize: 16, fontWeight: '800', minWidth: 26, textAlign: 'center', color: C.dark },
  itemTotal:    { fontSize: 14, fontWeight: '800', color: C.dark, minWidth: 56, textAlign: 'right' },

  footer:       {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28,
    backgroundColor: C.white, gap: 12,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: C.shadow, shadowOpacity: 0.10,
    shadowRadius: 20, shadowOffset: { width: 0, height: -6 }, elevation: 10,
  },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel:   { fontSize: 14, color: C.muted, fontWeight: '600' },
  totalAmount:  { fontSize: 30, fontWeight: '900', color: C.dark, letterSpacing: -0.5 },
  slotConfirm:  {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.subtle, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.light,
  },
  slotDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.mid },
  slotText:     { color: C.mid, fontWeight: '700', fontSize: 13 },
  orderBtn:     {
    backgroundColor: C.mid, padding: 17, borderRadius: 16, alignItems: 'center',
    shadowColor: C.mid, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  orderBtnOff:  { opacity: 0.40, shadowOpacity: 0 },
  orderBtnText: { color: C.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  hintText:     { fontSize: 12, color: C.muted, textAlign: 'center', fontWeight: '500' },

  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 40, backgroundColor: C.bg },
  emptyIcon:    {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyIconGlyph: { fontSize: 40, color: C.mid },
  emptyTitle:   { fontSize: 22, fontWeight: '900', color: C.dark, letterSpacing: -0.3 },
  emptySub:     { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 21 },
  goMenuBtn:    {
    marginTop: 4, backgroundColor: C.mid,
    paddingHorizontal: 32, paddingVertical: 15, borderRadius: 14,
    shadowColor: C.mid, shadowOpacity: 0.30, shadowRadius: 8, elevation: 5,
  },
  totalContainer: { marginLeft: 10, minWidth: 65, alignItems: 'flex-end' },
  qtyContainer: { width: 30, alignItems: 'center' },
  goMenuText:   { color: C.white, fontWeight: '800', fontSize: 15 },
});
