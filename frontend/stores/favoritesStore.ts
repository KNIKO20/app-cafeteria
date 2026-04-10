// Store de favoritos con persistencia en memoria.
// Guarda productos favoritos del alumno entre navegaciones.

import { create } from 'zustand';

export interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  category?: string;
  description?: string;
}

interface FavoritesStore {
  favorites: FavoriteProduct[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (product: FavoriteProduct) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],

  isFavorite: (id: string) => get().favorites.some(f => f.id === id),

  toggleFavorite: (product: FavoriteProduct) => {
    const already = get().isFavorite(product.id);
    set(state => ({
      favorites: already
        ? state.favorites.filter(f => f.id !== product.id)
        : [...state.favorites, product],
    }));
  },

  clearFavorites: () => set({ favorites: [] }),
}));
