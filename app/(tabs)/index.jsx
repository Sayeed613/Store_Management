import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View
} from 'react-native';
import Loader from '../components/common/Loader';
import Order from '../components/transactions/Order';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';
import { filterOrdersByDateRange, getDateRanges } from '../utils/dataFilter';

const OrderHistory = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState('thirtyDays');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);


  const dateRanges = getDateRanges();

  useEffect(() => {
    setIsLoading(true);

    const outletsRef = collection(db, 'outlets');
    const ordersRef = collection(db, 'sales');
    const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'));

    let outletPhones = {};

    getDocs(outletsRef).then((outletsSnap) => {
      outletsSnap.docs.forEach((doc) => {
        outletPhones[doc.id] = doc.data().phoneNumber;
      });

      const unsubscribe = onSnapshot(
        ordersQuery,
        (querySnapshot) => {
          const ordersData = querySnapshot.docs
            .filter(doc => !!doc.data().orderDate)
            .map((doc) => {
              const data = doc.data();
              const orderDate = data.orderDate?.toDate?.()
                || new Date(data.orderDate?.seconds * 1000);

              return {
                id: doc.id,
                ...data,
                orderDate,
                phoneNumber: outletPhones[data.outletId] || null,
                payments: data.payments || [],
                totalPaid: data.totalPaid || 0,
                remainingBalance:
                  data.remainingBalance || (data.amount - (data.totalPaid || 0)),
              };
            });

          setOrders(ordersData);
          setIsLoading(false);
          setIsRefreshing(false);
        },
        (error) => {
          console.error('Error in real-time listener:', error);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      );

      return () => unsubscribe();
    });
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleNavigateToOutlet = useCallback((order) => {
    if (!order?.outletId) return;

    router.push({
      pathname: "/outlet/[id]",
      params: {
        id: order.outletId,
        storeName: order.storeName,
        propName: order.customerName,
        phoneNumber: order.phoneNumber
      }
    });
  }, [router]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const timestamp = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return timestamp.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const renderFilterButtons = () => (
  <View className="flex-row justify-between items-center mb-4">
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {Object.keys(dateRanges).map(renderDateRangeButton)}
    </ScrollView>
    <Pressable
      onPress={() => setShowInactive(!showInactive)}
      className={`ml-2 px-4 py-2 rounded-full ${
        showInactive
          ? 'bg-gray-600'
          : isDark ? 'bg-gray-800' : 'bg-gray-200'
      }`}
    >
      <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>
        {showInactive ? 'Show Active' : 'Show Inactive'}
      </Text>
    </Pressable>
  </View>
);

  const renderDateRangeButton = (rangeKey) => (
    <Pressable
      key={rangeKey}
      onPress={() => setSelectedRange(rangeKey)}
      className={`px-6 py-3 rounded-full mr-2 ${
        selectedRange === rangeKey
          ? 'bg-blue-600'
          : isDark ? 'bg-gray-800' : 'bg-gray-200'
      }`}
    >
      <Text
        className={`${
          selectedRange === rangeKey
            ? 'text-white font-bold'
            : isDark ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        {dateRanges[rangeKey].label}
      </Text>
    </Pressable>
  );

  const renderOrderCard = (order) => {
    const totalPaid = order.totalPaid || 0;
    const remainingBalance = order.remainingBalance || (order.amount - totalPaid);
    const lastPayment = order.payments?.[order.payments.length - 1];

    return (
      <Pressable
        key={order.id}
        onPress={() => handleNavigateToOutlet(order)}
        className={`p-4 mb-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm active:opacity-70`}
      >
        <View className='flex flex-row justify-between items-center mb-2'>
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-600'}`}>
            {order.storeName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {formatDate(order.orderDate)}
          </Text>
        </View>
        <View className='flex flex-row gap-5 mt-2'>
          <View className='flex flex-col gap-1'>
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Total</Text>
            <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>₹{totalPaid.toFixed(2)}</Text>
          </View>
          <View className='flex flex-col gap-1'>
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Balance</Text>
            <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>₹{remainingBalance.toFixed(2)}</Text>
          </View>
          <View className='flex-1 items-end'>
            <Text className={`text-xs font-semibold ${order.status === 'Completed' ? 'text-green-800' : 'text-yellow-800'}`}>
              {order.status}
            </Text>
          </View>
        </View>
        {order.phoneNumber && (
          <View className={`flex-row justify-between items-center pt-3 mt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row items-center">
              <MaterialIcons name="phone" size={18} color={isDark ? '#9ca3af' : '#4b5563'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{order.phoneNumber}</Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(`tel:${order.phoneNumber}`)}
              className={`flex-row items-center px-1 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
            >
              <MaterialIcons name="call" size={16} color="#fff" />
              <Text className="text-white font-medium ml-2">Call Now</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  if (isLoading) {
    return <Loader message="Loading orders..." />;
  }

const filteredOrders = filterOrdersByDateRange(orders, selectedRange);


  return (
    <>
      <ScrollView
        className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
      >
        <View className="p-4">
          <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Order History
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {Object.keys(dateRanges).map(renderDateRangeButton)}
          </ScrollView>

          <View className="mt-2">
            {filteredOrders.length === 0 ? (
              <View className={`p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} items-center`}>
                <MaterialIcons name="receipt-long" size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
                <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  No orders found for this period
                </Text>
              </View>
            ) : (
              filteredOrders.map(renderOrderCard)
            )}
          </View>
        </View>
      </ScrollView>

      <Pressable
        onPress={() => setShowOrderModal(true)}
        className={`absolute bottom-8 left-1/2 -ml-12 w-32 h-12 flex-row items-center justify-center rounded-full bg-blue-600 shadow-lg active:bg-blue-700`}
        style={{
          transform: [{ translateX: -16 }],
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text className="text-white font-medium ml-1">Add Sale</Text>
      </Pressable>

      <Order
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onOrderSaved={() => setShowOrderModal(false)}
      />
    </>
  );
};

export default OrderHistory;
