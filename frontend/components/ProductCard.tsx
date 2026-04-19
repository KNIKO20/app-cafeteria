// components/ProductCard.tsx — Tarjeta de producto del catálogo rediseñada
// Iconos sugeridos (Ionicons de @expo/vector-icons):
//   Añadir:    "add"          (18px blanco, dentro del círculo verde)
//   Favorito:  "heart"        (relleno) / "heart-outline" (vacío)
//   Agotado:   "close-circle" (16px, rojo)

import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated,
} from 'react-native';
import { resolveImage, getProductImage } from '../utils/imageHelper';
import { C, radius, shadow } from '../theme';

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
  const pressIn   = () => Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true, tension: 300, friction: 10 }).start();
  const pressOut  = () => Animated.spring(pressAnim, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 10 }).start();

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

          {/* Botón de favorito — Ionicons "heart" / "heart-outline" */}
          {onFavorite && (
            <TouchableOpacity style={s.favBtn} onPress={onFavorite} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <View style={[s.heart, isFavorite && s.heartFilled]} />
            </TouchableOpacity>
          )}

          {/* Overlay si no disponible */}
          {!product.is_available && (
            <View style={s.unavailableOverlay}>
              <Text style={s.unavailableText}>Sin stock</Text>
            </View>
          )}
        </View>

        {/* ── Info ──────────────────────────────────────────── */}
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>{product.name}</Text>

          <View style={s.bottom}>
            <Text style={s.price}>{product.price.toFixed(2)} €</Text>

            {/* Botón "+" circular */}
            <View style={[s.addCircle, !product.is_available && s.addCircleDisabled]}>
              {/* Ionicons "add" 16px / "close" si no disponible */}
              <Text style={s.addText}>{product.is_available ? '+' : '×'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap:         { flex: 1, margin: 5 },
  wrapDisabled: { opacity: 0.45 },

  card: {
    backgroundColor: C.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },

  // Imagen
  imageWrap: { position: 'relative' },
  image: {
    width: '100%', height: 105,
    backgroundColor: C.subtle,
  },

  // Badge de categoría — esquina inferior izquierda
  catBadge: {
    position: 'absolute', bottom: 6, left: 7,
    backgroundColor: 'rgba(26,51,41,0.78)',
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 7,
  },
  catText: {
    fontSize: 9, fontWeight: '800',
    color: C.white, textTransform: 'capitalize',
  },

  // Botón favorito — esquina superior derecha
  favBtn: {
    position: 'absolute', top: 7, right: 7,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    ...shadow.card,
  },
  // Icono corazón simple hecho con View (usar Ionicons "heart" para mejor resultado)
  heart: {
    width: 13, height: 11,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.muted,
  },
  heartFilled: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },

  // Overlay agotado
  unavailableOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(26,51,41,0.5)',
    alignItems: 'center', justifyContent: 'center',
  } as any,
  unavailableText: {
    fontSize: 12, fontWeight: '900',
    color: C.white, letterSpacing: 0.5,
  },

  // Información
  info: { padding: 10 },
  name: {
    fontSize: 13, fontWeight: '700',
    color: C.dark, lineHeight: 18,
    minHeight: 36, marginBottom: 8,
  },
  bottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16, fontWeight: '900',
    color: C.dark, letterSpacing: -0.3,
  },

  // Botón "+" circular
  addCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  addCircleDisabled: { backgroundColor: C.muted },
  addText: {
    fontSize: 20, fontWeight: '300',
    color: C.white, lineHeight: 24,
    marginTop: -2,
  },
});