import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { useCartStore } from '../stores/cartStore';

export const C = {
  dark:   '#1E3932',
  mid:    '#00754A',
  light:  '#D4E9E2',
  white:  '#FFFFFF',
  bg:     '#F2F0EB',
  muted:  '#6B8E7F',
  border: 'rgba(255,255,255,0.10)',
};

// ── Menú lateral del alumno ──────────────────────────────────────────
function StudentDrawerContent({ navigation }: { navigation: any }) {
  const logout    = useAuthStore((s) => s.logout);
  const user      = useAuthStore((s) => s.user);
  const router    = useRouter();
  const favCount  = useFavoritesStore((s) => s.favorites.length);
  const cartCount = useCartStore((s) => s.itemCount());

  const CATEGORIES = [
    { slug: '',          label: 'Todo el menú' },
    { slug: 'bocadillo', label: 'Bocadillos'   },
    { slug: 'bebida',    label: 'Bebidas'      },
    { slug: 'postre',    label: 'Postres'      },
    { slug: 'saludable', label: 'Saludable'    },
  ];

  const go = (pathname: string, params?: Record<string, string>) => {
    if (params) router.push({ pathname: pathname as any, params });
    else router.push(pathname as any);
    navigation.closeDrawer();
  };

  return (
    <View style={d.root}>
      {/* Cabecera */}
      <View style={d.header}>
        <View style={d.logoCircle}>
          <Text style={d.logoLetters}>AC</Text>
        </View>
        <Text style={d.appName}>API Cafetería</Text>
        <Text style={d.userName}>{user?.name ?? 'Alumno'}</Text>
      </View>

      {/* Todo el contenido en ScrollView → logout nunca se solapa */}
      <ScrollView style={d.scroll} showsVerticalScrollIndicator={false}>

        <Text style={d.sectionLabel}>MENÚ</Text>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={d.item}
            onPress={() =>
              cat.slug === ''
                ? go('/')
                : go('/category/[slug]', { slug: cat.slug })
            }
          >
            <Text style={d.itemLabel}>{cat.label}</Text>
            <Text style={d.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={d.divider} />
        <Text style={d.sectionLabel}>MI CUENTA</Text>

        <TouchableOpacity style={d.item} onPress={() => go('/favorites')}>
          <Text style={d.itemLabel}>Mis Favoritos</Text>
          {favCount > 0 && <View style={d.badge}><Text style={d.badgeText}>{favCount}</Text></View>}
        </TouchableOpacity>

        <TouchableOpacity style={d.item} onPress={() => go('/cart')}>
          <Text style={d.itemLabel}>Mi Carrito</Text>
          {cartCount > 0 && (
            <View style={[d.badge, { backgroundColor: C.mid }]}>
              <Text style={d.badgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={d.item} onPress={() => go('/orders')}>
          <Text style={d.itemLabel}>Mis Pedidos</Text>
          <Text style={d.chevron}>›</Text>
        </TouchableOpacity>

        <View style={d.divider} />

        {/* Cerrar sesión dentro del scroll → nunca se solapa */}
        <TouchableOpacity
          style={d.logoutBtn}
          onPress={() => { logout(); router.replace('/(auth)/login'); }}
        >
          <Text style={d.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const d = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.dark },
  header:      {
    paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24,
    backgroundColor: C.mid,
  },
  logoCircle:  {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  logoLetters: { fontSize: 16, fontWeight: '900', color: C.mid, letterSpacing: 1 },
  appName:     { fontSize: 19, fontWeight: '800', color: C.white },
  userName:    { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  scroll:      { flex: 1 },
  sectionLabel:{ fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 2,
                 paddingHorizontal: 24, paddingTop: 22, paddingBottom: 6 },
  item:        { flexDirection: 'row', alignItems: 'center',
                 paddingHorizontal: 24, paddingVertical: 15 },
  itemLabel:   { fontSize: 15, fontWeight: '600', color: C.white, flex: 1 },
  chevron:     { fontSize: 18, color: C.muted },
  badge:       {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#c0392b',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText:   { color: C.white, fontSize: 11, fontWeight: '800' },
  divider:     { height: 1, backgroundColor: C.border, marginHorizontal: 24, marginVertical: 6 },
  logoutBtn:   {
    marginHorizontal: 24, marginTop: 10,
    paddingVertical: 13, borderRadius: 10,
    borderWidth: 1, borderColor: C.muted, alignItems: 'center',
  },
  logoutText:  { color: C.muted, fontWeight: '700', fontSize: 14 },
});

// ── Layout principal ─────────────────────────────────────────────────
export default function Layout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user    = useAuthStore((s) => s.user);
  const segments = useSegments();
  const router  = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { setIsReady(true); }, []);

  useEffect(() => {
    if (!isReady) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) setTimeout(() => router.replace('/(auth)/login'), 1);
    else if (isAuthenticated && inAuth)
      setTimeout(() => router.replace(user?.is_admin ? '/(admin)/dashboard' : '/(student)'), 1);
  }, [isAuthenticated, segments, isReady]);

  const headerOpts = {
    headerStyle:      { backgroundColor: C.dark },
    headerTintColor:  C.white,
    headerTitleStyle: { fontWeight: '700' as const },
    headerBackTitle:  'Volver',
  };

  if (!user?.is_admin) {
    return (
      <Drawer
        drawerContent={(props) => <StudentDrawerContent {...props} />}
        screenOptions={{ ...headerOpts, drawerStyle: { width: 290 } }}
      >
        <Drawer.Screen name="(student)/index"           options={{ title: 'API Cafetería' }} />
        <Drawer.Screen name="(student)/category/[slug]" options={{ title: 'Categoría' }} />
        <Drawer.Screen name="(student)/favorites"       options={{ title: 'Mis Favoritos' }} />
        <Drawer.Screen name="(student)/cart"            options={{ title: 'Mi Carrito' }} />
        <Drawer.Screen name="(student)/orders"          options={{ title: 'Mis Pedidos' }} />
        <Drawer.Screen name="(student)/payment"
          options={{ title: 'Finalizar Pago', drawerItemStyle: { display: 'none' }, swipeEnabled: false }} />
        <Drawer.Screen name="(auth)/login"  options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="(auth)/logout" options={{ headerShown: false, drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="(admin)/dashboard" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="(admin)/inventory" options={{ drawerItemStyle: { display: 'none' } }} />
        <Drawer.Screen name="(admin)/settings"  options={{ drawerItemStyle: { display: 'none' } }} />
      </Drawer>
    );
  }

  const { Stack } = require('expo-router');
  return (
    <Stack screenOptions={headerOpts}>
      <Stack.Screen name="(auth)/login"      options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/logout"     options={{ headerShown: false }} />
      <Stack.Screen name="(admin)/dashboard" options={{ title: 'Panel Admin' }} />
      <Stack.Screen name="(admin)/inventory" options={{ title: 'Inventario' }} />
      <Stack.Screen name="(admin)/settings"  options={{ title: 'Franjas Horarias' }} />
    </Stack>
  );
}
