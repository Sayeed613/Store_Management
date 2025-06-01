import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContextProvider';

import '../global.css';

export default function Layout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: isDark ? '#888' : '#666',
          tabBarStyle: {
            height: 60,
            paddingBottom: 8,
            backgroundColor: isDark ? '#1a1a1a' : '#fff',
            borderTopColor: isDark ? '#333' : '#e5e5e5',
            borderTopWidth: 1,
          },
          tabBarBackground: () => (
            <View
              style={{
                backgroundColor: isDark ? '#000' : '#fff',
                height: '100%',
              }}
            />
          ),
        }}
      >
       <Tabs.Screen
  name="index"
  options={{
    tabBarLabel: 'History',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="time-outline" color={color} size={size} />
    ),
  }}
/>
<Tabs.Screen
  name="add-outlet"
  options={{
    tabBarLabel: 'Add Outlet',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="storefront-outline" color={color} size={size} />
    ),
  }}
/>
<Tabs.Screen
  name="Stores"
  options={{
    tabBarLabel: 'stores',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="business-outline" color={color} size={size} />
    ),
  }}
/>

<Tabs.Screen
  name="admin"
  options={{
    tabBarLabel: 'Admin',
    tabBarIcon: ({ color, size }) => (
      <FontAwesome5 name="user-shield" color={color} size={size} />
    ),
  }}
/>
<Tabs.Screen
  name="settings"
  options={{
    tabBarLabel: 'Settings',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" color={color} size={size} />
    ),
  }}
/>

      </Tabs>
    </SafeAreaView>
  );
}