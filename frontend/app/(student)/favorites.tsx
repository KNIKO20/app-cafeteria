// Pantalla de favoritos — paleta verde, sin emojis.

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useCartStore } from '../../stores/cartStore';

const C = {
  dark:  '#1E3932',
  mid:   '#00754A',
  light: '#D4E9E2',
  white: '#FFFFFF',
  bg:    '#F2F0EB',
  muted: '#6B8E7F',
};

type Fav = { id: string; name: string; price: number; image_url?: string; category?: string; description?: string };

function FavCard({ item, onRemove, onAdd }: { item: Fav; onRemove: () => void; onAdd: () => void }) {
  return (
    <View style={s.card}>
      <View style={s.imgWrap}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={s.img} resizeMode="cover" />
          : <View style={s.imgFallback}><Text style={s.imgLetter}>{item.name[0].toUpperCase()}</Text></View>
        }
      </View>

      <View style={s.info}>
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
        {item.description ? <Text style={s.desc} numberOfLines={1}>{item.description}</Text> : null}
        <Text style={s.price}>{item.price.toFixed(2)} €</Text>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.addBtn} onPress={onAdd}>
          <Text style={s.addText}>Añadir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.removeBtn} onPress={onRemove}>
          <Text style={s.removeText}>Quitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { addItem, itemCount } = useCartStore();

  const add = (f: Fav) => addItem({ product_id: f.id, product_name: f.name, price: f.price, quantity: 1, image_url: f.image_url });

  if (favorites.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTitle}>Sin favoritos</Text>
        <Text style={s.emptySub}>Toca el corazón en cualquier producto para guardarlo aquí.</Text>
        <TouchableOpacity style={s.goBtn} onPress={() => router.push('/')}>
          <Text style={s.goBtnText}>Explorar menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mis Favoritos</Text>
        <Text style={s.headerCount}>{favorites.length} guardado{favorites.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={f => f.id}
        renderItem={({ item }) => (
          <FavCard item={item} onRemove={() => toggleFavorite(item)} onAdd={() => add(item)} />
        )}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      {itemCount() > 0 && (
        <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/cart')}>
          <Text style={s.cartBtnText}>Ver carrito ({itemCount()})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  header:     { backgroundColor: C.dark, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle:{ fontSize: 24, fontWeight: '900', color: C.white },
  headerCount:{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  list:       { padding: 16, paddingBottom: 100 },

  card:       {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 14, marginBottom: 10, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  imgWrap:    { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', backgroundColor: C.light, marginRight: 12 },
  img:        { width: '100%', height: '100%' },
  imgFallback:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imgLetter:  { fontSize: 26, fontWeight: '800', color: C.mid },
  info:       { flex: 1 },
  name:       { fontSize: 15, fontWeight: '700', color: C.dark, lineHeight: 20 },
  desc:       { fontSize: 12, color: C.muted, marginTop: 2 },
  price:      { fontSize: 15, fontWeight: '900', color: C.mid, marginTop: 4 },
  actions:    { gap: 8 },
  addBtn:     { backgroundColor: C.mid, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  addText:    { color: C.white, fontWeight: '700', fontSize: 13 },
  removeBtn:  { borderWidth: 1, borderColor: C.muted, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, alignItems: 'center' },
  removeText: { color: C.muted, fontWeight: '600', fontSize: 12 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12, backgroundColor: C.bg },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: C.dark },
  emptySub:   { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },
  goBtn:      { marginTop: 8, backgroundColor: C.mid, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  goBtnText:  { color: C.white, fontWeight: '700', fontSize: 15 },

  cartBtn:    {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: C.dark, padding: 16, borderRadius: 16, alignItems: 'center',
    shadowColor: C.dark, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  cartBtnText:{ color: C.white, fontWeight: '700', fontSize: 15 },
});
