import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDocs, // Add this
    onSnapshot,
    orderBy,
    query,
    serverTimestamp, // Add this
    updateDoc,
    where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PinModal from '../components/Aunthentication/PinModal';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const InActiveStores = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [inactiveOutlets, setInactiveOutlets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [pinValues, setPinValues] = useState(['', '', '', '']);

  useEffect(() => {
    const q = query(
      collection(db, 'outlets'),
      where('status', '==', 'inactive'),
      orderBy('deactivatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const outlets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInactiveOutlets(outlets);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePinChange = async (index, value) => {
    const newPinValues = [...pinValues];
    newPinValues[index] = value;
    setPinValues(newPinValues);

    if (index === 3 && value !== '') {
      await verifyPinAndActivate(newPinValues.join(''));
    }
  };

  const verifyPinAndActivate = async (enteredPin) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const adminUser = querySnapshot.docs[0]?.data();

      if (adminUser?.pin.toString() === enteredPin) {
        await updateDoc(doc(db, 'outlets', selectedOutlet.id), {
          status: 'active',
          reactivatedAt: serverTimestamp(),
        });
        Alert.alert('Success', 'Outlet has been reactivated');
        setShowPinModal(false);
        setPinValues(['', '', '', '']);
        setSelectedOutlet(null);
      } else {
        Alert.alert('Error', 'Incorrect PIN');
        setPinValues(['', '', '', '']);
      }
    } catch (error) {
      console.error('Activation failed:', error);
      Alert.alert('Error', 'Failed to activate outlet');
    }
  };

  const renderStoreCard = ({ item }) => (
    <View className={`m-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {item.storeName}
          </Text>
          <View className="px-2 py-1 rounded-full bg-red-100">
            <Text className="text-red-700 text-xs font-medium">Inactive</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <MaterialIcons name="person" size={16} color={isDark ? '#9ca3af' : '#4b5563'} />
          <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {item.propName}
          </Text>
        </View>

        <View className="flex-row items-center mb-2">
          <MaterialIcons name="phone" size={16} color={isDark ? '#9ca3af' : '#4b5563'} />
          <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {item.phoneNumber}
          </Text>
        </View>

        <View className="flex-row items-center mb-4">
          <MaterialIcons name="location-on" size={16} color={isDark ? '#9ca3af' : '#4b5563'} />
          <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            {item.address || 'No address'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-gray-200">
          <View>
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Deactivated on
            </Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {new Date(item.deactivatedAt?.seconds * 1000).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedOutlet(item);
              setShowPinModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-green-500 active:bg-green-600"
          >
            <Text className="text-white font-medium">Reactivate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return <Loader message="Loading inactive stores..." />;
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <View className="p-4">
        <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Inactive Stores ({inactiveOutlets.length})
        </Text>
      </View>

      <FlatList
        data={inactiveOutlets}
        renderItem={renderStoreCard}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-4">
            <MaterialIcons
              name="store-off"
              size={48}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No inactive stores found
            </Text>
          </View>
        }
      />

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl min-w-[320px]`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Confirm Reactivation
            </Text>
            <Text className={`text-sm text-center mb-8 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Enter PIN to reactivate this outlet
            </Text>

            <PinModal
              values={pinValues}
              onChange={handlePinChange}
              isDark={isDark}
            />

            <TouchableOpacity
              onPress={() => {
                setShowPinModal(false);
                setPinValues(['', '', '', '']);
                setSelectedOutlet(null);
              }}
              className="mt-6"
            >
              <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default InActiveStores;