import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
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

      const ordersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          orderDate: data.orderDate?.toDate?.() || new Date(data.orderDate?.seconds * 1000),
          phoneNumber: outletPhones[data.outletId] || null,
          payments: data.payments || [],
          totalPaid: data.totalPaid || 0,
          remainingBalance: data.remainingBalance || (data.amount - (data.totalPaid || 0))
        };
      });
            setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(() => {
    fetchOrders(true);
  }, []);

  useEffect(() => {
    fetchOrders();
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
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 pr-2">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {order.storeName}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatDate(order.orderDate)}
            </Text>
          </View>

          <View className="items-end">
            <Text className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              ₹{order.amount.toFixed(2)}
            </Text>
            <View className={`px-3 py-1 rounded-full mt-1 ${
              order.status === 'Completed' ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <Text className={`text-xs font-semibold ${
                order.status === 'Completed' ? 'text-green-800' : 'text-yellow-800'
              }`}>
                {order.status}
              </Text>
            </View>
          </View>
        </View>
         <View className={`pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row justify-between items-center">
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Total Paid
            </Text>
            <Text className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              ₹{totalPaid.toFixed(2)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mt-1">
            <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Balance
            </Text>
            <Text className={`font-semibold ${
              remainingBalance > 0
                ? isDark ? 'text-red-400' : 'text-red-600'
                : isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              ₹{remainingBalance.toFixed(2)}
            </Text>
          </View>
        </View>
                {order.phoneNumber && (
          <View className={`flex-row justify-between items-center pt-3 mt-3 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <View className="flex-row items-center">
              <MaterialIcons
                name="phone"
                size={18}
                color={isDark ? '#9ca3af' : '#4b5563'}
              />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {order.phoneNumber}
              </Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(`tel:${order.phoneNumber}`)}
              className={`flex-row items-center px-4 py-2 rounded-lg ${
                isDark ? 'bg-blue-600' : 'bg-blue-500'
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
        <Text className={`text-2xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Order History
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {Object.keys(dateRanges).map(renderDateRangeButton)}
        </ScrollView>
 <View className="mt-2">
          {filteredOrders.length === 0 ? (
            <View className={`p-8 rounded-xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            } items-center`}>
              <MaterialIcons
                name="receipt-long"
                size={48}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
              <Text className={`mt-2 text-base ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
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