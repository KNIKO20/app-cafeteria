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
// Importación de iconos
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

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
      {/* Fondo decorativo */}
      <View style={s.topPanel} />
      <View style={s.bottomPanel} />
      <View style={s.circle1} />
      <View style={s.circle2} />

      <Animated.View
        style={[s.card, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }]}
      >
        {/* LOGO CON IONICONS */}
        <View style={s.logoContainer}>
          <Ionicons name="leaf-outline" size={40} color={C.accent} />
        </View>

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
          {/* ICONO GOOGLE CON FONTAWESOME */}
          <FontAwesome name="google" size={18} color={C.white} style={{ marginRight: 12 }} />
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
  logoContainer: {
    width: 72,
    height: 72,
    backgroundColor: 'rgba(203,162,88,0.1)', // Fondo suave del color accent
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(203,162,88,0.2)',
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