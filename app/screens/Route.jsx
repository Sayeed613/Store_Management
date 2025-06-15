import { MaterialIcons } from '@expo/vector-icons';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const RouteCard = ({ route, isDark, onToggleStatus }) => (
  <View className={`mb-4 px-5 py-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} `}>
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <MaterialIcons
          name="alt-route"
          size={24}
          color={isDark ? '#60a5fa' : '#3b82f6'}
        />
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {route.route}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {route.status ? 'Active' : 'Inactive'}
        </Text>
        <Switch
          value={route.status}
          onValueChange={() => onToggleStatus(route.id, !route.status)}
          trackColor={{ false: '#4b5563', true: '#60a5fa' }}
          thumbColor={isDark ? '#fff' : '#fff'}
        />
      </View>
    </View>
  </View>
);

const AddRouteModal = ({ visible, onClose, isDark }) => {
  const [routeName, setRouteName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert('Error', 'Please enter a route name');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'route'), {
        route: routeName.trim(),
        status: true
      });
      onClose(true);
      setRouteName('');
    } catch (error) {
      console.error('Error adding route:', error);
      Alert.alert('Error', 'Failed to add route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View
          className={`w-[90%] p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
        >
          <Text className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Add New Route
          </Text>

          <TextInput
            value={routeName}
            onChangeText={setRouteName}
            placeholder="Enter route name"
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
          />

          <View className="flex-row justify-end gap-2">
            <Pressable
              onPress={() => onClose(false)}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Text className={isDark ? 'text-white' : 'text-gray-900'}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleAddRoute}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${loading ? 'bg-blue-400' : 'bg-blue-500'}`}
            >
              <Text className="text-white">{loading ? 'Adding...' : 'Add Route'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const Route = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const routeQuery = query(collection(db, 'route'), orderBy('route', 'asc'));
      const snapshot = await getDocs(routeQuery);
      const routesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoutes(routesData);
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (routeId, newStatus) => {
    try {
      const ref = doc(db, 'route', routeId);
      await updateDoc(ref, { status: newStatus });

      setRoutes(prev =>
        prev.map(route =>
          route.id === routeId ? { ...route, status: newStatus } : route
        )
      );

      Alert.alert('Success', `Route ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleModalClose = (shouldRefetch) => {
    setShowAddModal(false);
    if (shouldRefetch) fetchRoutes();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading routes...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <ScrollView className="flex-1 p-4">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Routes
            </Text>
            <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage delivery routes and their status
            </Text>
          </View>
          <Pressable
            onPress={() => setShowAddModal(true)}
            className={`p-3 rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
          >
            <MaterialIcons name="add" size={24} color="white" />
          </Pressable>
        </View>

        {routes.length === 0 ? (
          <View className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} items-center`}>
            <MaterialIcons name="alt-route" size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text className={`mt-4 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No routes found
            </Text>
          </View>
        ) : (
          routes.map(route => (
            <RouteCard
              key={route.id}
              route={route}
              isDark={isDark}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}

        <AddRouteModal visible={showAddModal} onClose={handleModalClose} isDark={isDark} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Route;
