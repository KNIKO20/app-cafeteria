// (auth)/login.tsx — Pantalla de login rediseñada
// Icono sugerido: Ionicons "leaf-outline" para el logo de la app

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { loginWithGoogle, getMe } from '../../services/api';
import { C, shadow } from '../../theme';

const { height } = Dimensions.get('window');

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

// ── Logo SVG mínimo dibujado con Views ──────────────────────────────
// Representa una "hoja" estilizada — icono Ionicons "leaf" como alternativa
function AppMark() {
  return (
    <View style={mark.wrap}>
      {/* Círculo exterior */}
      <View style={mark.ring} />
      {/* Cuadrado rotado = rombo = marca */}
      <View style={mark.diamond} />
      {/* Línea vertical central */}
      <View style={mark.stem} />
    </View>
  );
}

const mark = StyleSheet.create({
  wrap: {
    width: 72, height: 72,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  ring: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: 'rgba(203,162,88,0.5)',
  },
  diamond: {
    position: 'absolute',
    width: 28, height: 28,
    borderRadius: 4,
    backgroundColor: C.accent,
    transform: [{ rotate: '45deg' }],
    opacity: 0.9,
  },
  stem: {
    position: 'absolute',
    width: 2, height: 36,
    backgroundColor: C.accent,
    borderRadius: 2,
    bottom: 4,
  },
});

// ── Icono Google dibujado con Views ────────────────────────────────
// Alternativa: importar SVG o usar @expo/vector-icons logo-google
function GoogleIcon() {
  return (
    <View style={gi.wrap}>
      <View style={gi.outer}>
        <View style={[gi.seg, gi.blue]} />
        <View style={[gi.seg, gi.red, { top: 0, right: 0 }]} />
        <View style={[gi.seg, gi.yellow, { bottom: 0, right: 0 }]} />
        <View style={[gi.seg, gi.green, { bottom: 0, left: 0 }]} />
        <View style={gi.center} />
        <View style={gi.bar} />
      </View>
    </View>
  );
}

const gi = StyleSheet.create({
  wrap: { width: 20, height: 20, marginRight: 12 },
  outer: {
    width: 20, height: 20, borderRadius: 10,
    overflow: 'hidden', position: 'relative',
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  seg: {
    position: 'absolute',
    width: 10, height: 10,
  },
  blue:   { backgroundColor: '#4285F4', top: 0, left: 0 },
  red:    { backgroundColor: '#EA4335' },
  yellow: { backgroundColor: '#FBBC05' },
  green:  { backgroundColor: '#34A853' },
  center: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#fff',
  },
  bar: {
    position: 'absolute',
    right: 0, width: 10, height: 6,
    backgroundColor: '#4285F4',
    top: 7,
  },
});

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  // Animaciones de entrada
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId:     '853004690083-9munvftfvk5q9s2l9belno1qvf8sv7f6.apps.googleusercontent.com',
    iosClientId:     'TU_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication, params } = response;
      const token =
        authentication?.idToken ||
        authentication?.accessToken ||
        params?.id_token ||
        params?.access_token;
      if (token) handleBackendLogin(token);
    }
  }, [response]);

  const handleBackendLogin = async (googleToken: string) => {
    try {
      const { access_token } = await loginWithGoogle(googleToken);
      const userProfile = await getMe(access_token);
      setAuth(userProfile, access_token);
      router.replace(userProfile.is_admin ? '/(admin)/dashboard' : '/(student)');
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`Error del servidor: ${msg}`);
    }
  };

  return (
    <View style={s.root}>
      {/* Fondo: panel oscuro superior + cálido inferior */}
      <View style={s.topPanel} />
      <View style={s.bottomPanel} />

      {/* Decoración geométrica sutil */}
      <View style={s.circle1} />
      <View style={s.circle2} />

      {/* Tarjeta central */}
      <Animated.View
        style={[s.card, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }]}
      >
        <AppMark />

        <Text style={s.appName}>API Cafetería</Text>
        <Text style={s.tagline}>Tu pedido, sin esperas</Text>

        <View style={s.divider} />

        <Text style={s.instruction}>
          Accede con tu cuenta del instituto para continuar
        </Text>

        <TouchableOpacity
          style={[s.googleBtn, !request && s.googleBtnDisabled]}
          onPress={() => promptAsync()}
          disabled={!request}
          activeOpacity={0.85}
        >
          <GoogleIcon />
          <Text style={s.googleBtnText}>Continuar con Google</Text>
        </TouchableOpacity>

        <Text style={s.footer}>
          Solo cuentas autorizadas del IES tienen acceso
        </Text>
      </Animated.View>

      <Text style={s.version}>v1.0.0</Text>
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

  // Paneles de fondo que crean profundidad
  topPanel: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: height * 0.42,
    backgroundColor: C.dark,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: height * 0.58,
    backgroundColor: C.bg,
  },

  // Círculos decorativos
  circle1: {
    position: 'absolute',
    top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    borderWidth: 1.5,
    borderColor: 'rgba(203,162,88,0.2)',
  },
  circle2: {
    position: 'absolute',
    top: 40, left: -100,
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(0,112,74,0.3)',
  },

  // Tarjeta principal
  card: {
    width: '88%',
    maxWidth: 380,
    backgroundColor: C.white,
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
    ...shadow.elevated,
  },

  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: C.dark,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 28,
  },

  divider: {
    width: 40,
    height: 2,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginBottom: 28,
  },

  instruction: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: C.dark,
    marginBottom: 16,
    ...shadow.card,
  },
  googleBtnDisabled: { opacity: 0.5 },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.2,
  },

  footer: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
    opacity: 0.7,
  },

  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 11,
    color: C.muted,
    opacity: 0.4,
    letterSpacing: 0.5,
  },
});