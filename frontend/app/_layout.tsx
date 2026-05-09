
import { useRouter, useSegments, usePathname, Slot } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Pressable, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useFavoritesStore } from '../stores/favoritesStore';
import { useCartStore } from '../stores/cartStore';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons'; 
export const C = {
  dark:   '#1A3329',
  mid:    '#00704A',
  accent: '#CBA258',
  light:  '#D4E9E2',
  white:  '#FFFFFF',
  bg:     '#F7F4EF',
  muted:  '#8BA99A',
  subtle: '#E8F0EC',
  border: 'rgba(255,255,255,0.08)',
};

function NavGroup({ 
  label, icon, children, isOpen, onToggle, index 
}: { 
  label: string; icon: string; children: React.ReactNode; 
  isOpen: boolean; onToggle: () => void; index: number 
}) {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Height no soporta native driver
    }).start();
  }, [isOpen]);

  return (
    <View style={d.groupContainer}>
      <TouchableOpacity 
        style={[d.item, isOpen && d.itemActive]} 
        onPress={onToggle} 
        activeOpacity={0.7}
      >
        <Ionicons name={icon as any} size={20} color={isOpen ? C.accent : C.muted} />
        <Text style={[d.itemLabel, { marginLeft: 12 }, isOpen && { color: C.accent }]}>{label}</Text>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={C.muted} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <Animated.View style={{
          paddingLeft: 20,
          overflow: 'hidden',
          opacity: animatedHeight,
        }}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

// ── Ítem de menú animado ─────────────────────────────────────────────
function NavItem({
  label, onPress, badge, badgeColor, chevron = true, index,
}: {
  label: string; onPress: () => void;
  badge?: number; badgeColor?: string;
  chevron?: boolean; index: number;
}) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1, useNativeDriver: true,
      tension: 50, friction: 12, delay: index * 45,
    }).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const handlePressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start(onPress);

  return (
    <Animated.View style={{
      opacity: enterAnim,
      transform: [
        { translateX: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
        { scale: pressAnim },
      ],
    }}>
      <Pressable
        style={d.item}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={d.itemLabel}>{label}</Text>
        <View style={d.itemRight}>
          {badge != null && badge > 0 && (
            <View style={[d.badge, badgeColor ? { backgroundColor: badgeColor } : {}]}>
              <Text style={d.badgeText}>{badge}</Text>
            </View>
          )}
          {chevron && <Text style={d.chevron}>›</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Contenido del drawer ─────────────────────────────────────────────
function StudentDrawerContent({ navigation }: { navigation: any }) {
  const logout    = useAuthStore((s) => s.logout);
  const user      = useAuthStore((s) => s.user);
  const router    = useRouter();
  const favCount  = useFavoritesStore((s) => s.favorites.length);
  const cartCount = useCartStore((s) => s.itemCount());
  const [openGroup, setOpenGroup] = useState<string | null>('comida');
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, useNativeDriver: true, tension: 50, friction: 12,
    }).start();
  }, []);

  const MENU_GROUPS = {
    comida: [
      { slug: 'bocadillo_caliente', label: 'Bocadillos Calientes' },
      { slug: 'bocadillo_frio',    label: 'Bocadillos Fríos' },
      { slug: 'sandwich',           label: 'Sándwiches' },
      { slug: 'bolleria',           label: 'Bollería' },
    ],
    bebida: [
      { slug: 'bebida',    label: 'Refrescos y Agua' },
      { slug: 'cafeteria', label: 'Café e Infusiones' },
    ],
    especiales: [
      { slug: 'menu',      label: 'Menú del Día' },
      { slug: 'snack',     label: 'Snacks y Tapas' },
    ]
  };
  const go = (slug: string) => {
      router.push({ pathname: '/(student)/[slug]', params: { slug } });
      navigation.closeDrawer();
    };
  const goUser = (pathname: string, params?: Record<string, string>) => {

    if (params) router.push({ pathname: pathname as any, params });

    else router.push(pathname as any);

    navigation.closeDrawer();

  };
  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={d.root}>
      {/* Cabecera */}
      <Animated.View style={[d.header, {
        opacity: headerAnim,
        transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
      }]}>
        <View style={d.logoRow}>
          <View style={d.logoCircle}>
            <Text style={d.logoLetters}>AC</Text>
          </View>
          <View style={d.logoTexts}>
            <Text style={d.appName}>API Cafetería</Text>
            <Text style={d.appSub}>App del alumno</Text>
          </View>
        </View>
        <View style={d.userChip}>
          <View style={d.userDot} />
          <Text style={d.userName}>{user?.name ?? 'Alumno'}</Text>
        </View>
      </Animated.View>


        {/* Menú */}
      <ScrollView style={d.scroll} showsVerticalScrollIndicator={false}>
          <Text style={d.sectionLabel}>CARTA DIGITAL</Text>
          
          <NavItem 
            label="Ver todo el menú" 
            index={0} 
            onPress={() => { router.push('/(student)'); navigation.closeDrawer(); }} 
          />

          {/* Grupo: Comida */}
          <NavGroup 
            label="Comidas" 
            icon="fast-food-outline" 
            index={1}
            isOpen={openGroup === 'comida'} 
            onToggle={() => setOpenGroup(openGroup === 'comida' ? null : 'comida')}
          >
            {MENU_GROUPS.comida.map((cat, i) => (
              <NavItem key={cat.slug} label={cat.label} index={i} chevron={false} onPress={() => go(cat.slug)} />
            ))}
          </NavGroup>

          {/* Grupo: Bebidas */}
          <NavGroup 
            label="Bebidas" 
            icon="cafe-outline" 
            index={2}
            isOpen={openGroup === 'bebida'} 
            onToggle={() => setOpenGroup(openGroup === 'bebida' ? null : 'bebida')}
          >
            {MENU_GROUPS.bebida.map((cat, i) => (
              <NavItem key={cat.slug} label={cat.label} index={i} chevron={false} onPress={() => go(cat.slug)} />
            ))}
        </NavGroup>
                <View style={d.divider} />
        <Text style={d.sectionLabel}>MI CUENTA</Text>

        <NavItem
          label="Mis Favoritos" index={5}
          badge={favCount} badgeColor="#DC2626"
          onPress={() => goUser('/(student)/favorites')}
        />
        <NavItem
          label="Mi Carrito" index={6}
          badge={cartCount} badgeColor={C.mid}
          onPress={() => goUser('/(student)/cart')}
        />
        <NavItem
          label="Mis Pedidos" index={7}
          onPress={() => goUser('/(student)/orders')}
        />

        <View style={d.divider} />
        {/* Cerrar sesión */}
        <Pressable style={d.logoutBtn} onPress={handleLogout}>
          <Text style={d.logoutText}>Cerrar sesión</Text>
        </Pressable>

        {/* Versión */}
        <Text style={d.version}>v1.0.0 · API Cafetería</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const d = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.dark },
  header:      {
    paddingTop: 52, paddingBottom: 24, paddingHorizontal: 22,
    backgroundColor: C.mid,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  logoCircle:  {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  logoLetters: { fontSize: 15, fontWeight: '900', color: C.white, letterSpacing: 1 },
  logoTexts:   { flex: 1 },
  appName:     { fontSize: 17, fontWeight: '900', color: C.white, letterSpacing: -0.2 },
  appSub:      { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  userChip:    {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start',
  },
  userDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent },
  userName:    { fontSize: 13, fontWeight: '700', color: C.white },

  scroll:      { flex: 1, paddingTop: 8 },
  sectionLabel:{ fontSize: 9, fontWeight: '900', color: C.muted, letterSpacing: 2.5,
                 paddingHorizontal: 22, paddingTop: 20, paddingBottom: 4 },
  item:        {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 14,
    marginHorizontal: 10, borderRadius: 12,
  },
  itemLabel:   { fontSize: 15, fontWeight: '600', color: C.white, flex: 1 },
  itemRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chevron:     { fontSize: 20, color: 'rgba(255,255,255,0.25)' },
  badge:       {
    minWidth: 22, height: 22, borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  badgeText:   { color: C.white, fontSize: 11, fontWeight: '900' },
  divider:     {
    height: 1, backgroundColor: C.border,
    marginHorizontal: 22, marginVertical: 8,
  },
  logoutBtn:   {
    marginHorizontal: 22, marginTop: 6,
    paddingVertical: 13, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  groupContainer: {
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: 'rgba(203, 162, 88, 0.08)', // Color accent con transparencia
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  // Ajuste opcional para NavItem dentro de grupos
  subItem: {
    paddingVertical: 10,
    paddingLeft: 40,
  },
  logoutText:  { color: C.muted, fontWeight: '700', fontSize: 14 },
  version:     { fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 16, letterSpacing: 0.5 },
});

// ── Layout principal ─────────────────────────────────────────────────
export default function Layout() {
  const [isReady, setIsReady] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);
  const { isHydrated, hydrate, token } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
      // Si por alguna razón el middleware no cambia el estado en 2 segundos,
      // forzamos la hidratación para no bloquear al usuario.
      const timeout = setTimeout(() => {
        if (!isHydrated) {
          hydrate(); 
        }
      }, 1000);

    return () => clearTimeout(timeout);
  }, [isHydrated]);
  useEffect(() => {
    hydrate()
    // 2. CRÍTICO: Si Zustand no ha terminado de cargar, no hagas nada
    if (!isHydrated) return;

    const inAuth = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuth) {
      // Usamos replace directo, el isHydrated ya nos da la seguridad
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuth) {
      router.replace(user?.is_admin ? '/(admin)/dashboard' : '/(student)');
    }
  }, [isAuthenticated, segments, isHydrated]); // 3. Añadimos isHydrated aquí

  // 4. MIENTRAS no esté hidratado, mostramos una pantalla de carga
  // Esto evita que el Drawer o el Stack se monten "vacíos"
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.dark }}>
        <ActivityIndicator size="large" color={C.white} />
      </View>
    );
  }

  const headerOpts = {
    headerStyle:      { backgroundColor: C.dark },
    headerTintColor:  C.white,
    headerTitleStyle: { fontWeight: '800' as const, letterSpacing: -0.2 },
    headerBackTitle:  'Volver',
    headerShadowVisible: false,
  };

  if (!user?.is_admin) {
    return (
      <Drawer
        drawerContent={(props) => <StudentDrawerContent {...props} />}
        screenOptions={{
          ...headerOpts,
          drawerStyle: { width: 294 },
          swipeEdgeWidth: 50,
        }}
      >
        <Drawer.Screen name="(student)/index"           options={{ title: 'API Cafetería' }} />
        <Drawer.Screen name="(student)/[slug]" options={{ title: 'Categoría' }} />
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
  const PK_STRIPE = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const { Stack } = require('expo-router');
  return (
    <StripeProvider publishableKey={PK_STRIPE}>
      <Stack screenOptions={headerOpts}>
        <Stack.Screen name="(auth)/login"      options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/logout"     options={{ headerShown: false }} />
        <Stack.Screen name="(admin)/dashboard" options={{ title: 'Panel Admin' }} />
        <Stack.Screen name="(admin)/inventory" options={{ title: 'Inventario' }} />
        <Stack.Screen name="(admin)/settings"  options={{ title: 'Franjas Horarias' }} />
      </Stack>
    </StripeProvider>
  );
}
