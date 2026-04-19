// Pantalla principal — diseño premium con animaciones fluidas
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Image, ScrollView, Animated, Pressable, StatusBar,
  Platform, Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getMenu } from '../../services/api';
import { useCartStore } from '../../stores/cartStore';
import { useFavoritesStore } from '../../stores/favoritesStore';
import { resolveImage, getProductImage } from '../../utils/imageHelper';

const { width: W } = Dimensions.get('window');

// ── Sistema de color unificado ────────────────────────────────────────
export const C = {
  dark:    '#1A3329',
  mid:     '#00704A',
  accent:  '#CBA258',
  light:   '#D4E9E2',
  white:   '#FFFFFF',
  bg:      '#F7F4EF',
  card:    '#FFFFFF',
  muted:   '#8BA99A',
  text:    '#1A3329',
  subtle:  '#E8F0EC',
  shadow:  '#0D2018',
};

interface Product {
  id: string; name: string; price: number;
  image_url?: string; category?: string;
  is_available: boolean; description?: string;
}

// ── Hook para animación de entrada escalonada ─────────────────────────
function useStaggeredEntrance(count: number, delay = 60) {
  const anims = useRef<Animated.Value[]>([]).current;
  if (anims.length !== count) {
    anims.length = 0;
    for (let i = 0; i < count; i++) anims.push(new Animated.Value(0));
  }
  const run = useCallback(() => {
    Animated.stagger(delay, anims.map(a =>
      Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 })
    )).start();
  }, [anims, delay]);
  return { anims, run };
}

// ── Botón animado con escala al presionar ─────────────────────────────
function AnimatedButton({
  onPress, style, children, activeScale = 0.93,
}: {
  onPress: () => void; style?: any; children: React.ReactNode; activeScale?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => Animated.spring(scale, { toValue: activeScale, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start(onPress);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable style={style} onPressIn={press} onPressOut={release}>{children}</Pressable>
    </Animated.View>
  );
}

// ── Tarjeta destacada ─────────────────────────────────────────────────
function FeaturedCard({
  product, onAdd, isFav, onToggleFav, animValue,
}: {
  product: Product; onAdd: () => void;
  isFav: boolean; onToggleFav: () => void;
  animValue: Animated.Value;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;

  const toggleFavAnimated = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, tension: 300, friction: 6 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start(onToggleFav);
  };

  return (
    <Animated.View style={[
      fc.card,
      {
        opacity: animValue,
        transform: [{
          translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
        }],
      },
    ]}>
      {/* Botón favorito */}
      <Pressable style={fc.favBtn} onPress={toggleFavAnimated}>
        <Animated.Text style={[fc.favIcon, isFav && fc.favActive, { transform: [{ scale: heartScale }] }]}>
          {isFav ? '♥' : '♡'}
        </Animated.Text>
      </Pressable>

      <View style={fc.imgWrap}>
        <FeaturedImage product={product} imgStyle={fc.img} />
      </View>

      <Text style={fc.name} numberOfLines={2}>{product.name}</Text>
      <Text style={fc.price}>{product.price.toFixed(2)} €</Text>

      <AnimatedButton style={fc.addBtn} onPress={onAdd} activeScale={0.9}>
        <Text style={fc.addText}>Añadir</Text>
      </AnimatedButton>
    </Animated.View>
  );
}

// ── Imagen con fallback automático ───────────────────────────────────
function FeaturedImage({ product, imgStyle }: { product: Product; imgStyle: any }) {
  const initial = resolveImage(product.name, product.category, product.image_url);
  const fallback = getProductImage(product.name, product.category);
  const [uri, setUri] = useState(initial);
  return (
    <Image
      source={{ uri }}
      style={imgStyle}
      resizeMode="cover"
      onError={() => { if (uri !== fallback) setUri(fallback); }}
    />
  );
}

const fc = StyleSheet.create({
  card: {
    width: 158, marginRight: 14,
    backgroundColor: C.card, borderRadius: 20,
    padding: 14,
    shadowColor: C.shadow, shadowOpacity: 0.10,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  favBtn:        { alignSelf: 'flex-end', padding: 4 },
  favIcon:       { fontSize: 20, color: '#D0D0D0' },
  favActive:     { color: '#E05252' },
  imgWrap:       {
    width: 96, height: 96, borderRadius: 48,
    overflow: 'hidden', alignSelf: 'center', marginBottom: 12,
    backgroundColor: C.subtle,
    shadowColor: C.mid, shadowOpacity: 0.15,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  img:           { width: '100%', height: '100%' },
  imgPlaceholder:{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: C.subtle },
  imgInitial:    { fontSize: 34, fontWeight: '800', color: C.mid },
  name:          { fontSize: 13, fontWeight: '700', color: C.text, lineHeight: 18, marginBottom: 4, letterSpacing: 0.1 },
  price:         { fontSize: 15, fontWeight: '800', color: C.mid, marginBottom: 10 },
  addBtn:        { backgroundColor: C.mid, borderRadius: 22, paddingVertical: 9, alignItems: 'center' },
  addText:       { color: C.white, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});

// ── Tarjeta lista ─────────────────────────────────────────────────────
function ListCard({
  product, onAdd, isFav, onToggleFav, animValue,
}: {
  product: Product; onAdd: () => void;
  isFav: boolean; onToggleFav: () => void;
  animValue: Animated.Value;
}) {
  const heartScale = useRef(new Animated.Value(1)).current;
  const toggleFavAnimated = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, tension: 300, friction: 5 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 }),
    ]).start(onToggleFav);
  };

  return (
    <Animated.View style={[
      lc.card,
      {
        opacity: animValue,
        transform: [{ translateX: animValue.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
      },
    ]}>
      <View style={lc.imgWrap}>
        <FeaturedImage product={product} imgStyle={lc.img} />
      </View>
      <View style={lc.info}>
        <Text style={lc.name} numberOfLines={1}>{product.name}</Text>
        {product.description && <Text style={lc.desc} numberOfLines={1}>{product.description}</Text>}
        <Text style={lc.price}>{product.price.toFixed(2)} €</Text>
      </View>
      <View style={lc.actions}>
        <Pressable onPress={toggleFavAnimated} style={lc.favBtn}>
          <Animated.Text style={[lc.favIcon, isFav && lc.favActive, { transform: [{ scale: heartScale }] }]}>
            {isFav ? '♥' : '♡'}
          </Animated.Text>
        </Pressable>
        <AnimatedButton style={lc.addBtn} onPress={onAdd} activeScale={0.88}>
          <Text style={lc.addText}>+</Text>
        </AnimatedButton>
      </View>
    </Animated.View>
  );
}

const lc = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 18,
    marginBottom: 10, padding: 14,
    shadowColor: C.shadow, shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  imgWrap:        { width: 66, height: 66, borderRadius: 33, overflow: 'hidden', backgroundColor: C.subtle, marginRight: 14 },
  img:            { width: '100%', height: '100%' },
  imgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  imgInitial:     { fontSize: 24, fontWeight: '700', color: C.mid },
  info:           { flex: 1 },
  name:           { fontSize: 15, fontWeight: '700', color: C.text, letterSpacing: 0.1 },
  desc:           { fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 16 },
  price:          { fontSize: 15, fontWeight: '800', color: C.mid, marginTop: 5 },
  actions:        { gap: 10, alignItems: 'center' },
  favBtn:         { padding: 4 },
  favIcon:        { fontSize: 20, color: '#D0D0D0' },
  favActive:      { color: '#E05252' },
  addBtn:         {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.mid, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.mid, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  addText:        { color: C.white, fontSize: 22, fontWeight: '700', lineHeight: 24 },
});

// ── Chips de categoría ───────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'bocadillo_caliente', label: 'Bocadillos Calientes' },
  { slug: 'bocadillo_frio',    label: 'Bocadillos Fríos' },
  { slug: 'bocadillo_especial', label: 'Especiales' },
  { slug: 'sandwich',           label: 'Sándwiches' },
  { slug: 'bebida',             label: 'Bebidas' },
  { slug: 'cafeteria',          label: 'Café e Infusiones' },
  { slug: 'bolleria',           label: 'Bollería' },
  { slug: 'snack',              label: 'Snacks y Tapas' },
  { slug: 'menu',               label: 'Menú Diario' },
];

// ── Pantalla principal ───────────────────────────────────────────────
export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { addItem, itemCount, total } = useCartStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();

  // Animaciones de entrada
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const searchAnim  = useRef(new Animated.Value(0)).current;
  const cartAnim    = useRef(new Animated.Value(0)).current;

  const featured = products.filter(p => p.is_available).slice(0, 6);
  const filtered  = products
    .filter(p => p.is_available)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const { anims: featAnims, run: runFeat } = useStaggeredEntrance(featured.length, 80);
  const { anims: listAnims, run: runList } = useStaggeredEntrance(Math.min(filtered.length, 12), 50);

  useEffect(() => {
    // Animación de entrada inicial
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.timing(searchAnim, { toValue: 1, duration: 500, delay: 150, useNativeDriver: true }).start();
  }, [headerAnim, searchAnim]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getMenu()
        .then(p => {
          setProducts(p);
          setTimeout(() => { runFeat(); runList(); }, 100);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [runFeat, runList])
  );

  useEffect(() => {
    if (!loading) {
      featAnims.forEach(a => a.setValue(0));
      listAnims.forEach(a => a.setValue(0));
      setTimeout(() => { runFeat(); runList(); }, 50);
    }
  }, [search]);

  // Animación del carrito flotante
  useEffect(() => {
    Animated.spring(cartAnim, {
      toValue: itemCount() > 0 ? 1 : 0,
      useNativeDriver: true, tension: 80, friction: 10,
    }).start();
  }, [itemCount()]);

  const addToCart = (p: Product) =>
    addItem({ product_id: p.id, product_name: p.name, price: p.price, quantity: 1, image_url: p.image_url });

  const toggleFav = (p: Product) =>
    toggleFavorite({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, category: p.category, description: p.description });

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Banner */}
        <Animated.View style={[s.banner, {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        }]}>
          <View style={s.bannerRow}>
            <View>
              <Text style={s.bannerGreet}>Bienvenido</Text>
              <Text style={s.bannerSub}>¿Qué te apetece hoy?</Text>
            </View>
            <View style={s.logoMark}>
              <Text style={s.logoMarkText}>AC</Text>
            </View>
          </View>
          {/* Línea decorativa */}
          <View style={s.bannerDivider} />
        </Animated.View>

        {/* Buscador */}
        <Animated.View style={[s.searchWrap, {
          opacity: searchAnim,
          transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}>
          <View style={s.searchBox}>
            <Text style={s.searchIcon}>⌕</Text>
            <TextInput
              style={s.search}
              placeholder="Buscar en el menú..."
              placeholderTextColor={C.muted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} style={s.clearBtn}>
                <Text style={s.clearText}>✕</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Chips de categoría */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={s.chipsRow} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map((cat, i) => {
            const isActive = activeCategory === cat.slug;
            return (
              <AnimatedButton
                key={cat.slug}
                style={[s.chip, isActive && s.chipActive]}
                onPress={() => {
                  setActiveCategory(isActive ? null : cat.slug);
                  router.push({ pathname: '/(student)/[slug]', params: { slug: cat.slug } });
                }}
                activeScale={0.93}
              >
                <Text style={[s.chipText, isActive && s.chipTextActive]}>{cat.label}</Text>
              </AnimatedButton>
            );
          })}
        </ScrollView>

        {/* Sección Destacados */}
        {!search && (
          <>
            <View style={s.sectionHeader}>
              <View>
                <Text style={s.sectionLabel}>DESTACADOS</Text>
                <Text style={s.sectionTitle}>Más populares</Text>
              </View>
              <AnimatedButton
                style={s.seeAllBtn}
                onPress={() => router.push({ pathname: '/(student)/[slug]', params: { slug: undefined } })}
                activeScale={0.95}
              >
                <Text style={s.seeAll}>Ver todo →</Text>
              </AnimatedButton>
            </View>

            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              style={s.featuredRow}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            >
              {loading
                ? <SkeletonFeatured />
                : featured.map((p, i) => (
                    <FeaturedCard
                      key={p.id} product={p}
                      onAdd={() => addToCart(p)}
                      isFav={isFavorite(p.id)}
                      onToggleFav={() => toggleFav(p)}
                      animValue={featAnims[i] ?? new Animated.Value(1)}
                    />
                  ))
              }
            </ScrollView>
          </>
        )}

        {/* Todo el menú / Resultados */}
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionLabel}>{search ? 'BÚSQUEDA' : 'TODO EL MENÚ'}</Text>
            <Text style={s.sectionTitle}>{search ? 'Resultados' : 'Menú completo'}</Text>
          </View>
          <View style={s.countBadge}>
            <Text style={s.countText}>{filtered.length}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          {loading
            ? <SkeletonList />
            : filtered.length === 0
              ? (
                <View style={s.emptySearch}>
                  <Text style={s.emptySearchIcon}>⊘</Text>
                  <Text style={s.emptySearchText}>Sin resultados para "{search}"</Text>
                </View>
              )
              : filtered.map((p, i) => (
                  <ListCard
                    key={p.id} product={p}
                    onAdd={() => addToCart(p)}
                    isFav={isFavorite(p.id)}
                    onToggleFav={() => toggleFav(p)}
                    animValue={listAnims[i] ?? new Animated.Value(1)}
                  />
                ))
          }
        </View>
      </ScrollView>

      {/* Carrito flotante */}
      <Animated.View style={[s.cartContainer, {
        opacity: cartAnim,
        transform: [{
          translateY: cartAnim.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }),
        }],
      }]}>
        {itemCount() > 0 && (
          <AnimatedButton style={s.cartBtn} onPress={() => router.push('/(student)/cart')} activeScale={0.97}>
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>{itemCount()}</Text>
            </View>
            <Text style={s.cartBtnLabel}>Ver carrito</Text>
            <Text style={s.cartBtnTotal}>{total().toFixed(2)} €</Text>
          </AnimatedButton>
        )}
      </Animated.View>
    </View>
  );
}

// ── Skeletons de carga ─────────────────────────────────────────────────
function SkeletonFeatured() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <>
      {[0,1,2].map(i => (
        <Animated.View key={i} style={[fc.card, { opacity: pulse, marginRight: 14 }]}>
          <View style={[fc.imgWrap, { backgroundColor: C.subtle }]} />
          <View style={{ height: 14, backgroundColor: C.subtle, borderRadius: 7, marginBottom: 6 }} />
          <View style={{ height: 10, backgroundColor: C.subtle, borderRadius: 5, width: '60%', marginBottom: 12 }} />
          <View style={{ height: 34, backgroundColor: C.subtle, borderRadius: 17 }} />
        </Animated.View>
      ))}
    </>
  );
}

function SkeletonList() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <>
      {[0,1,2,3].map(i => (
        <Animated.View key={i} style={[lc.card, { opacity: pulse }]}>
          <View style={[lc.imgWrap, { backgroundColor: C.subtle }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={{ height: 14, backgroundColor: C.subtle, borderRadius: 7 }} />
            <View style={{ height: 10, backgroundColor: C.subtle, borderRadius: 5, width: '70%' }} />
          </View>
        </Animated.View>
      ))}
    </>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  banner:          { backgroundColor: C.dark, paddingTop: 16, paddingBottom: 28, paddingHorizontal: 20 },
  bannerRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bannerGreet:     { fontSize: 28, fontWeight: '900', color: C.white, letterSpacing: -0.5 },
  bannerSub:       { fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4, letterSpacing: 0.2 },
  logoMark:        {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  logoMarkText:    { color: C.white, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  bannerDivider:   { height: 2, backgroundColor: C.mid, width: 36, borderRadius: 1, marginTop: 16 },
  searchWrap:      { paddingHorizontal: 16, marginTop: -18, marginBottom: 4 },
  searchBox:       {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: C.shadow, shadowOpacity: 0.10,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  searchIcon:      { fontSize: 20, color: C.muted, marginRight: 10 },
  search:          { flex: 1, fontSize: 15, color: C.text },
  clearBtn:        { padding: 4 },
  clearText:       { fontSize: 12, color: C.muted, fontWeight: '700' },
  chipsRow:        { marginTop: 16, marginBottom: 4 },
  chip:            {
    paddingHorizontal: 18, paddingVertical: 9,
    backgroundColor: C.white, borderRadius: 24,
    borderWidth: 1.5, borderColor: C.light,
    shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  chipActive:      { backgroundColor: C.mid, borderColor: C.mid },
  chipText:        { fontSize: 13, fontWeight: '700', color: C.dark },
  chipTextActive:  { color: C.white },
  sectionHeader:   {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 16, marginTop: 24, marginBottom: 14,
  },
  sectionLabel:    { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2 },
  sectionTitle:    { fontSize: 20, fontWeight: '900', color: C.dark, letterSpacing: -0.3 },
  seeAllBtn:       {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.subtle, borderRadius: 10,
  },
  seeAll:          { fontSize: 13, fontWeight: '700', color: C.mid },
  featuredRow:     { marginBottom: 8 },
  countBadge:      {
    backgroundColor: C.subtle, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, alignSelf: 'center',
  },
  countText:       { fontSize: 13, fontWeight: '800', color: C.mid },
  emptySearch:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptySearchIcon: { fontSize: 40, color: C.muted },
  emptySearchText: { fontSize: 14, color: C.muted, fontWeight: '600', letterSpacing: 0.2 },
  cartContainer:   { position: 'absolute', bottom: 24, left: 16, right: 16 },
  cartBtn:         {
    backgroundColor: C.dark, borderRadius: 18, paddingVertical: 17, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: C.dark, shadowOpacity: 0.40, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 12,
  },
  cartBadge:       {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.mid, alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText:   { color: C.white, fontWeight: '900', fontSize: 13 },
  cartBtnLabel:    { color: C.white, fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'center', letterSpacing: 0.2 },
  cartBtnTotal:    { color: C.accent, fontWeight: '900', fontSize: 15 },
});
