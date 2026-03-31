import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    is_available: boolean;
  };
  onAddToCart: () => void;
}

export default function ProductCard({ product, onAddToCart }: Props) {
  return (
    <View style={[styles.card, !product.is_available && styles.cardDisabled]}>
      {product.image_url && (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      )}
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.price}>{product.price.toFixed(2)}€</Text>
      
      <TouchableOpacity
        style={[styles.addBtn, !product.is_available && styles.addBtnDisabled]}
        onPress={onAddToCart}
        disabled={!product.is_available}
      >
        <Text style={styles.addBtnText}>
          {product.is_available ? '+ Añadir' : 'No disponible'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, backgroundColor: '#fff', borderRadius: 12, padding: 12, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 },
  cardDisabled: { opacity: 0.5 },
  image: { width: '100%', height: 100, borderRadius: 8, marginBottom: 8, backgroundColor: '#f0f0f0' },
  name: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 4, minHeight: 36 },
  price: { fontSize: 16, fontWeight: '800', color: '#FF6B35', marginBottom: 8 },
  addBtn: { backgroundColor: '#FF6B35', borderRadius: 8, padding: 8, alignItems: 'center' },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});