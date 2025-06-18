import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { PROTECTED_ROUTES } from '../../constants/route';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, path }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (path) {
        // Check if user has access to this route
        const hasAccess = PROTECTED_ROUTES.some(
          (route) =>
            route.path === path && (!route.roles || route.roles.includes(user.role))
        );

        if (!hasAccess) {
          // Redirect to default route or home if user doesn't have access
          router.replace('/(tabs)');
        }
      }
    }
  }, [user, loading, path]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return user ? children : null;
}