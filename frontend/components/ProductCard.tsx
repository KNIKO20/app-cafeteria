// components/ProductCard.tsx — Tarjeta de producto del catálogo rediseñada
import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated,
  Pressable,
} from 'react-native';
import { resolveImage, getProductImage } from '../utils/imageHelper';
import { C, radius, shadow } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    category?: string;
    is_available: boolean;
  };
  onAddToCart: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export default function ProductCard({
  product, onAddToCart, onFavorite, isFavorite,
}: Props) {
  const initialUri  = resolveImage(product.name, product.category, product.image_url);
  const fallbackUri = getProductImage(product.name, product.category);
  const [imgUri, setImgUri] = useState(initialUri);

  // Micro-animación al pulsar
  const pressAnim = React.useRef(new Animated.Value(1)).current;
  const pressIn   = () =>     Animated.timing(pressAnim, {
      toValue: 0.8,
      duration: 20,
      useNativeDriver: true,
    }).start();
  const pressOut  = () =>     Animated.timing(pressAnim, {
      toValue: 1,
      duration: 20,
      useNativeDriver: true,
    }).start();

const favAnim = React.useRef(new Animated.Value(1)).current;

const favIn = () =>
  Animated.timing(favAnim, {
    toValue: 0.8,
    duration: 60,
    useNativeDriver: true,
  }).start();

const favOut = () =>
  Animated.timing(favAnim, {
    toValue: 1,
    duration: 60,
    useNativeDriver: true,
  }).start();


  return (
    <Animated.View
      style={[
        s.wrap,
        !product.is_available && s.wrapDisabled,
        { transform: [{ scale: pressAnim }] },
      ]}
    >
      <TouchableOpacity
        style={s.card}
        onPress={onAddToCart}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={!product.is_available}
        activeOpacity={1}
      >
        {/* ── Zona de imagen ─────────────────────────────────── */}
        <View style={s.imageWrap}>
          <Image
            source={{ uri: imgUri }}
            style={s.image}
            resizeMode="cover"
            onError={() => { if (imgUri !== fallbackUri) setImgUri(fallbackUri); }}
          />

          {/* Badge de categoría */}
          {product.category && (
            <View style={s.catBadge}>
              <Text style={s.catText} numberOfLines={1}>
                {product.category.replace(/_/g, ' ')}
              </Text>
            </View>
          )}

          {/* Botón de favorito */}
          {onFavorite && (
            <Pressable
              onPress={onFavorite}
              onPressIn={favIn}
              onPressOut={favOut}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={s.favBtn}
            >
              <Animated.View style={{ transform: [{ scale: favAnim }] }}>
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={18}
                  color={isFavorite ? "#e74c3c" : C.muted}
                />
              </Animated.View>
            </Pressable>
          )}



          {/* Overlay si no disponible */}
          {!product.is_available && (
            <View style={s.unavailableOverlay}>
              <Ionicons name="close-circle" size={24} color={C.white} style={{ marginBottom: 4 }} />
              <Text style={s.unavailableText}>AGOTADO</Text>
            </View>
          )}
        </View>

        {/* ── Info ──────────────────────────────────────────── */}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>{product.name}</Text>

          <View style={s.bottom}>
            <Text style={s.price}>{product.price.toFixed(2)} €</Text>

            {/* Botón "+" circular o icono de cierre si no hay stock */}
            <View style={[s.addCircle, !product.is_available && s.addCircleDisabled]}>
              <Ionicons 
                name={product.is_available ? "add" : "close"} 
                size={product.is_available ? 20 : 18} 
                color={C.white} 
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap:         { flex: 1, margin: 6 },
  wrapDisabled: { opacity: 0.7 },

  card: {
    backgroundColor: C.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },

  // Imagen
  imageWrap: { position: 'relative' },
  image: {
    width: '100%', height: 110,
    backgroundColor: C.subtle,
  },

  // Badge de categoría
  catBadge: {
    position: 'absolute', bottom: 6, left: 7,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  catText: {
    fontSize: 9, fontWeight: '800',
    color: C.white, textTransform: 'uppercase',
  },

  // Botón favorito
  favBtn: {
    position: 'absolute', top: 7, right: 7,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },

  // Overlay agotado
  unavailableOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(26,51,41,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  unavailableText: {
    fontSize: 10, fontWeight: '900',
    color: C.white, letterSpacing: 1,
  },

  // Información
  info: { padding: 12 },
  name: {
    fontSize: 14, fontWeight: '700',
    color: C.dark, lineHeight: 18,
    minHeight: 36, marginBottom: 8,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 17, fontWeight: '900',
    color: C.dark,
  },

  // Botón "+" o estado bloqueado
  addCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.mid, // O el color corporativo que prefieras
    alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  addCircleDisabled: { backgroundColor: C.muted },
});