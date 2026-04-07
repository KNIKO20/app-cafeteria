import React, { useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { loginWithGoogle, getMe } from '../../services/api';



export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '853004690083-9munvftfvk5q9s2l9belno1qvf8sv7f6.apps.googleusercontent.com',
    iosClientId: 'TU_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const token = authentication?.idToken || authentication?.accessToken;
      if (token) {
        handleBackendLogin(token);
      }
    }
  }, [response]);

  const handleBackendLogin = async (googleToken: string) => {
    try {
      // 1. Obtener JWT de Django
      const { access_token } = await loginWithGoogle(googleToken);

      // 2. Obtener datos del usuario
      const userProfile = await getMe(access_token);

      // 3. Guardar en Zustand
      setAuth(userProfile, access_token);

      // 4. Redirigir
      if (userProfile.is_admin) {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(student)');
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo iniciar sesión en el servidor.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cafetería IES</Text>
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