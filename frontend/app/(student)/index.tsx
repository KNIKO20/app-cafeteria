// Pantalla principal del alumno.
// Estilo inspirado en Starbucks: secciones "Destacados", paleta verde, sin emojis.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Image, ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { getMenu } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import { useFavoritesStore } from '../../stores/favoritesStore';

const C = {
  dark:  '#1E3932',
  mid:   '#00754A',
  light: '#D4E9E2',
  white: '#FFFFFF',
  bg:    '#F2F0EB',
  muted: '#6B8E7F',
  text:  '#1E3932',
};

interface Product {
  id: string; name: string; price: number;
  image_url?: string; category?: string;
  is_available: boolean; description?: string;
}

// ── Tarjeta compacta para la sección "Destacados" ────────────────────
function FeaturedCard({
  product, onAdd, isFav, onToggleFav,
}: {
  product: Product; onAdd: () => void;
  isFav: boolean; onToggleFav: () => void;
}) {
  return (
    <View style={fc.card}>
      <TouchableOpacity style={fc.favBtn} onPress={onToggleFav}>
        <Text style={[fc.favIcon, isFav && fc.favActive]}>{isFav ? '♥' : '♡'}</Text>
      </TouchableOpacity>

      <View style={fc.imgWrap}>
        {product.image_url
          ? <Image source={{ uri: product.image_url }} style={fc.img} resizeMode="cover" />
          : <View style={fc.imgPlaceholder}><Text style={fc.imgInitial}>{product.name[0]}</Text></View>
        }
      </View>

      <Text style={fc.name} numberOfLines={2}>{product.name}</Text>
      <Text style={fc.price}>{product.price.toFixed(2)} €</Text>

      <TouchableOpacity style={fc.addBtn} onPress={onAdd}>
        <Text style={fc.addText}>Añadir</Text>
      </TouchableOpacity>
    </View>
  );
}

const fc = StyleSheet.create({
  card: {
    width: 152, marginRight: 12,
    backgroundColor: C.white, borderRadius: 14,
    padding: 12, shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  favBtn:       { alignSelf: 'flex-end', marginBottom: 4 },
  favIcon:      { fontSize: 18, color: '#ccc' },
  favActive:    { color: '#c0392b' },
  imgWrap:      { width: 88, height: 88, borderRadius: 44, overflow: 'hidden',
                  alignSelf: 'center', marginBottom: 10, backgroundColor: C.light },
  img:          { width: '100%', height: '100%' },
  imgPlaceholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
                   backgroundColor: C.light },
  imgInitial:   { fontSize: 32, fontWeight: '700', color: C.mid },
  name:         { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18, marginBottom: 4 },
  price:        { fontSize: 14, fontWeight: '800', color: C.mid, marginBottom: 8 },
  addBtn:       { backgroundColor: C.mid, borderRadius: 20, paddingVertical: 7, alignItems: 'center' },
  addText:      { color: C.white, fontSize: 12, fontWeight: '700' },
});

// ── Tarjeta de lista para "Todos los productos" ──────────────────────
function ListCard({
  product, onAdd, isFav, onToggleFav,
}: {
  product: Product; onAdd: () => void;
  isFav: boolean; onToggleFav: () => void;
}) {
  return (
    <View style={lc.card}>
      <View style={lc.imgWrap}>
        {product.image_url
          ? <Image source={{ uri: product.image_url }} style={lc.img} resizeMode="cover" />
          : <View style={lc.imgPlaceholder}><Text style={lc.imgInitial}>{product.name[0]}</Text></View>
        }
      </View>
      <View style={lc.info}>
        <Text style={lc.name} numberOfLines={1}>{product.name}</Text>
        {product.description && <Text style={lc.desc} numberOfLines={1}>{product.description}</Text>}
        <Text style={lc.price}>{product.price.toFixed(2)} €</Text>
      </View>
      <View style={lc.actions}>
        <TouchableOpacity style={lc.favBtn} onPress={onToggleFav}>
          <Text style={[lc.favIcon, isFav && lc.favActive]}>{isFav ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={lc.addBtn} onPress={onAdd}>
          <Text style={lc.addText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const lc = StyleSheet.create({
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white,
                   borderRadius: 12, marginBottom: 10, padding: 12,
                   shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  imgWrap:       { width: 64, height: 64, borderRadius: 32, overflow: 'hidden',
                   backgroundColor: C.light, marginRight: 12 },
  img:           { width: '100%', height: '100%' },
  imgPlaceholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imgInitial:    { fontSize: 22, fontWeight: '700', color: C.mid },
  info:          { flex: 1 },
  name:          { fontSize: 15, fontWeight: '700', color: C.text },
  desc:          { fontSize: 12, color: C.muted, marginTop: 2 },
  price:         { fontSize: 14, fontWeight: '800', color: C.mid, marginTop: 4 },
  actions:       { gap: 8, alignItems: 'center' },
  favBtn:        { padding: 4 },
  favIcon:       { fontSize: 18, color: '#ccc' },
  favActive:     { color: '#c0392b' },
  addBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: C.mid,
                   alignItems: 'center', justifyContent: 'center' },
  addText:       { color: C.white, fontSize: 20, fontWeight: '700', lineHeight: 22 },
});

// ── Chip de categoría ─────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'bocadillo', label: 'Bocadillos' },
  { slug: 'bebida',    label: 'Bebidas'    },
  { slug: 'postre',    label: 'Postres'    },
  { slug: 'saludable', label: 'Saludable'  },
];

// ── Pantalla principal ───────────────────────────────────────────────
export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addItem, itemCount, total } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  useEffect(() => {
    getMenu().then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const addToCart = (p: Product) =>
    addItem({ product_id: p.id, product_name: p.name, price: p.price, quantity: 1, image_url: p.image_url });

  const toggleFav = (p: Product) =>
    toggleFavorite({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, category: p.category, description: p.description });

  const available     = products.filter(p => p.is_available);
  const featured      = available.slice(0, 6);
  const filtered      = available.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* Banner de bienvenida */}
        <View style={s.banner}>
          <Text style={s.bannerHello}>Bienvenido</Text>
          <Text style={s.bannerSub}>¿Qué vas a pedir hoy?</Text>
        </View>

        {/* Buscador */}
        <View style={s.searchWrap}>
          <TextInput
            style={s.search}
            placeholder="Buscar en el menú..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Chips de categoría */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.slug}
              style={s.chip}
              onPress={() => router.push({ pathname: '/category/[slug]', params: { slug: cat.slug } })}
            >
              <Text style={s.chipText}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sección destacados */}
        {!search && (
          <>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Destacados</Text>
              <TouchableOpacity onPress={() => router.push('/category/[slug]' as any)}>
                <Text style={s.seeAll}>Ver todo</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.featuredRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {loading
                ? <Text style={s.loadingText}>Cargando...</Text>
                : featured.map(p => (
                    <FeaturedCard
                      key={p.id} product={p}
                      onAdd={() => addToCart(p)}
                      isFav={isFavorite(p.id)}
                      onToggleFav={() => toggleFav(p)}
                    />
                  ))
              }
            </ScrollView>
          </>
        )}

        {/* Lista completa / resultado de búsqueda */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{search ? 'Resultados' : 'Todo el menú'}</Text>
          <Text style={s.sectionCount}>{filtered.length} productos</Text>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {loading
            ? <Text style={s.loadingText}>Cargando menú...</Text>
            : filtered.length === 0
              ? <Text style={s.emptyText}>Sin resultados para "{search}"</Text>
              : filtered.map(p => (
                  <ListCard
                    key={p.id} product={p}
                    onAdd={() => addToCart(p)}
                    isFav={isFavorite(p.id)}
                    onToggleFav={() => toggleFav(p)}
                  />
                ))
          }
        </View>
      </ScrollView>

      {/* Botón flotante del carrito */}
      {itemCount() > 0 && (
        <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/(student)/cart')}>
          <View style={s.cartBadge}><Text style={s.cartBadgeText}>{itemCount()}</Text></View>
          <Text style={s.cartBtnLabel}>Ver carrito</Text>
          <Text style={s.cartBtnTotal}>{total().toFixed(2)} €</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: C.bg },
  banner:        { backgroundColor: C.dark, paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20 },
  bannerHello:   { fontSize: 26, fontWeight: '900', color: C.white },
  bannerSub:     { fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  searchWrap:    { paddingHorizontal: 16, marginTop: -18 },
  search:        {
    backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: C.text,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  chipsRow:      { marginTop: 14, marginBottom: 4 },
  chip:          {
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 8,
    backgroundColor: C.white, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.light,
  },
  chipText:      { fontSize: 13, fontWeight: '700', color: C.dark },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    paddingHorizontal: 16, marginTop: 22, marginBottom: 12,
  },
  sectionTitle:  { fontSize: 18, fontWeight: '800', color: C.dark },
  sectionCount:  { fontSize: 13, color: C.muted },
  seeAll:        { fontSize: 13, fontWeight: '700', color: C.mid },
  featuredRow:   { marginBottom: 8 },
  loadingText:   { fontSize: 14, color: C.muted, paddingVertical: 20 },
  emptyText:     { fontSize: 14, color: C.muted, paddingVertical: 20, textAlign: 'center' },
  cartBtn:       {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: C.dark, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: C.dark, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  cartBadge:     {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.mid,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: C.white, fontWeight: '800', fontSize: 13 },
  cartBtnLabel:  { color: C.white, fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center' },
  cartBtnTotal:  { color: C.light, fontWeight: '800', fontSize: 15 },
});
