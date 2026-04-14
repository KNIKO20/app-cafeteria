// app/(student)/[slug].tsx
// Pantalla dinámica de categoría.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Image, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getMenu } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { resolveImage, getProductImage } from '../../utils/imageHelper';

const C = {
  dark:  '#1E3932',
  mid:   '#00754A',
  light: '#D4E9E2',
  white: '#FFFFFF',
  bg:    '#F2F0EB',
  muted: '#6B8E7F',
};

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  bocadillo: { title: 'Bocadillos',  description: 'Pan recién hecho y rellenos del día' },
  bocadillos: { title: 'Bocadillos', description: 'Pan recién hecho y rellenos del día' },
  bebida:    { title: 'Bebidas',     description: 'Calientes, frías y zumos naturales'  },
  bebidas:   { title: 'Bebidas',     description: 'Calientes, frías y zumos naturales'  },
  postre:    { title: 'Postres',     description: 'Dulces y repostería artesanal'        },
  postres:   { title: 'Postres',     description: 'Dulces y repostería artesanal'        },
  saludable: { title: 'Saludable',  description: 'Ensaladas, frutas y opciones light'   },
  saludables: { title: 'Saludable',  description: 'Ensaladas, frutas y opciones light'   },
};

interface Product {
  id: string; name: string; price: number;
  image_url?: string; category?: string;
  is_available: boolean; description?: string;
}

// ── Tarjeta de producto ──────────────────────────────────────────────
function ProductCard({
  product, onAdd, isFav, onToggleFav,
}: {
  product: Product; onAdd: () => void; isFav: boolean; onToggleFav: () => void;
}) {
  return (
    <View style={pc.card}>
      <TouchableOpacity style={pc.favBtn} onPress={onToggleFav} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[pc.favIcon, isFav && pc.favActive]}>{isFav ? '♥' : '♡'}</Text>
      </TouchableOpacity>

      <View style={pc.imgWrap}>
        <SlugImage product={product} />
      </View>

      <Text style={pc.name} numberOfLines={2}>{product.name}</Text>
      {product.description
        ? <Text style={pc.desc} numberOfLines={1}>{product.description}</Text>
        : null
      }
      <Text style={pc.price}>{product.price.toFixed(2)} €</Text>

      <TouchableOpacity style={pc.addBtn} onPress={onAdd}>
        <Text style={pc.addText}>Añadir al carrito</Text>
      </TouchableOpacity>
    </View>
  );
}

const pc = StyleSheet.create({
  card: {
    flex: 1, margin: 6, backgroundColor: C.white,
    borderRadius: 14, padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  favBtn:     { alignSelf: 'flex-end', marginBottom: 4 },
  favIcon:    { fontSize: 20, color: '#ccc' },
  favActive:  { color: '#c0392b' },
  imgWrap:    {
    width: 96, height: 96, borderRadius: 48, overflow: 'hidden',
    backgroundColor: C.light, marginBottom: 12,
  },
  img:        { width: '100%', height: '100%' },
  imgFallback:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imgLetter:  { fontSize: 36, fontWeight: '800', color: C.mid },
  name:       { fontSize: 14, fontWeight: '700', color: C.dark, textAlign: 'center', lineHeight: 19, marginBottom: 4 },
  desc:       { fontSize: 11, color: C.muted, textAlign: 'center', marginBottom: 6 },
  price:      { fontSize: 16, fontWeight: '900', color: C.mid, marginBottom: 10 },
  addBtn:     { backgroundColor: C.mid, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, width: '100%', alignItems: 'center' },
  addText:    { color: C.white, fontSize: 12, fontWeight: '700' },
});

// ── Imagen con fallback automático ───────────────────────────────────
function SlugImage({ product }: { product: Product }) {
  const initial  = resolveImage(product.name, product.category, product.image_url);
  const fallback = getProductImage(product.name, product.category);
  const [uri, setUri] = useState(initial);
  return (
    <Image
      source={{ uri }}
      style={pc.img}
      resizeMode="cover"
      onError={() => { if (uri !== fallback) setUri(fallback); }}
    />
  );
}

// ── Pantalla de categoría ────────────────────────────────────────────
export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  // Si slug es undefined o vacío, mostramos "Todo el menú"
  const safeSlug = slug || "";
  const meta = CATEGORY_META[safeSlug.toLowerCase()] ?? { title: 'Todo el Menú', description: 'Todos nuestros productos disponibles' };

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { addItem, itemCount, total } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  useEffect(() => {
    setLoading(true);
    // Limpiamos productos anteriores para evitar "parpadeos" de categorías previas
    setProducts([]);
    
    getMenu(safeSlug)
      .then(data => setProducts(data.filter((p: Product) => p.is_available)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [safeSlug]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (p: Product) =>
    addItem({ product_id: p.id, product_name: p.name, price: p.price, quantity: 1, image_url: p.image_url });

  const toggleFav = (p: Product) =>
    toggleFavorite({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, category: p.category, description: p.description });

  return (
    <View style={s.container}>
      {/* Cabecera de categoría */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtnSmall}>
           <Text style={s.backBtnTextSmall}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>{meta.title}</Text>
        {meta.description ? <Text style={s.subtitle}>{meta.description}</Text> : null}
      </View>

      {/* Buscador dentro de la categoría */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          placeholder={`Buscar en ${meta.title.toLowerCase()}...`}
          placeholderTextColor={C.muted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Contador */}
      <Text style={s.count}>{filtered.length} productos disponibles</Text>

      {/* Grid de productos */}
      {loading ? (
        <View style={s.centered}>
          <Text style={s.loadingText}>Cargando {meta.title.toLowerCase()}...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.emptyTitle}>Sin productos</Text>
          <Text style={s.emptyText}>No hay {meta.title.toLowerCase()} disponibles en este momento.</Text>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backBtnText}>Volver al menú</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          numColumns={Platform.OS === 'web' ? 3 : 2}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onAdd={() => addToCart(item)}
              isFav={isFavorite(item.id)}
              onToggleFav={() => toggleFav(item)}
            />
          )}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Carrito flotante */}
      {itemCount() > 0 && (
        <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/(student)/cart')}>
          <View style={s.cartBadge}><Text style={s.cartBadgeText}>{itemCount()}</Text></View>
          <Text style={s.cartLabel}>Ver carrito</Text>
          <Text style={s.cartTotal}>{total().toFixed(2)} €</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.dark, paddingTop: 20, paddingBottom: 20, paddingHorizontal: 20 },
  backBtnSmall: { marginBottom: 10 },
  backBtnTextSmall: { color: C.light, fontSize: 13, fontWeight: '600' },
  title:        { fontSize: 26, fontWeight: '900', color: C.white },
  subtitle:     { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  searchWrap:   { paddingHorizontal: 16, marginTop: -16 },
  search:       {
    backgroundColor: C.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: C.dark,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  count:        { fontSize: 12, color: C.muted, fontWeight: '600', paddingHorizontal: 20, marginTop: 12, marginBottom: 4 },
  grid:         { paddingHorizontal: 10, paddingBottom: 110 },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingText:  { fontSize: 15, color: C.muted },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: C.dark },
  emptyText:    { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
  backBtn:      { marginTop: 8, backgroundColor: C.mid, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText:  { color: C.white, fontWeight: '700', fontSize: 14 },
  cartBtn:      {
    position: 'absolute', bottom: 24, left: 16, right: 16,
    backgroundColor: C.dark, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: C.dark, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  cartBadge:    { width: 28, height: 28, borderRadius: 14, backgroundColor: C.mid, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText:{ color: C.white, fontWeight: '800', fontSize: 13 },
  cartLabel:    { color: C.white, fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center' },
  cartTotal:    { color: C.light, fontWeight: '800', fontSize: 15 },
});
