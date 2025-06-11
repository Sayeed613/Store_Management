import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  collection, deleteDoc, doc,
  getDocs,
  onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Animated, Linking, Pressable,
  ScrollView, Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROUTES } from '../../constants/outlet.constants';
import { useTheme } from '../../context/ThemeContextProvider';
import { db } from '../../services/firebase/config';
import SalesTrackingGraph from '../analytics/SalesTrackingGraph';
import PinModal from '../Aunthentication/PinModal';
import Loader from '../common/Loader';
import { Select } from '../forms/Select';
import TransactionList from '../transactions/TransactionList';

export default function OutletDetail() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [locationData, setLocationData] = useState(null);
  const [outletData, setOutletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValues, setPinValues] = useState(['', '', '', '']);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [editedData, setEditedData] = useState({
    storeName: '',
    propName: '',
    phoneNumber: '',
    route: '',
    street: '',
    locality: '',
    landmark: '',
  });

  // Animation value
  const scrollY = useMemo(() => new Animated.Value(0), []);

  // Real-time data subscriptions
  useEffect(() => {
    if (!params.id) return;

    setLoading(true);

    // Outlet listener
    const outletUnsubscribe = onSnapshot(
      doc(db, 'outlets', params.id),
      (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
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
        setLoading(false);
      },
      (error) => {
        console.error('Outlet listener error:', error);
        Alert.alert('Error', 'Failed to load outlet details');
        setLoading(false);
      }
    );

    // Transactions listener
    const salesQuery = query(
      collection(db, 'sales'),
      where('outletId', '==', params.id),
      orderBy('orderDate', 'desc')
    );

    const transactionsUnsubscribe = onSnapshot(
      salesQuery,
      (snapshot) => {
        const sales = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          orderDate: doc.data().orderDate?.toDate() || new Date(doc.data().orderDate)
        }));
        setTransactions(sales);
      },
      (error) => {
        console.error('Transactions listener error:', error);
        Alert.alert('Error', 'Failed to load transactions');
      }
    );

    // Cleanup subscriptions
    return () => {
      outletUnsubscribe();
      transactionsUnsubscribe();
    };
  }, [params.id]);

const totals = useMemo(() => {
  return transactions.reduce((acc, transaction) => {
    const amount = Number(transaction.amount) || 0;
    const totalPaid = transaction.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
    const remaining = amount - totalPaid;

    return {
      totalSales: acc.totalSales + amount,
      totalBalance: acc.totalBalance + (remaining > 0 ? remaining : 0),
      creditLimit: outletData?.creditLimit || 0
    };
  }, {
    totalSales: 0,
    totalBalance: 0,
    creditLimit: outletData?.creditLimit || 0
  });
}, [transactions, outletData?.creditLimit]);

  const handleCall = useCallback(() => {
    if (outletData?.phoneNumber) {
      Linking.openURL(`tel:${outletData.phoneNumber}`);
    }
  }, [outletData?.phoneNumber]);

  const openInMaps = useCallback(() => {
    if (locationData?.latitude && locationData?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${locationData.latitude},${locationData.longitude}`;
      Linking.openURL(url);
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
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Error', 'Failed to update details');
    }
  }, [editedData, params.id]);

  const handleDeleteTransaction = useCallback(async (transactionId) => {
    try {
      await deleteDoc(doc(db, 'sales', transactionId));
      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    }
  }, []);
  // Add these functions after other handlers

const handlePinChange = (index, value) => {
  const newPinValues = [...pinValues];
  newPinValues[index] = value;
  setPinValues(newPinValues);

  if (index === 3 && value !== '') {
    verifyPinAndDeactivate(newPinValues.join(''));
  }
};

const verifyPinAndDeactivate = async (enteredPin) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const adminUser = querySnapshot.docs[0]?.data();

    if (adminUser?.pin.toString() === enteredPin) {
      await updateDoc(doc(db, 'outlets', params.id), {
        status: 'inactive',
        deactivatedAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Outlet has been deactivated');
      setShowPinModal(false);
      setPinValues(['', '', '', '']);
      router.back();
    } else {
      Alert.alert('Error', 'Incorrect PIN');
      setPinValues(['', '', '', '']);
    }
  } catch (error) {
    console.error('Deactivation failed:', error);
    Alert.alert('Error', 'Failed to deactivate outlet');
  }
};



  const renderEditableField = useCallback(({ label, value, onChange, props = {} }) => (
    <View className="mb-4">
      <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        className={`p-3 rounded-xl ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
        placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
        {...props}
      />
    </View>
  ), [isDark]);

  const renderHeader = useCallback(() => (
    <View className={`flex-row items-center px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <Pressable onPress={() => router.back()} className="mr-4 p-2">
        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
      </Pressable>
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {isEditing ? 'Edit Store' : 'Store Details'}
      </Text>
    </View>
  ), [isDark, isEditing]);

  const renderEditForm = useCallback(() => (
    <View className="space-y-4 p-4">
      {/* Edit form content */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Edit Store Details
        </Text>
        <Pressable
          onPress={() => setIsEditing(false)}
          className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <MaterialIcons name="close" size={24} color={isDark ? '#fff' : '#374151'} />
        </Pressable>
      </View>

      {renderEditableField({
        label: 'Store Name',
        value: editedData.storeName,
        onChange: (text) => setEditedData(prev => ({ ...prev, storeName: text }))
      })}

      {renderEditableField({
        label: 'Phone Number',
        value: editedData.phoneNumber,
        onChange: (text) => setEditedData(prev => ({ ...prev, phoneNumber: text })),
        props: { keyboardType: 'phone-pad' }
      })}

      {renderEditableField({
        label: 'Owner Name',
        value: editedData.propName,
        onChange: (text) => setEditedData(prev => ({ ...prev, propName: text }))
      })}

      <View className="mb-4">
        <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Route
        </Text>
        <Select
          value={editedData.route}
          options={ROUTES}
          onChange={value => setEditedData(prev => ({ ...prev, route: value }))}
          isDark={isDark}
        />
      </View>

      {renderEditableField({
        label: 'Street',
        value: editedData.street,
        onChange: (text) => setEditedData(prev => ({ ...prev, street: text }))
      })}

      {renderEditableField({
        label: 'Locality',
        value: editedData.locality,
        onChange: (text) => setEditedData(prev => ({ ...prev, locality: text }))
      })}

      {renderEditableField({
        label: 'Landmark',
        value: editedData.landmark,
        onChange: (text) => setEditedData(prev => ({ ...prev, landmark: text }))
      })}

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
  ), [isDark, editedData, handleSaveChanges, renderEditableField, handleUpdateLocation]);

  const renderStoreInfo = useCallback(() => (
    <View className="p-4">
      {/* Store info content */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {outletData?.storeName}
        </Text>
       <View className="flex-row">
        <Pressable
          onPress={() => setIsEditing(true)}
          className={`p-2 rounded-full mr-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <MaterialIcons name="edit" size={20} color={isDark ? '#fff' : '#374151'} />
        </Pressable>
        <Pressable
          onPress={() => setShowPinModal(true)}
          className="p-2 rounded-full bg-red-500"
        >
          <MaterialIcons name="delete" size={20} color="#fff" />
        </Pressable>
        </View>
      </View>

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
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Address</Text>
              <MaterialIcons
                name="open-in-new"
                size={20}
                color={isDark ? '#60a5fa' : '#2563eb'}
                style={{ marginLeft: 6 }}
              />
            </View>
            <Pressable
              onPress={openInMaps}
              accessibilityLabel="Open address in map"
              accessibilityRole="button"
              className="flex-row items-center"
            >
              <Text className={`text-base underline ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {[outletData?.street, outletData?.locality, outletData?.landmark].filter(Boolean).join(', ')}
              </Text>

            </Pressable>

            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tap to get directions
            </Text>
          </View>

          {/* Phone Section */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</Text>
              <MaterialIcons
                name="phone"
                size={20}
                color={isDark ? '#4ade80' : '#16a34a'}
                style={{ marginLeft: 8 }}
              />
            </View>

            <Pressable
              onPress={handleCall}
              accessibilityLabel="Call this number"
              accessibilityRole="button"
              className="flex-row items-center"
            >
              <Text className={`text-base underline ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {outletData?.phoneNumber}
              </Text>
            </Pressable>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tap to call
            </Text>
          </View>
        </View>



        {/* Sales and Balance Cards */}
        <View className="flex-row mt- justify-between">
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
         <View className='mt-2'>
          <View className="bg-blue-100 p-3 rounded-xl">
        <Text className="text-xs text-blue-800">Credit Limit</Text>
        <Text className="text-sm font-bold text-blue-800">
          ₹{totals.creditLimit.toLocaleString('en-IN', {
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
            className={`flex-row items-center justify-center p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-blue-50'
              }`}
          >
            <MaterialIcons
              name="analytics"
              size={20}
              color={isDark ? '#60a5fa' : '#2563eb'}
              style={{ marginRight: 8 }}
            />
            <Text className={`font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
              View Sales Analytics
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  ), [isDark, outletData,totals,  setIsEditing]);


  // Add this before the final return statement

const renderPinModal = () => (
  <Modal
    isVisible={showPinModal}
    backdropOpacity={0.5}
    animationIn="fadeIn"
    animationOut="fadeOut"
    useNativeDriver
    hideModalContentWhileAnimating
    onBackdropPress={() => {
      setShowPinModal(false);
      setPinValues(['', '', '', '']);
    }}
  >
    <View className="flex-1 justify-center items-center">
      <View className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl min-w-[320px]`}>
        <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Confirm Deactivation
        </Text>
        <Text className={`text-sm text-center mb-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          Enter PIN to deactivate this outlet
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
);

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
          <View className={`flex-row justify-between items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
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



  if (loading) {
    return <Loader message="Loading outlet details..." />;
  }

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
              onDeleteTransaction={handleDeleteTransaction}
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
      {renderPinModal()}
    </SafeAreaView>
  );
}