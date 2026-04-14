// Pantalla Favoritos — diseño premium con animaciones
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Image, Animated } from 'react-native';
import { router } from 'expo-router';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { useCartStore } from '../../stores/cartStore';
import { resolveImage, getProductImage } from '../../utils/imageHelper';

const C = {
  dark:   '#1A3329',
  mid:    '#00704A',
  accent: '#CBA258',
  light:  '#D4E9E2',
  white:  '#FFFFFF',
  bg:     '#F7F4EF',
  muted:  '#8BA99A',
  shadow: '#0D2018',
  subtle: '#E8F0EC',
};

type Fav = { id: string; name: string; price: number; image_url?: string; category?: string; description?: string };

// ── Tarjeta de favorito con animación de salida ──────────────────────
function FavCard({ item, onRemove, onAdd, index }: {
  item: Fav; onRemove: () => void; onAdd: () => void; index: number;
}) {
  const enterAnim  = useRef(new Animated.Value(0)).current;
  const removeAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1, useNativeDriver: true,
      tension: 55, friction: 11, delay: index * 70,
    }).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(removeAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 0.5, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start(onRemove);
  };

  const handleAdd = () => {
    Animated.sequence([
      Animated.spring(addScale, { toValue: 0.9, useNativeDriver: true, tension: 300, friction: 6 }),
      Animated.spring(addScale, { toValue: 1,   useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start(onAdd);
  };

  return (
    <Animated.View style={[
      s.card,
      {
        opacity: Animated.multiply(enterAnim, removeAnim),
        transform: [
          { translateX: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
          { scale: removeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
        ],
      },
    ]}>
      {/* Imagen */}
      <View style={s.imgWrap}>
        <FavImage item={item} />
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.name} numberOfLines={2}>{item.name}</Text>
        {item.description ? <Text style={s.desc} numberOfLines={1}>{item.description}</Text> : null}
        <Text style={s.price}>{item.price.toFixed(2)} €</Text>
      </View>

      {/* Acciones */}
      <View style={s.actions}>
        <Animated.View style={{ transform: [{ scale: addScale }] }}>
          <Pressable style={s.addBtn} onPress={handleAdd}>
            <Text style={s.addText}>Añadir</Text>
          </Pressable>
        </Animated.View>

        <Pressable style={s.removeBtn} onPress={handleRemove}>
          <Animated.Text style={[s.removeHeart, { transform: [{ scale: heartScale }] }]}>♥</Animated.Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ── Imagen de favorito con fallback automático ────────────────────────
function FavImage({ item }: { item: Fav }) {
  const initial  = resolveImage(item.name, item.category, item.image_url);
  const fallback = getProductImage(item.name, item.category);
  const [uri, setUri] = useState(initial);
  return (
    <Image
      source={{ uri }}
      style={s.img}
      resizeMode="cover"
      onError={() => { if (uri !== fallback) setUri(fallback); }}
    />
  );
}

export default function FavoritesScreen() {
  const { favorites, toggleFavorite } = useFavoritesStore();
  const { addItem, itemCount } = useCartStore();

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cartAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    Animated.spring(cartAnim, {
      toValue: itemCount() > 0 ? 1 : 0,
      useNativeDriver: true, tension: 80, friction: 10,
    }).start();
  }, [itemCount()]);

  const addToCart = (f: Fav) =>
    addItem({ product_id: f.id, product_name: f.name, price: f.price, quantity: 1, image_url: f.image_url });

  if (favorites.length === 0) {
    return (
      <View style={s.empty}>
        <View style={s.emptyIcon}>
          <Text style={s.emptyIconText}>♡</Text>
        </View>
        <Text style={s.emptyTitle}>Sin favoritos</Text>
        <Text style={s.emptySub}>Toca el corazón en cualquier producto para guardarlo aquí.</Text>
        <Pressable style={s.goBtn} onPress={() => router.push('/(student)/index')}>
          <Text style={s.goBtnText}>Explorar menú</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Animated.View style={[s.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
      }]}>
        <Text style={s.headerLabel}>MIS FAVORITOS</Text>
        <Text style={s.headerTitle}>Guardados</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{favorites.length} guardado{favorites.length !== 1 ? 's' : ''}</Text>
        </View>
      </Animated.View>

      <FlatList
        data={favorites}
        keyExtractor={f => f.id}
        renderItem={({ item, index }) => (
          <FavCard
            item={item} index={index}
            onRemove={() => toggleFavorite(item)}
            onAdd={() => addToCart(item)}
          />
        )}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Botón flotante carrito */}
      <Animated.View style={[s.cartContainer, {
        opacity: cartAnim,
        transform: [{ translateY: cartAnim.interpolate({ inputRange: [0, 1], outputRange: [72, 0] }) }],
      }]}>
        {itemCount() > 0 && (
          <Pressable style={s.cartBtn} onPress={() => router.push('/(student)/cart')}>
            <View style={s.cartBadge}><Text style={s.cartBadgeText}>{itemCount()}</Text></View>
            <Text style={s.cartBtnText}>Ver carrito</Text>
            <Text style={s.cartBtnArrow}>→</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { backgroundColor: C.dark, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20 },
  headerLabel:    { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2, marginBottom: 4 },
  headerTitle:    { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  headerBadge:    {
    marginTop: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  headerBadgeText: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  list:           { padding: 16, paddingBottom: 100 },

  card:           {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 18, marginBottom: 10, padding: 14,
    shadowColor: C.shadow, shadowOpacity: 0.07,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  imgWrap:        {
    width: 70, height: 70, borderRadius: 35,
    overflow: 'hidden', backgroundColor: C.subtle, marginRight: 14,
    shadowColor: C.mid, shadowOpacity: 0.12,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  img:            { width: '100%', height: '100%' },
  imgFallback:    { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imgLetter:      { fontSize: 26, fontWeight: '800', color: C.mid },
  info:           { flex: 1, marginRight: 8 },
  name:           { fontSize: 15, fontWeight: '700', color: C.dark, lineHeight: 20, letterSpacing: 0.1 },
  desc:           { fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 16 },
  price:          { fontSize: 16, fontWeight: '900', color: C.mid, marginTop: 5 },
  actions:        { gap: 8, alignItems: 'center' },
  addBtn:         {
    backgroundColor: C.mid, paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 12, alignItems: 'center',
    shadowColor: C.mid, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  addText:        { color: C.white, fontWeight: '800', fontSize: 13 },
  removeBtn:      {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
  },
  removeHeart:    { fontSize: 18, color: '#DC2626' },

  cartContainer:  { position: 'absolute', bottom: 24, left: 16, right: 16 },
  cartBtn:        {
    backgroundColor: C.dark, borderRadius: 18,
    paddingVertical: 17, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: C.shadow, shadowOpacity: 0.38,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  cartBadge:      {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.mid, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText:  { color: C.white, fontWeight: '900', fontSize: 13 },
  cartBtnText:    { color: C.white, fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center' },
  cartBtnArrow:   { color: C.accent, fontWeight: '900', fontSize: 18 },

  empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 14, backgroundColor: C.bg },
  emptyIcon:      {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyIconText:  { fontSize: 40, color: '#DC2626' },
  emptyTitle:     { fontSize: 22, fontWeight: '900', color: C.dark, letterSpacing: -0.3 },
  emptySub:       { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },
  goBtn:          {
    marginTop: 4, backgroundColor: C.mid,
    paddingHorizontal: 32, paddingVertical: 15, borderRadius: 14,
    shadowColor: C.mid, shadowOpacity: 0.30, shadowRadius: 8, elevation: 5,
  },
  goBtnText:      { color: C.white, fontWeight: '800', fontSize: 15 },
});
