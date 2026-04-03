import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { getPendingOrders, updateOrderStatus, verifyPickupCode } from '../../services/api';

export default function AdminDashboard() {
    interface OrderItem {
        product_id: string;
        name: string;
        qty: number;
    }

    interface Order {
        id: string;
        pickup_code: string;
        pickup_timeslot: string;
        status: string;
        items: OrderItem[];
    }

    const [orders, setOrders] = useState<Order[]>([]);
    const [codeInput, setCodeInput] = useState('');


    useEffect(() => {
    loadOrders();
    // Refresca cada 30 segundos automáticamente
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
    }, []);

    const loadOrders = async () => {
    const data = await getPendingOrders();
    setOrders(data);
    };

    const handleVerifyCode = async () => {
    const result = await verifyPickupCode(codeInput);
    if (result.valid) {
        Alert.alert(
        `✅ Pedido válido`,
        `${result.items.map((i: OrderItem) => `${i.qty}x ${i.name}`).join('\n')}\nTotal: ${result.total}€\n${result.is_paid ? '✅ Pagado' : '❌ No pagado'}`
        );
    } else {
        Alert.alert('❌ Código no encontrado');
    }
    setCodeInput('');
    };

    return (
    <View style={styles.container}>
        <Text style={styles.title}>Panel de Cafetería</Text>
        
        {/* Verificador de código */}
        <View style={styles.codeVerifier}>
        <TextInput
            style={styles.codeInput}
            placeholder="Código de recogida"
            value={codeInput}
            onChangeText={setCodeInput}
            keyboardType="numeric"
            maxLength={4}
        />
        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode}>
            <Text style={styles.verifyBtnText}>✓ Verificar</Text>
        </TouchableOpacity>
        </View>
        
        {/* Lista de pedidos pendientes */}
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
                    <Text style={styles.actionBtnText}>✅ Listo</Text>
                </TouchableOpacity>
                )}
            </View>
            </View>
        )}
        />
    </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8', padding: 16 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: '#1a1a2e' },
    subtitle: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
    codeVerifier: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    codeInput: { flex: 1, backgroundColor: '#fff', padding: 14, borderRadius: 10, fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: '700' },
    verifyBtn: { backgroundColor: '#2ecc71', padding: 14, borderRadius: 10, justifyContent: 'center' },
    verifyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
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