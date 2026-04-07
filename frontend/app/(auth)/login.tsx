import React, { useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { loginWithGoogle, getMe } from '../../services/api';

// Necesario en la web para que el popup de Google Auth se cierre correctamente y comunique su éxito
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: '853004690083-9munvftfvk5q9s2l9belno1qvf8sv7f6.apps.googleusercontent.com',
    iosClientId: 'TU_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    console.log('Google Auth Response Object:', JSON.stringify(response, null, 2));
    if (response) {
      if (response.type === 'success') {
        const { authentication, params } = response;
        // En la web, a veces el token viene en params.id_token o params.access_token
        const token = authentication?.idToken || authentication?.accessToken || params?.id_token || params?.access_token;
        
        console.log('Google Token detected:', !!token);
        if (token) {
          handleBackendLogin(token);
        } else {
          Alert.alert("Error", "Google no devolvió ningún token válido. Revisa la consola.");
        }
      } else if (response.type === 'error') {
        console.error('Google Auth Error:', response.error);
        Alert.alert("Error de Auth", `Google devolvió un error: ${response.error?.message}`);
      }
    }
  }, [response]);

  const handleBackendLogin = async (googleToken: string) => {
    try {
      console.log('Sending token to backend...');
      // 1. Obtener JWT de Django
      const { access_token } = await loginWithGoogle(googleToken);
      console.log('Backend JWT received');

      // 2. Obtener datos del usuario
      const userProfile = await getMe(access_token);
      console.log('User profile received:', userProfile.email);

      // 3. Guardar en Zustand
      setAuth(userProfile, access_token);
      console.log('Auth state set in Zustand');

      // 4. Redirigir
      const destination = userProfile.is_admin ? '/(admin)/dashboard' : '/(student)';
      console.log('Redirecting to:', destination);
      router.replace(destination);
      
    } catch (error: any) {
      console.error('Backend Login Error:', error);
      const serverMsg = error.response?.data?.error || error.message || "Error desconocido";
      Alert.alert("Error del Backend", `El servidor rechazó el logueo: ${serverMsg}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cafetería IES (V2)</Text>
      <Text style={styles.subtitle}>Inicia sesión con tu cuenta de alumno</Text>
      <Button
        title="Iniciar sesión con Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: 'gray', marginBottom: 30, textAlign: 'center' }
});