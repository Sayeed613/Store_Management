import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContextProvider';
import AnalyticsOverview from '../screens/AnalyticsOverview';

const AdminCard = ({ title, description, icon, onPress, color, isDark }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`p-4 mb-4 rounded-xl shadow-md ${isDark ? 'bg-gray-900' : 'bg-white'}`}
    style={{ elevation: 3 }}
  >
    <View className="flex-row items-center">
      <View
        className="p-3 rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      <View className="ml-4 flex-1">
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </Text>
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </Text>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={24}
        color={isDark ? '#9ca3af' : '#6b7280'}
      />
    </View>
  </TouchableOpacity>
);

const Admin = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const isAdmin = Boolean(user?.userType?.toLowerCase()?.trim() === 'admin');

  useEffect(() => {
    setLoading(false);
  }, []);

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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

  const adminFeatures = [
    {
      title: 'Store Routes',
      description: 'View and manage delivery routes for stores',
      icon: 'alt-route',
      color: '#10b981',
      route: '../screens/Route',
    },
    {
      title: 'User Management',
      description: 'Manage admin access and PIN settings',
      icon: 'manage-accounts',
      color: '#8b5cf6',
      route: '../screens/Users',
    },
    {
      title: 'Inactive Stores',
      description: 'View and reactivate deactivated stores',
      icon: 'store',
      color: '#ec4899',
      route: '../screens/InActiveStores',
    },
  ];

  if (loading) {
    return (
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <Text className={isDark ? 'text-white' : 'text-gray-900'}>Loading...</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <ScrollView className="p-4" contentContainerStyle={{
            paddingBottom: 70
          }}>
        <AnalyticsOverview />

        <View className="mb-6">
          <View className="flex-row justify-between items-center">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Welcome, {user?.name}
            </Text>

            <TouchableOpacity
              onPress={handleLogout}
              className={`flex-row items-center p-4 rounded-xl shadow-md ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              style={{ elevation: 3 }}
            >
              <View className="p-3 rounded-lg bg-red-100">
                <MaterialIcons name="logout" size={24} color="#ef4444" />
              </View>
            </TouchableOpacity>
          </View>
          <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your application settings
          </Text>
        </View>

        {/* Feature Cards */}
        <View className="mb-10">
          {adminFeatures.map((feature, index) => (
            <AdminCard
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={feature.color}
              isDark={isDark}
              onPress={() => router.push(feature.route)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Admin;
