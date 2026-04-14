import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.is_admin) {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(student)" />;
}
