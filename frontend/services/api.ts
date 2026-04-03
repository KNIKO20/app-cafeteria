// El servicio centraliza TODAS las llamadas al backend.
// Si cambias la URL del backend, solo lo cambias aquí.

import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
// process.env.EXPO_PUBLIC_API_URL ||
const API_URL = 'http://localhost:8000/api';

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

// ── Auth ──────────────────────────────────────────────
export const loginWithGoogle = (googleToken: string) =>
  api.post('/auth/google/', { token: googleToken }).then(r => r.data);

export const getMe = (token: string) =>
  // Aquí inyectamos el token temporalmente en los headers porque en el momento
  // del login, el Zustand store aún no se ha actualizado con el nuevo token.
  api.get('/auth/me/', { headers: { Authorization: `Bearer ${token}` } }).then(r => ({
    id: r.data.id,
    email: r.data.email,
    name: r.data.name,
    is_admin: r.data.role === 'admin' // Mapeo de backend ('admin') a frontend (boolean)
  }));


// ── Productos ──────────────────────────────────────────
export const getMenu = (category?: string) =>
  api.get('/products/', { params: { category } }).then(r => r.data);

// ── Pedidos ───────────────────────────────────────────
export const createOrder = (data: {
  items: { product_id: string; quantity: number }[];
  pickup_timeslot_id: string;
  pickup_date: string;
}) => api.post('/orders/', data).then(r => r.data);

export const getMyOrders = () =>
  api.get('/orders/my/').then(r => r.data);

export const processPayment = (orderId: string, paymentToken: string) =>
  api.post(`/orders/${orderId}/pay/`, { payment_token: paymentToken }).then(r => r.data);

// ── Admin ──────────────────────────────────────────────
export const getPendingOrders = () =>
  api.get('/admin/orders/pending/').then(r => r.data);

export const updateOrderStatus = (orderId: string, status: string) =>
  api.patch(`/admin/orders/${orderId}/status/`, { status }).then(r => r.data);

export const verifyPickupCode = (code: string) =>
  api.post('/admin/verify-code/', { code }).then(r => r.data);

export const createProduct = (productData: any)=>
  api.post('/admin/products/', productData ).then(r=>r.data);

export const getInventory = ()=>
  api.get('/admin/products/').then(r=>r.data);

export const updateProduct = (productId: string, data: any) =>
  api.put(`/admin/products/${productId}/`, data).then(r => r.data);

export const deleteProduct = (productId: string)=>
  api.delete(`/admin/products/${productId}/`).then(r=>r.data);

export const updateStockProduct = (productId: string, quantity: number) =>
  api.patch(`/admin/products/${productId}/stock/`, { quantity }).then(r => r.data);