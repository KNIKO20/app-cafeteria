import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  isAuthenticated: () => !!get().token,
}));