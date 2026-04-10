import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';

export default function Layout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);
  const segments = useSegments();
  const router = useRouter();

  // Nuevo: Estado para saber si el Layout ya se montó
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    // Si el layout no está listo, no intentes navegar todavía
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Retrasamos un milisegundo la navegación para evitar el choque con el montaje
      setTimeout(() => router.replace('/(auth)/login'), 1);
    } else if (isAuthenticated && inAuthGroup) {
      const destination = user?.is_admin ? '/(admin)/orders' : '/(student)/products';
      setTimeout(() => router.replace(destination), 1);
    }
  }, [isAuthenticated, segments, isReady]);

  return (
    <Stack>
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(student)/products" options={{ title: 'Menú Cafetería' }} />
      <Stack.Screen name="(admin)/orders" options={{ title: 'Panel Admin' }} />
    </Stack>
  );
}