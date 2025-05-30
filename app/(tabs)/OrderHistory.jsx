import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Loader from '../components/common/Loader';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';
import { filterOrdersByDateRange, getDateRanges } from '../utils/dataFilter';

const OrderHistory = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState('fiveDays');
  const dateRanges = getDateRanges();

  const fetchOrders = async (showRefresh = false) => {
  try {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    const outletsRef = collection(db, 'outlets');
    const outletsSnap = await getDocs(outletsRef);
    const outletPhones = {};
    outletsSnap.docs.forEach(doc => {
      outletPhones[doc.id] = doc.data().phoneNumber;
    });

    const ordersRef = collection(db, 'sales');
    const q = query(ordersRef, orderBy('orderDate', 'desc'));
    const querySnapshot = await getDocs(q);

    const ordersData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      orderDate: doc.data().orderDate?.toDate?.() ||
                new Date(doc.data().orderDate?.seconds * 1000),
      phoneNumber: outletPhones[doc.data().outletId] || null
    }));

    setOrders(ordersData);
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

  const onRefresh = useCallback(() => {
    fetchOrders(true);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderDateRangeButton = rangeKey => (
    <Pressable
      key={rangeKey}
      onPress={() => setSelectedRange(rangeKey)}
      className={`px-6 py-3 rounded-full mr-2 ${selectedRange === rangeKey
          ? 'bg-blue-600'
          : isDark
            ? 'bg-gray-800'
            : 'bg-gray-200'
        }`}
    >
      <Text
        className={`${selectedRange === rangeKey
            ? 'text-white font-bold'
            : isDark
              ? 'text-gray-300'
              : 'text-gray-700'
          }`}
      >
        {dateRanges[rangeKey].label}
      </Text>
    </Pressable>
  );

  const renderOrderCard = order => (
    <View
      key={order.id}
      className={`p-4 mb-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-2">
          <Text
            className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'
              }`}
          >
            {order.storeName}
          </Text>
          <Text
            className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
              }`}
          >
            {order.orderDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View className="items-end">
          <Text
            className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'
              }`}
          >
            ₹{(order.amount || 0).toFixed(2)}
          </Text>
          <View
            className={`px-3 py-1 rounded-full mt-1 ${order.paymentMode === 'Cash' ? 'bg-green-100' : 'bg-blue-100'
              }`}
          >
            <Text
              className={`text-xs font-semibold ${order.paymentMode === 'Cash'
                  ? 'text-green-800'
                  : 'text-blue-800'
                }`}
            >
              {order.paymentMode === 'Cash' ? 'Cash' : 'Credit'}
            </Text>
          </View>
        </View>
      </View>

      {order.phoneNumber && (
        <View
          className={`flex-row justify-between items-center pt-3 mt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
        >
          <View className="flex-row items-center">
            <Pressable onPress={() => Linking.openURL(`tel:${order.phoneNumber}`)}>
              <MaterialIcons
                name="phone"
                size={18}
                color={isDark ? '#9ca3af' : '#4b5563'}
              />
            </Pressable>
            <Text
              className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'
                }`}
            >
              {order.phoneNumber}
            </Text>
          </View>
          <Pressable
            onPress={() => Linking.openURL(`tel:${order.phoneNumber}`)}
            className={`flex-row items-center px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}
          >
            <MaterialIcons name="call" size={16} color="#fff" />
            <Text className="text-white font-medium ml-2">Call Now</Text>
          </Pressable>
        </View>
      )}

    </View>
  );

  if (isLoading) {
    return <Loader message="Loading orders..." />;
  }

  const filteredOrders = filterOrdersByDateRange(
    orders,
    dateRanges[selectedRange].start,
    dateRanges[selectedRange].end
  );

  return (
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
        <Text
          className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'
            }`}
        >
          Order History
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {Object.keys(dateRanges).map(rangeKey =>
            renderDateRangeButton(rangeKey)
          )}
        </ScrollView>

        <View className="mt-2">
          {filteredOrders.length === 0 ? (
            <View
              className={`p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'
                } items-center`}
            >
              <MaterialIcons
                name="receipt-long"
                size={48}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
              <Text
                className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
              >
                No orders found for this period
              </Text>
            </View>
          ) : (
            filteredOrders.map(renderOrderCard)
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default OrderHistory;
