import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import PinModal from '../components/Aunthentication/PinModal';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const AdminCard = ({ title, description, icon, onPress, color, isDark }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`p-4 mb-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
  >
    <View className="flex-row items-center">
      <View className="p-3 rounded-lg bg-opacity-20" style={{ backgroundColor: `${color}20` }}>
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
        color={isDark ? '#6b7280' : '#9ca3af'}
      />
    </View>
  </TouchableOpacity>
);


const Admin = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [pinValues, setPinValues] = useState(['', '', '', '']);
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminUser();
  }, []);

  const fetchAdminUser = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const user = querySnapshot.docs[0]?.data();
      setAdminUser(user);
    } catch (error) {
      console.error('Error fetching admin:', error);
      Alert.alert('Error', 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index, value) => {
    const newPinValues = [...pinValues];
    newPinValues[index] = value;
    setPinValues(newPinValues);

    if (index === 3 && value !== '') {
      const enteredPin = newPinValues.join('');
      verifyPin(enteredPin);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const verifyPin = (enteredPin) => {
    if (adminUser?.pin.toString() === enteredPin) {
      setIsAuthenticated(true);
      setPinValues(['', '', '', '']);
    } else {
      Alert.alert('Error', 'Incorrect PIN');
      setPinValues(['', '', '', '']);
    }
  };

const adminFeatures = [
  {
    title: 'Business Analytics',
    description: 'View detailed sales reports and business metrics',
    icon: 'insights',
    color: '#3b82f6',
    route: '../screens/AnalyticsOverview'
  },
  {
    title: 'Store Routes',
    description: 'View and manage delivery routes for stores',
    icon: 'alt-route',
    color: '#10b981',
    route: '../screens/Route'
  },
  {
    title: 'User Management',
    description: 'Manage admin access and PIN settings',
    icon: 'manage-accounts',
    color: '#8b5cf6',
    route: '../screens/Users'
  },
  {
    title: 'Inactive Stores',
    description: 'View and reactivate deactivated stores',
    icon: 'store',
    color: '#ec4899',
    route: '../screens/InActiveStores'
  }
];






  if (!isAuthenticated) {
    return (
       <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 justify-center items-center p-4">
          <View className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Admin Access
            </Text>
            <Text className={`text-sm text-center mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter your PIN to continue
            </Text>

            <PinModal
              values={pinValues}
              onChange={handlePinChange}
              isDark={isDark}
            />
          </View>
        </View>
      </View>
        </TouchableWithoutFeedback>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <ScrollView className="p-4">
        <View className="mb-6">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Welcome, {adminUser?.name}
          </Text>
          <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your store settings and configurations
          </Text>
        </View>

        <View>
          {adminFeatures.map((feature, index) => (
            <AdminCard
              key={index}
              {...feature}
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