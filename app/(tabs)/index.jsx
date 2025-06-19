import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
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

  const dateRanges = getDateRanges();

  useEffect(() => {
    setIsLoading(true);

    const outletsRef = collection(db, 'outlets');
    const ordersRef = collection(db, 'sales');
    const ordersQuery = query(ordersRef, orderBy('orderDate', 'desc'));

    let unsubscribeOrders = null;

    const unsubscribeOutlets = onSnapshot(outletsRef, (outletsSnap) => {
      const outletData = {};

      outletsSnap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.status !== 'inactive') {
          outletData[doc.id] = {
            phoneNumber: data.phoneNumber,
            storeName: data.storeName,
            status: data.status || 'active'
          };
        }
      });

      if (unsubscribeOrders) unsubscribeOrders();

      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (querySnapshot) => {
          const ordersData = querySnapshot.docs
            .filter(doc => {
              const data = doc.data();
              return !!data.orderDate && outletData[data.outletId];
            })
            .map((doc) => {
              const data = doc.data();
              const orderDate = data.orderDate?.toDate?.() ||
                new Date(data.orderDate?.seconds * 1000);

              return {
                id: doc.id,
                ...data,
                orderDate,
                phoneNumber: outletData[data.outletId]?.phoneNumber || null,
                storeName: outletData[data.outletId]?.storeName || data.storeName,
                payments: data.payments || [],
                totalPaid: data.totalPaid || 0,
                remainingBalance: data.amount - (data.totalPaid || 0)
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
    });

    return () => {
      unsubscribeOutlets();
      if (unsubscribeOrders) unsubscribeOrders();
    };
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

  const renderDateRangeButton = (rangeKey) => (
    <Pressable
      key={rangeKey}
      onPress={() => setSelectedRange(rangeKey)}
      className={`px-6 py-3 rounded-full mr-2 ${selectedRange === rangeKey
          ? 'bg-blue-600'
          : isDark ? 'bg-gray-800' : 'bg-gray-200'
        }`}
    >
      <Text
        className={`${selectedRange === rangeKey
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
            <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              ₹{totalPaid.toFixed(2)}
            </Text>
          </View>
          <View className='flex flex-col gap-1'>
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Balance</Text>
            <Text className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
              ₹{remainingBalance.toFixed(2)}
            </Text>
          </View>
          <View className='flex-1 items-end'>
            <Text className={`text-xs font-semibold ${order.status === 'Completed' ? 'text-green-800' : 'text-yellow-800'
              }`}>
              {order.status}
            </Text>
          </View>
        </View>
        {order.phoneNumber && (
          <View className={`flex-row justify-between items-center pt-3 mt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <View className="flex-row items-center">
              <MaterialIcons name="phone" size={18} color={isDark ? '#9ca3af' : '#4b5563'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {order.phoneNumber}
              </Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(`tel:${order.phoneNumber}`)}
              className={`flex-row items-center px-1 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'
                }`}
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
      {/* Fixed Header & Filters */}
      <View
        className={`absolute top-0 left-0 right-0 z-10 px-4 pt-6 pb-4 ${isDark ? 'bg-black' : 'bg-white'} shadow`}
        style={{ elevation: 3 }}
      >
        <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Sales History
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(dateRanges).map(renderDateRangeButton)}
        </ScrollView>
      </View>

      {/* Scrollable Order List */}
      <ScrollView
        className={`flex-1  ${isDark ? 'bg-black' : 'bg-gray-100'}`}
        contentContainerStyle={{ paddingTop: 140, paddingBottom: 70 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
      >
        <View className="px-4 mt-2 ">
          {filteredOrders.length === 0 ? (
            <View className={`p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} items-center`}>
              <MaterialIcons name="receipt-long" size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
              <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No orders found from active stores
              </Text>
            </View>
          ) : (
            filteredOrders.map(renderOrderCard)
          )}
        </View>
      </ScrollView>

      {/* Add Sale Floating Button */}
      <Pressable
        onPress={() => setShowOrderModal(true)}
        className="absolute bottom-24 left-1/2 w-32 h-12 flex-row items-center justify-center rounded-full bg-blue-600 shadow-lg active:bg-blue-700"
        style={{
          transform: [{ translateX: -56 }],
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
