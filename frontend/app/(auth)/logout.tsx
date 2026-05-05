// (auth)/logout.tsx — Pantalla de cierre de sesión rediseñada

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { C } from '../../theme';

export default function LogoutScreen() {
  const { logout } = useAuthStore();
  const router = useRouter();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnim1  = useRef(new Animated.Value(0.3)).current;
  const dotAnim2  = useRef(new Animated.Value(0.3)).current;
  const dotAnim3  = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Entrada suave
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();

    // Animación de puntos de carga
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();

    pulse(dotAnim1, 0);
    pulse(dotAnim2, 150);
    pulse(dotAnim3, 300);

    // Logout efectivo
    const timeout = setTimeout(() => {
      logout();
      router.replace('/(auth)/login');
    }, 1200);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={s.root}>
      <View style={s.topPanel} />

      <Animated.View
        style={[s.card, {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }]}
      >
        {/* Marca decorativa */}
        <View style={s.markRing}>
          <View style={s.markDiamond} />
        </View>

        <Text style={s.title}>Cerrando sesión</Text>
        <Text style={s.subtitle}>Hasta pronto</Text>

        {/* Puntos de carga */}
        <View style={s.dots}>
          {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
            <Animated.View
              key={i}
              style={[s.dot, { opacity: anim }]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.bg,
  },
  topPanel: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '45%',
    backgroundColor: C.dark,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
    shadowColor: C.dark,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  markRing: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: C.light,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  markDiamond: {
    width: 22, height: 22,
    backgroundColor: C.mid,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: C.dark,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
    marginBottom: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.mid,
  },
});