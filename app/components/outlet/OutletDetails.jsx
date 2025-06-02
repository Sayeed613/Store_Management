import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/outlet.constants';
import { useTheme } from '../../context/ThemeContextProvider';
import { db } from '../../services/firebase/config';
import SalesTrackingGraph from '../analytics/SalesTrackingGraph';
import { Select } from '../forms/Select';
import TransactionList from '../transactions/TransactionList';


const INITIAL_TRANSACTION_LIMIT = 5;

export default function OutletDetail() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [locationData, setLocationData] = useState(null);
  const [outletData, setOutletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [monthlySales, setMonthlySales] = useState(0);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const [editedData, setEditedData] = useState({
    storeName: '',
    propName: '',
    phoneNumber: '',
    route: '',
    street: '',
    locality: '',
    landmark: '',
    pincode: '',
  });


  const calculateMonthlySales = useCallback((sales) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return sales.reduce((total, transaction) => {
      const transDate = transaction.orderDate;
      if (
        transDate &&
        transDate.getMonth() === currentMonth &&
        transDate.getFullYear() === currentYear
      ) {
        return total + (transaction.amount || 0);
      }
      return total;
    }, 0);
  }, []);


  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'sales'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orderDate: doc.data().orderDate?.toDate()
        }));
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

   useEffect(() => {
    const fetchData = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const outletRef = doc(db, 'outlets', params.id);
        const outletSnap = await getDoc(outletRef);

        if (outletSnap.exists()) {
          const data = { id: outletSnap.id, ...outletSnap.data() };
          setOutletData(data);
          setEditedData({
            storeName: data.storeName || params.storeName || '',
            propName: data.propName || params.propName || '',
            phoneNumber: data.phoneNumber || params.phoneNumber || '',
            route: data.route || '',
            street: data.street || '',
            locality: data.locality || '',
            landmark: data.landmark || '',
            pincode: data.pincode || '',
          });
        }
              const q = query(
          collection(db, 'sales'),
          where('outletId', '==', params.id),
          orderBy('orderDate', 'desc')
        );

        const transactionSnap = await getDocs(q);
        const sales = transactionSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orderDate: doc.data().orderDate?.toDate() || new Date(doc.data().orderDate)
        }));

        setTransactions(sales);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        Alert.alert('Error', 'Failed to load outlet details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (params.location) {
      try {
        const parsed = typeof params.location === 'string'
          ? JSON.parse(params.location)
          : params.location;

        if (parsed?.latitude && parsed?.longitude) {
          setLocationData({
            latitude: parseFloat(parsed.latitude),
            longitude: parseFloat(parsed.longitude),
            address: parsed.address,
          });
        }
      } catch (error) {
        console.error('Failed to parse location:', error);
      }
    }
  }, [params.location]);

  const getDisplayedTransactions = useCallback(() => {
    return showAllTransactions
      ? transactions
      : transactions.slice(0, INITIAL_TRANSACTION_LIMIT);
  }, [transactions, showAllTransactions]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
      await deleteDoc(doc(db, 'sales', transactionId));
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    }
  }, []);

  const handleCall = useCallback(() => {
    const phone = params.phoneNumber || outletData?.phoneNumber;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch((err) => {
        console.error('Failed to make call:', err);
        Alert.alert('Error', 'Could not open phone application');
      });
    }
  }, [params.phoneNumber, outletData]);

  const handleSaveChanges = useCallback(async () => {
    Alert.alert('Save Changes', 'Are you sure you want to save these changes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          try {
            const outletRef = doc(db, 'outlets', params.outletId);
            await updateDoc(outletRef, {
              ...editedData,
              updatedAt: serverTimestamp(),
            });

            setOutletData((prev) => ({
              ...prev,
              ...editedData,
            }));

            setIsEditing(false);
            Alert.alert('Success', 'Outlet details updated successfully');
          } catch (error) {
            console.error('Failed to update outlet:', error);
            Alert.alert('Error', 'Failed to update outlet details');
          }
        },
      },
    ]);
  }, [editedData, params.outletId]);

  const handleCancelEdit = () => {
    setEditedData({
      storeName: outletData?.storeName || '',
      propName: outletData?.propName || '',
      phoneNumber: outletData?.phoneNumber || '',
      route: outletData?.route || '',
      street: outletData?.street || '',
      locality: outletData?.locality || '',
      landmark: outletData?.landmark || '',
      pincode: outletData?.pincode || '',
    });
    setIsEditing(false);
  };

  const formatAddress = useCallback(() => {
    const addressParts = [
      editedData.street || params.street || outletData?.street,
      editedData.route || params.route || outletData?.route,
      editedData.locality || params.locality || outletData?.locality,
      editedData.landmark || params.landmark || outletData?.landmark,
      editedData.pincode || params.pincode || outletData?.pincode,
    ].filter(Boolean);

    return addressParts.length > 0
      ? addressParts.join(', ')
      : 'Address not available';
  }, [params, outletData, editedData]);

  const openInMaps = useCallback(() => {
    if (locationData?.latitude && locationData?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${locationData.latitude},${locationData.longitude}`;
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open maps:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
    }
  }, [locationData]);

  const updateLocation = useCallback(() => {
    router.push({
      pathname: '../../screens/MapScreen',
      params: {
        outletId: params.outletId,
        ...(locationData && {
          existingLat: locationData.latitude,
          existingLng: locationData.longitude,
        }),
      },
    });
  }, [locationData, params.outletId]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);



  const renderStoreDetails = () => {
    return isEditing ? (
      <View className="flex flex-col gap-4 space-y-4">
        {["storeName", "propName", "phoneNumber"].map((field, i) => (
          <TextInput
            key={i}
            value={editedData[field]}
            onChangeText={(text) =>
              setEditedData((prev) => ({ ...prev, [field]: text }))
            }
            placeholder={
              field === 'propName'
                ? 'Owner Name'
                : field === 'storeName'
                  ? 'Store Name'
                  : 'Phone Number'
            }
            keyboardType={field === 'phoneNumber' ? 'phone-pad' : 'default'}
            className={`px-4 py-3 rounded-xl border focus:border-blue-500 ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'
              }`}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
          />
        ))}

        <Select
          label="Route"
          value={editedData.route}
          options={ROUTES}
          onChange={(value) =>
            setEditedData((prev) => ({ ...prev, route: value }))
          }
          placeholder="Select Route"
          required
        />

        <View className="flex-row justify-between gap-4 mt-1 space-x-1">
          <Pressable
            onPress={handleSaveChanges}
            className="flex-1 bg-emerald-600 p-4 rounded-xl shadow-md"
          >
            <Text className="text-white text-center font-semibold">Save</Text>
          </Pressable>
          <Pressable
            onPress={updateLocation}
            className="flex-1 bg-blue-500 p-4 rounded-xl shadow-md"
          >
            <Text className="text-white text-center font-semibold">
              Update Location
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleCancelEdit}
          className="mt-3 bg-red-600 p-4 rounded-xl shadow-md"
        >
          <Text className="text-white text-center font-semibold">Cancel</Text>
        </Pressable>
      </View>
    ) : (
      renderNonEditableDetails()
    );
  };

  const renderNonEditableDetails = () => (
    <View className="space-y-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text
          className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          {outletData?.storeName || 'Unnamed Store'}
        </Text>
        <Pressable
          onPress={() => setIsEditing(true)}
          className="p-2 rounded-full bg-blue-100 dark:bg-gray-700"
        >
          <Ionicons name="pencil" size={20} color={isDark ? '#fff' : '#1e3a8a'} />
        </Pressable>
      </View>

      <View
        className={`rounded-xl flex flex-col gap-2 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
      >
        <Text className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
          Owner: <Text className="font-medium">{outletData?.propName || 'N/A'}</Text>
        </Text>
        <Text className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
          Phone: <Text className="font-medium">{outletData?.phoneNumber || 'N/A'}</Text>
        </Text>
        <Text className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
          Route: <Text className="font-medium">{ROUTES.find((r) => r.value === outletData?.route)?.label || 'N/A'}</Text>
        </Text>
        <Text className={`${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
          Address: <Text className="font-medium">{formatAddress()}</Text>
        </Text>
      </View>

      <View className="flex-row gap-4 space-x-3 mt-4">
        <Pressable
          onPress={handleCall}
          className="flex-1 bg-green-600 py-4 rounded-xl shadow-md"
        >
          <Text className="text-white text-center font-medium">Call</Text>
        </Pressable>
        <Pressable
          onPress={openInMaps}
          className="flex-1 bg-blue-600 py-4 rounded-xl shadow-md"
        >
          <Text className="text-white text-center font-medium">Directions</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderTransactions = () => (
    <View>
      <TransactionList
        transactions={getDisplayedTransactions()}
        isDark={isDark}
        onDeleteTransaction={handleDeleteTransaction}
      />

      {transactions.length > INITIAL_TRANSACTION_LIMIT && (
        <Pressable
          onPress={() => {
            // Simply toggle the state without triggering a reload
            setShowAllTransactions(prev => !prev);
          }}
          className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'
            } border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <Text
            className={`text-center ${isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
          >
            {showAllTransactions
              ? 'Show Less'
              : `Show More (${transactions.length - INITIAL_TRANSACTION_LIMIT} more)`
            }
          </Text>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <View
          className={`flex-row items-center px-4 py-3 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <Pressable onPress={() => router.back()} className="mr-4 p-2">
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Loading Details...
          </Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <View
        className={`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <Pressable onPress={handleBackPress} className="mr-4 p-2">
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <Text
          className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Outlet Details
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">

        <View
          className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
        >
          {renderStoreDetails()}
        </View>
        <SalesTrackingGraph transactions={transactions} />
        {renderTransactions()}
      </ScrollView>
    </SafeAreaView>
  );
}
