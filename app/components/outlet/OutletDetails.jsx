import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/outlet.constants';
import { useTheme } from '../../context/ThemeContextProvider';
import { db } from '../../services/firebase/config';
import SalesTrackingGraph from '../analytics/SalesTrackingGraph';
import { Select } from '../forms/Select';
import TransactionList from '../transactions/TransactionList';


export default function OutletDetail() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // States with memoization
  const [locationData, setLocationData] = useState(null);
  const [outletData, setOutletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [editedData, setEditedData] = useState({
    storeName: '',
    propName: '',
    phoneNumber: '',
    route: '',
    street: '',
    locality: '',
    landmark: '',
  });

  // Memoize animation value
  const scrollY = useMemo(() => new Animated.Value(0), []);
  const bottomButtonsStyle = useMemo(() => ({
    opacity: scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    }),
    transform: [{
      translateY: scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 50],
        extrapolate: 'clamp'
      })
    }]
  }), [scrollY]);

  // Optimized data fetching
  const fetchData = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const outletRef = doc(db, 'outlets', params.id);
      const salesRef = collection(db, 'sales');

      const [outletSnap, transactionSnap] = await Promise.all([
        getDoc(outletRef),
        getDocs(query(
          salesRef,
          where('outletId', '==', params.id),
          orderBy('orderDate', 'desc'),
          limit(10)
        ))
      ]);

      if (outletSnap.exists()) {
        const data = { id: outletSnap.id, ...outletSnap.data() };
        setOutletData(data);
        setEditedData({
          storeName: data.storeName || '',
          propName: data.propName || '',
          phoneNumber: data.phoneNumber || '',
          route: data.route || '',
          street: data.street || '',
          locality: data.locality || '',
          landmark: data.landmark || '',
        });
        setLocationData(data.location || null);
      }

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
  }, [params.id]);

  // Load data on mount and params change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Optimized save changes handler
  const handleSaveChanges = useCallback(async () => {
    if (!editedData.storeName.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    try {
      await updateDoc(doc(db, 'outlets', params.id), {
        ...editedData,
        updatedAt: serverTimestamp(),
      });

      setOutletData(prev => ({
        ...prev,
        ...editedData,
      }));
      setIsEditing(false);
      Alert.alert('Success', 'Details updated successfully');
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Error', 'Failed to update details');
    }
  }, [editedData, params.id]);

  // Memoized handlers
  const handleCall = useCallback(() => {
    const phone = outletData?.phoneNumber;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Error', 'Could not open phone application');
      });
    }
  }, [outletData]);

  const openInMaps = useCallback(() => {
    if (locationData?.latitude && locationData?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${locationData.latitude},${locationData.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps application');
      });
    }
  }, [locationData]);

  const handleUpdateLocation = useCallback(() => {
    router.push({
      pathname: '/screens/MapScreen',
      params: {
        outletId: params.id,
        returnTo: 'outletDetails',
        isEditing: true,
        existingLat: locationData?.latitude,
        existingLng: locationData?.longitude,
      },
    });
  }, [params.id, locationData]);


const renderGraphModal = () => (
  <Modal
    visible={showGraphModal}
    animationType="fade"
    transparent
  >
    <View className="flex-1 justify-center items-center ">
      <View
        className={`w-[90%] rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-xl`}
        style={{ maxHeight: '80%' }}
      >
        {/* Header */}
        <View className={`flex-row justify-between items-center p-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <View>
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Sales Analytics
            </Text>

          </View>
          <Pressable
            onPress={() => setShowGraphModal(false)}
            className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
          >
            <MaterialIcons
              name="close"
              size={20}
              color={isDark ? 'white' : 'black'}
            />
          </Pressable>
        </View>

        {/* Graph Content */}
        <ScrollView className="p-4">
          <SalesTrackingGraph transactions={transactions} />
        </ScrollView>
      </View>
    </View>
  </Modal>
);
  const renderHeader = () => (
    <View className={`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
      <Pressable
        onPress={() => router.back()}
        className="mr-4 p-2 active:opacity-70"
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={isDark ? '#fff' : '#000'}
        />
      </Pressable>
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
        }`}>
        {isEditing ? 'Edit Store' : 'Store Details'}
      </Text>
    </View>
  );

  const renderEditableField = (label, value, onChangeText, options = {}) => {
    const { keyboardType = 'default', multiline = false } = options;

    return (
      <View className="mb-4">
        <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          className={`px-4 py-3 rounded-xl border ${isDark
            ? 'bg-gray-800 border-gray-700 text-white'
            : 'bg-white border-gray-200 text-gray-900'
            }`}
          placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        />
      </View>
    );
  };

const renderStoreInfo = () => {
  const totals = useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const amount = Number(transaction.amount) || 0;
      const totalPaid = transaction.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const remaining = amount - totalPaid;

      return {
        totalSales: acc.totalSales + amount,
        totalBalance: acc.totalBalance + (remaining > 0 ? remaining : 0)
      };
    }, { totalSales: 0, totalBalance: 0 });
  }, [transactions]);

  return (
    <View className="p-4">
      {/* Store Name and Edit */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {outletData?.storeName}
        </Text>
        <Pressable
          onPress={() => setIsEditing(true)}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <MaterialIcons name="edit" size={20} color={isDark ? '#fff' : '#374151'} />
        </Pressable>
      </View>

      {/* Store Details Container */}
      <View className="space-y-4">
        {/* Owner and Route Info */}
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Owner</Text>
            <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {outletData?.propName}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Route</Text>
            <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {ROUTES.find(r => r.value === outletData?.route)?.label}
            </Text>
          </View>
        </View>

        {/* Address and Phone */}
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Address</Text>
            <Pressable
              onPress={openInMaps}
              className="flex-row items-center"
            >
              <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {[
                  outletData?.street,
                  outletData?.locality,
                  outletData?.landmark,
                ].filter(Boolean).join(', ')}
              </Text>
              <MaterialIcons
                name="directions"
                size={20}
                color={isDark ? '#60a5fa' : '#2563eb'}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>

          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</Text>
            <Pressable
              onPress={handleCall}
              className="flex-row items-center"
            >
              <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {outletData?.phoneNumber}
              </Text>
              <MaterialIcons
                name="phone"
                size={20}
                color={isDark ? '#4ade80' : '#16a34a'}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          </View>
        </View>

        {/* Sales and Balance Cards */}
        <View className="flex-row mt-2 justify-between">
          <View className="flex-1 mr-2 p-3 rounded-xl bg-green-100">
            <Text className="text-xs text-green-800">Total Sales</Text>
            <Text className="text-sm font-bold text-green-800">
              ₹{totals.totalSales.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
            </Text>
          </View>
          <View className="flex-1 ml-2 p-3 rounded-xl bg-red-100">
            <Text className="text-xs text-red-800">Balance Due</Text>
            <Text className="text-sm font-bold text-red-800">
              ₹{totals.totalBalance.toLocaleString('en-IN', {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
            </Text>
          </View>
        </View>

        {/* View Sales Analytics Button */}
        <View className="pt-4 ">
          <Pressable
            onPress={() => setShowGraphModal(true)}
            className={`flex-row items-center justify-center p-3 rounded-xl ${
              isDark ? 'bg-gray-700' : 'bg-blue-50'
            }`}
          >
            <MaterialIcons
              name="analytics"
              size={20}
              color={isDark ? '#60a5fa' : '#2563eb'}
              style={{ marginRight: 8 }}
            />
            <Text className={`font-medium ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              View Sales Analytics
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};


  const renderEditForm = () => (
    <View className="space-y-4 p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'
          }`}>
          Edit Store Details
        </Text>
        <Pressable
          onPress={() => setIsEditing(false)}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'
            }`}
        >
          <MaterialIcons
            name="close"
            size={24}
            color={isDark ? '#fff' : '#374151'}
          />
        </Pressable>
      </View>

      {renderEditableField(
        'Store Name',
        editedData.storeName,
        text => setEditedData(prev => ({ ...prev, storeName: text }))
      )}

      {renderEditableField(
        'Phone Number',
        editedData.phoneNumber,
        text => setEditedData(prev => ({ ...prev, phoneNumber: text })),
        { keyboardType: 'phone-pad' }
      )}

      {renderEditableField(
        'Owner Name',
        editedData.propName,
        text => setEditedData(prev => ({ ...prev, propName: text }))
      )}

      <View className="mb-4">
        <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Route
        </Text>
        <Select
          value={editedData.route}
          options={ROUTES}
          onChange={value => setEditedData(prev => ({ ...prev, route: value }))}
          isDark={isDark}
        />
      </View>








      <Pressable
        onPress={handleUpdateLocation}
        className="bg-blue-600 p-4 rounded-xl mb-4"
      >
        <Text className="text-white text-center font-medium">
          Update Location
        </Text>
      </Pressable>

      <View className="flex-row gap-4">
        <Pressable
          onPress={() => setIsEditing(false)}
          className="flex-1 bg-gray-500 py-4 rounded-xl"
        >
          <Text className="text-white text-center font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSaveChanges}
          className="flex-1 bg-green-600 py-4 rounded-xl"
        >
          <Text className="text-white text-center font-medium">Save</Text>
        </Pressable>
      </View>
    </View>
  );
  return (
  <SafeAreaView className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
    {renderHeader()}
    <Animated.ScrollView
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      className="flex-1"
    >
      <View className={`m-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        {isEditing ? renderEditForm() : renderStoreInfo()}
      </View>

      {!isEditing && (
        <View className="px-4">
          <TransactionList
            transactions={transactions}
            isDark={isDark}
            onTransactionUpdate={(updatedTransaction) => {
              setTransactions(prev =>
                prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
              );
            }}
          />
        </View>
      )}
    </Animated.ScrollView>
    {renderGraphModal()}
  </SafeAreaView>
);
}