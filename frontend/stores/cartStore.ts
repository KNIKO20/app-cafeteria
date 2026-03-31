// Zustand es una librería de estado global ligera.
// El carrito persiste mientras la app está abierta.
// Al crear el pedido, se vacía.

import { create } from 'zustand';

interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartStore {
  items: CartItem[];
  
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.product_id === item.product_id);
    if (existing) {
      return {
        items: state.items.map(i =>
          i.product_id === item.product_id
          // los ... significa que crea un nuevo objeto copiando todas las propiedades de i
          // y sobreecribe quantity y como devolvemos ese objeto nuevo lo compara con el
          // anterior y zustand detecta los cambios y renderiza
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      };
    }
    return { items: [...state.items, { ...item, quantity: 1 }] };
  }),
  
  removeItem: (product_id) => set((state) => ({
    items: state.items.filter(i => i.product_id !== product_id)
  })),
  
  updateQuantity: (product_id, quantity) => set((state) => ({
    items: quantity === 0
      ? state.items.filter(i => i.product_id !== product_id)
      : state.items.map(i =>
          i.product_id === product_id ? { ...i, quantity } : i
        )
  })),
  
  clearCart: () => set({ items: [] }),
  
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}));