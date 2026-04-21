import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isHydrated: boolean; 

  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  hydrate: () => Promise<void>; 
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isHydrated: false,

  // Guardamos en memoria global y en el almacenamiento físico a la vez
  setAuth: async (user, token) => {
    set({ user, token });
    try {
      await AsyncStorage.setItem('auth-token', token);
      await AsyncStorage.setItem('auth-user', JSON.stringify(user));
      set({ user, token, isHydrated: true });
    } catch (e) {
      console.error("Error guardando sesión", e);
    }
  },

  // Limpiamos ambos al cerrar sesión
  logout: async () => {
    set({ user: null, token: null });
    try {
      await AsyncStorage.removeItem('auth-token');
      await AsyncStorage.removeItem('auth-user');
      set({ token: null, user: null, isHydrated: true });
    } catch (e) {
      console.error("Error borrando sesión", e);
    }
  },

  isAuthenticated: () => !!get().token,

  // Esta función se llama solo una vez cuando la app arranca
  hydrate: async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth-token');
      const storedUser = await AsyncStorage.getItem('auth-user');

      if (storedToken && storedUser) {
        set({ token: storedToken, user: JSON.parse(storedUser), isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      console.error("Error recuperando la sesión", error);
      set({ isHydrated: true }); 
    }
  }
}));