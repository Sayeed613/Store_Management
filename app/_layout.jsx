import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContextProvider';
import "./global.css";

// Prevent native splash screen from autohiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user } = useAuth()
  const [fontsLoaded, fontError] = useFonts({
    // Add your custom fonts here if any
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
    LogBox.ignoreLogs([
      'Warning: Failed prop type',
      'Non-serializable values were found in the navigation state',
    ]);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }


  const isAdmin = user?.userType?.toLowerCase()?.trim() === 'admin';

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="screens/login"
                options={{ headerShown: false }}
              />
              {!isAdmin && (
                <Stack.Screen
                  name="admin"
                  options={{ headerShown: false }}
                />
              )}
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}