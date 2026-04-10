import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { processPayment } from '../../services/api'; // Asegúrate de que la ruta sea correcta
import ActionModal from '../../components/ActionModal';

export default function PaymentScreen() {
    const router = useRouter();
    const { orderId, total } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalData, setModalData] = useState({ title: '', message: '', success: false });

    const handlePayment = async (token: string) => {
        try {
            setLoading(true);
            const result = await processPayment(orderId as string, token);
            
            // Configuramos el modal para éxito
            setModalData({
                title: "¡Pago Confirmado!",
                message: `Tu pedido ha sido procesado. Código de recogida: ${result.pickup_code}`,
                success: true
            });
            setModalVisible(true);

        } catch (error: any) {
            const errorMsg = error.response?.data?.error || "Error al procesar el pago";
            setModalData({
                title: "Pago Rechazado",
                message: errorMsg,
                success: false
            });
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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Finalizar Pedido</Text>
                <Text style={styles.subtitle}>ID: {orderId?.toString().slice(0, 8)}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalAmount}>{total}€</Text>
            </View>

            <View style={styles.paymentSection}>
                <Text style={styles.sectionTitle}>Simulador de Pasarela</Text>
                
                {loading ? (
                    <ActivityIndicator size="large" color="#FF6B35" />
                ) : (
                    <>
                        <TouchableOpacity 
                            style={[styles.payButton, { backgroundColor: '#2ecc71' }]} 
                            onPress={() => handlePayment('tok_visa_success')}
                        >
                            <Text style={styles.payButtonText}>💳 Pagar con Visa (Éxito)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.payButton, { backgroundColor: '#3498db' }]} 
                            onPress={() => handlePayment('tok_mastercard_test')}
                        >
                            <Text style={styles.payButtonText}>💳 Pagar con Mastercard (Éxito)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.payButton, { backgroundColor: '#e74c3c' }]} 
                            onPress={() => handlePayment('fail_token')}
                        >
                            <Text style={styles.payButtonText}>❌ Simular Error de Fondos</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => router.push("/")}
                disabled={loading}
            >
                <Text style={styles.cancelText}>Cancelar y volver al carrito</Text>
            </TouchableOpacity>
        </View>
            <ActionModal
                    visible={modalVisible}
                    title={modalData.title}
                    confirmText={modalData.success ? "Ver mis pedidos" : "Reintentar"}
                    onClose={() => setModalVisible(false)}
                    onConfirm={handleModalConfirm}
                    confirmColor={modalData.success ? "#2ecc71" : "#FF6B35"}
                >
                <Text style={{ color: '#444', fontSize: 16 }}>{modalData.message}</Text>
            </ActionModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 30 },
    title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
    subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
    card: { 
        backgroundColor: '#fff', 
        padding: 30, 
        borderRadius: 20, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 40
    },
    totalLabel: { fontSize: 16, color: '#666', textTransform: 'uppercase', letterSpacing: 1 },
    totalAmount: { fontSize: 48, fontWeight: '900', color: '#FF6B35', marginTop: 10 },
    paymentSection: { gap: 15 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#999', textAlign: 'center', marginBottom: 10 },
    payButton: { 
        padding: 18, 
        borderRadius: 15, 
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center'
    },
    payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    cancelBtn: { marginTop: 20, alignItems: 'center' },
    cancelText: { color: '#999', fontSize: 14, fontWeight: '600' }
});