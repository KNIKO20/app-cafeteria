import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  TouchableOpacity
} from 'react-native';
import { getMyOrders } from '../../services/api';
import { router } from 'expo-router';

interface OrderItem {
  price: number;
  name: string;
  product_name: string;
  quantity: number;
}

interface Order {
  id: string;
  total: number;
  status: string;
  pickup_code: string | null;
  items: OrderItem[];
  created_at: string;
}

export default function MyOrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
        const data = await getMyOrders();
        setOrders(data);
        } catch (error) {
        console.error("Error fetching orders:", error);
        } finally {
        setLoading(false);
        setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
        case 'paid': return '#2ecc71';
        case 'preparing': return '#3498db';
        case 'ready': return '#f1c40f';
        case 'delivered': return '#95a5a6';
        default: return '#e67e22';
        }
    };

    const renderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
        <View style={styles.cardHeader}>
            <Text style={styles.date}>
            {new Date(item.created_at).toLocaleDateString()}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
        </View>

        <View style={styles.itemsList}>
            {item.items.map((prod, index) => (
                <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#444' }}>
                        <Text style={{ fontWeight: 'bold' }}>{prod.quantity}x</Text> {prod.name}
                    </Text>
                    <Text style={{ color: '#888', fontStyle: 'italic' }}>
                        {prod.price}€/ud
                    </Text>
                </View>
            ))}
        </View>

        {/* BOTÓN CONDICIONAL PARA PAGAR */}
        {item.status.toLowerCase() === 'pending_payment' && (
            <TouchableOpacity 
                style={styles.payNowButton}
                onPress={() => router.push({
                    pathname: '/(student)/payment',
                    params: { orderId: item.id, total: item.total }
                })}
            >
                <Text style={styles.payNowText}>💳 Finalizar Pago ({item.total}€)</Text>
            </TouchableOpacity>
        )}

        <View style={styles.footer}>
            <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{item.total}€</Text>
            </View>
            
            {item.pickup_code && (
            <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>CÓDIGO</Text>
                <Text style={styles.codeValue}>{item.pickup_code}</Text>
            </View>
            )}
        </View>
        </View>
    );

    if (loading) {
        return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#FF6B35" />
        </View>
        );
    }

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Mis Pedidos</Text>
        <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
            <Text style={styles.emptyText}>Aún no has realizado pedidos.</Text>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
        />
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '800', color: '#1a1a2e', marginBottom: 20, marginTop: 40 },
    card: { 
        backgroundColor: '#fff', 
        borderRadius: 15, 
        padding: 16, 
        marginBottom: 16, 
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    date: { color: '#999', fontSize: 12, fontWeight: '600' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    itemsList: { marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    itemLine: { fontSize: 14, color: '#444', marginBottom: 4 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase' },
    totalValue: { fontSize: 18, fontWeight: '800', color: '#1a1a2e' },
    codeContainer: { backgroundColor: '#f0f4f8', padding: 8, borderRadius: 10, alignItems: 'center', minWidth: 80 },
    codeLabel: { fontSize: 9, color: '#3498db', fontWeight: '800' },
    codeValue: { fontSize: 20, fontWeight: '900', color: '#1a1a2e', letterSpacing: 1 },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
    payNowButton: {
        backgroundColor: '#FF6B35',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#FF6B35',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 3,
        marginBottom: 10
    },
    payNowText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    });