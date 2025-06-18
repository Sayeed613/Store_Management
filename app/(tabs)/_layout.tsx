import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ProtectedRoute from '../components/Routes/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useTheme } from "../context/ThemeContextProvider";

// Define the user type
type User = {
  name?: string;
  userType?: string;
};

export default function Layout() {
  const { user, logout } = useAuth() as { user: User | null; logout: () => void };
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();

  // Check if user is admin
  const normalizedUserType = user?.userType?.toLowerCase()?.trim() || '';
  const isAdmin = normalizedUserType === 'admin';

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const tabBarStyle = {
    height: 65,
    paddingBottom: 8,
    paddingTop: 10,
    backgroundColor: isDark ? "#1a1a1a" : "#fff",
    borderTopWidth: 0,
    position: "absolute",
    bottom: 2,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -3 },
    borderRadius: 30,
    marginHorizontal: 20,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f3f4f6" }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ProtectedRoute>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: "#2563eb",
            tabBarInactiveTintColor: isDark ? "#888" : "#666",
            tabBarStyle: tabBarStyle,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "500",
              paddingBottom: 6,
              marginBottom:6
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              tabBarLabel: "History",
              tabBarIcon: ({ color }) => (
                <Ionicons name="time-outline" color={color} size={24} />
              ),
            }}
          />

          {/* Add Store Tab */}
          <Tabs.Screen
            name="add-outlet"
            options={{
              tabBarLabel: "Add Store",
              tabBarIcon: ({ color }) => (
                <FontAwesome5 name="plus" color={color} size={22} />
              ),
            }}
          />

          {/* Stores Tab */}
          <Tabs.Screen
            name="Stores"
            options={{
              tabBarLabel: "Stores",
              tabBarIcon: ({ color }) => (
                <Ionicons name="business-outline" color={color} size={24} />
              ),
            }}
          />

          {/* Settings Tab */}
          <Tabs.Screen
            name="settings"
            options={{
              tabBarLabel: "Settings",
              tabBarIcon: ({ color }) => (
                <Ionicons name="settings-outline" color={color} size={24} />
              ),
            }}
          />

          {!isAdmin && (
            <Tabs.Screen
              name="admin"
              options={{
                tabBarLabel: "Logout",
                tabBarIcon: ({ color }) => (
                  <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                ),
                tabBarButton: (props) => (
                  <Pressable
                    onPress={handleLogout}
                    style={({ pressed }) => ({
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      opacity: pressed ? 0.7 : 1,
                      paddingTop: props.style ? (props.style as any).paddingTop : 0,
                    })}
                  >
                    <View style={{ alignItems: 'center' , marginTop: 6 }}>
                      <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                      <Text style={{
                        fontSize: 10,
                        marginTop: 4,
                        color: "#ef4444",
                        fontWeight: "500"
                      }}>
                        Logout
                      </Text>
                    </View>
                  </Pressable>
                ),
              }}
            />
          )}

          {/* Admin Tab - Only show for admin users */}
          {isAdmin && (
            <Tabs.Screen
              name="admin"
              options={{
                title: 'Admin',
                tabBarLabel: "Admin",
                tabBarIcon: ({ color }) => (
                  <FontAwesome5 name="user-shield" color={color} size={22} />
                ),
              }}
            />
          )}
        </Tabs>
      </ProtectedRoute>
    </SafeAreaView>
  );
}
