// El servicio centraliza TODAS las llamadas al backend.
// Si cambias la URL del backend, solo lo cambias aquí.

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

// Instancia de Axios con el token automático
const api = axios.create({ baseURL: API_URL });

// Interceptor: añade el token JWT a cada petición
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────────────────
export const loginWithGoogle = (googleToken: string) =>
  api.post('/auth/google/', { token: googleToken }).then(r => r.data);

export const getMe = (token: string) =>
  api.get('/auth/me/', { headers: { Authorization: `Bearer ${token}` } }).then(r => ({
    id: r.data.id,
    email: r.data.email,
    name: r.data.name,
    is_admin: r.data.role === 'admin',
  }));

// ── Productos ─────────────────────────────────────────────────────────
export const getMenu = (category?: string) =>
  api.get('/products/', { params: { category } }).then(r => r.data);

// ── Pedidos ───────────────────────────────────────────────────────────
export const createOrder = (data: {
  items: { product_id: string; quantity: number }[];
  pickup_timeslot_id: string;
  pickup_date: string;
}) => api.post('/orders/', data).then(r => r.data);

export const getMyOrders = () =>
  api.get('/orders/my/').then(r => r.data);

export const processPayment = (orderId: string, paymentToken: string) =>
  api.post(`/orders/${orderId}/pay/`, { payment_token: paymentToken }).then(r => r.data);

// ── Admin: Pedidos ────────────────────────────────────────────────────
export const getPendingOrders = () =>
  api.get('/admin/orders/pending/').then(r => r.data);

export const updateOrderStatus = (orderId: string, status: string) =>
  api.patch(`/admin/orders/${orderId}/status/`, { status }).then(r => r.data);

export const verifyPickupCode = (code: string) =>
  api.post('/admin/orders/verify/', { code }).then(r => r.data);

/**
 * Confirma masivamente un lote de pedidos (los marca como 'ready').
 * @param orderIds - Array de IDs de pedidos a confirmar.
 */
export const confirmOrdersBatch = (orderIds: string[]) =>
  api.post('/admin/orders/confirm-batch/', { order_ids: orderIds }).then(r => r.data);

// ── Admin: Cafetería ──────────────────────────────────────────────────
/**
 * Abre o cierra la cafetería para nuevos pedidos.
 * @param open - true para abrir, false para cerrar.
 */
export const toggleCafeteriaStatus = (open: boolean) =>
  api.post('/admin/cafeteria/status/', { is_open: open }).then(r => r.data);

// ── Admin: Franjas Horarias (TimeSlots) ───────────────────────────────
/**
 * Devuelve todas las franjas horarias configuradas.
 */
export const getSlots = () =>
  api.get('/admin/slots/').then(r => r.data);

/**
 * Actualiza una franja horaria (límite de pedidos, estado activo).
 * @param slotId - ID de la franja.
 * @param data   - Campos a actualizar (max_orders, is_active…).
 */
export const updateSlot = (slotId: string, data: {
  max_orders?: number;
  is_active?: boolean;
  start_time?: string;
  end_time?: string;
}) => api.patch(`/admin/slots/${slotId}/`, data).then(r => r.data);

// ── Admin: Inventario ─────────────────────────────────────────────────
export const createProduct = (productData: any) =>
  api.post('/admin/products/', productData).then(r => r.data);

export const getInventory = () =>
  api.get('/admin/products/').then(r => r.data);

export const updateProduct = (productId: string, data: any) =>
  api.put(`/admin/products/${productId}/`, data).then(r => r.data);

export const deleteProduct = (productId: string) =>
  api.delete(`/admin/products/${productId}/`).then(r => r.data);

export const updateStockProduct = (productId: string, quantity: number) =>
  api.patch(`/admin/products/${productId}/stock/`, { quantity }).then(r => r.data);
