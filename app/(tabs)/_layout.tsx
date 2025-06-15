import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContextProvider";

export default function Layout() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2563eb",
          tabBarInactiveTintColor: isDark ? "#888" : "#666",
          tabBarStyle: {
            height: 70,
            borderRadius: 25,
            margin: 10,
            paddingTop: 8,
            backgroundColor: isDark ? "#1a1a1a" : "#fff",
            borderTopWidth: 0,
            elevation: 5,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowOffset: { width: 0, height: -1 },
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: "History",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="Admin"
          options={{
            tabBarLabel: "Admin",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="user-shield" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="add-outlet"
          options={{
            tabBarLabel: "Add Store",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="plus" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="Stores"
          options={{
            tabBarLabel: "Stores",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="Settings"
          options={{
            tabBarLabel: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
