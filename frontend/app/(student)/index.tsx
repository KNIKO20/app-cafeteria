// La pantalla principal del alumno.
// Muestra el menú con filtros y permite añadir al carrito.
// Funciona igual en web y en móvil gracias a Expo.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Platform
} from 'react-native';
import { router } from 'expo-router';
import { getMenu } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import ProductCard from '../../components/ProductCard';

const CATEGORIES = [
  { key: null, label: 'Todo' },
  { key: 'bocadillo', label: '🥪 Bocadillos' },
  { key: 'bebida', label: '🥤 Bebidas' },
  { key: 'postre', label: '🍮 Postres' },
  { key: 'saludable', label: '🥗 Saludable' },
];

export default function MenuScreen() {
  interface Product {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    category?: string;
    is_available: boolean;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { addItem, itemCount, total } = useCartStore();
  
  useEffect(() => {
    loadMenu();
  }, [selectedCategory]);
  
  const loadMenu = async () => {
    setLoading(true);
    try {
      const data = await getMenu(selectedCategory || undefined);
      console.log(data);
      
      setProducts(data);
    } catch (error) {
      console.error('Error cargando menú:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtro de búsqueda local
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );
  
  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar producto..."
        value={searchText}
        onChangeText={setSearchText}
      />
      
      {/* Filtros de categoría */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => String(c.key)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === item.key && styles.categoryActive]}
            onPress={() => setSelectedCategory(item.key)}
          >
            <Text style={selectedCategory === item.key ? styles.categoryTextActive : styles.categoryText}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.categoriesList}
        showsHorizontalScrollIndicator={false}
      />
      
      {/* Lista de productos */}
      <FlatList
        data={filteredProducts}
        keyExtractor={p => p.id}
        numColumns={Platform.OS === 'web' ? 3 : 2}   // 3 columnas en web, 2 en móvil
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onAddToCart={() => addItem({
              product_id: item.id,
              product_name: item.name,
              price: item.price,
              quantity: 1,
              image_url: item.image_url
            })}
          />
        )}
        contentContainerStyle={styles.productList}
      />
      
      {/* Botón de carrito flotante */}
      {itemCount() > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/(student)/cart')}
        >
          <Text style={styles.cartButtonText}>
            🛒 Ver carrito ({itemCount()}) — {total().toFixed(2)}€
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: {
    margin: 12, padding: 12, backgroundColor: '#fff',
    borderRadius: 10, fontSize: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  categoriesList: { paddingHorizontal: 12, marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
  },
  categoryActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  categoryText: { color: '#666', fontWeight: '500' },
  categoryTextActive: { color: '#fff', fontWeight: '700' },
  productList: { padding: 8 },
  cartButton: {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: '#FF6B35', padding: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#FF6B35', shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  cartButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});