import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import Loader from "../components/common/Loader";
import Order from "../components/transactions/Order";
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const ITEMS_PER_PAGE = 12;

export default function Stores() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showAllOutlets, setShowAllOutlets] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    today: { orders: 0, total: 0, cash: 0, credit: 0 },
    currentMonth: {
      name: '',
      total: 0,
      cash: 0,
      credit: 0,
      orders: 0
    },
    monthlyData: []
  });

  const [outlets, setOutlets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [outletOrders, setOutletOrders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

const fetchAllData = async (showRefresh = false) => {
  if (showRefresh) {
    setIsRefreshing(true);
  } else {
    setIsLoading(true);
  }

  try {
    const outletsRef = collection(db, 'outlets');
    const ordersRef = collection(db, 'sales');

    const [outletsSnapshot, ordersSnapshot] = await Promise.all([
      getDocs(outletsRef),
      getDocs(ordersRef)
    ]);

    const outletList = outletsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Group orders by outlet
    const ordersByOutlet = {};
    ordersSnapshot.docs.forEach(doc => {
      const order = { id: doc.id, ...doc.data() };
      if (!ordersByOutlet[order.outletId]) {
        ordersByOutlet[order.outletId] = [];
      }
      ordersByOutlet[order.outletId].push(order);
    });

    // Process each outlet's orders
    const ordersMap = {};
    outletList.forEach(outlet => {
      const outletOrders = ordersByOutlet[outlet.id] || [];
      outletOrders.sort((a, b) => {
        const dateA = a.orderDate?.seconds || 0;
        const dateB = b.orderDate?.seconds || 0;
        return dateB - dateA;
      });

      // Calculate total pending amount from credit sales
      const pendingAmount = outletOrders.reduce((total, order) => {
        if (order.purchaseType === 'Credit' && order.status === 'Pending') {
          const totalPaid = order.totalPaid || 0;
          const remainingBalance = order.amount - totalPaid;
          return total + (remainingBalance > 0 ? remainingBalance : 0);
        }
        return total;
      }, 0);

      ordersMap[outlet.id] = {
        lastOrder: outletOrders[0] || null,
        pendingAmount,
        creditOrders: outletOrders.filter(order =>
          order.purchaseType === 'Credit' &&
          order.status === 'Pending'
        )
      };
    });

    setOutletOrders(ordersMap);
    setOutlets(outletList);
    setFilteredOutlets(outletList);
  } catch (error) {
    console.error('Failed to load data:', error);
  } finally {
    setIsLoading(false);
    setIsRefreshing(false);
  }
};

  useEffect(() => {
    fetchAllData();
    const refreshInterval = setInterval(() => fetchAllData(), 60000); // 1 minutes
    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOutlets(outlets);
      return;
    }

    const lowerSearchText = searchText.toLowerCase();
    const filtered = outlets.filter(outlet =>
      outlet.storeName?.toLowerCase().includes(lowerSearchText) ||
      outlet.phoneNumber?.includes(lowerSearchText) ||
      outlet.propName?.toLowerCase().includes(lowerSearchText)
    );

    setFilteredOutlets(filtered);
  }, [searchText, outlets]);

  const formatDate = (date) => {
    if (!date) return 'No orders yet';
    return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCloseOrder = () => setShowOrderModal(false);
  const handleOrderPress = () => setShowOrderModal(true);
  const handleOrderSaved = () => fetchAllData();

  const renderOutlet = ({ item }) => {
    const { storeName, propName, phoneNumber, route, fullAddress, id } = item;
    const orderInfo = outletOrders[id] || {};
    const lastOrder = orderInfo.lastOrder;
    const pendingAmount = orderInfo.pendingAmount || 0;
      const creditOrders = orderInfo.creditOrders || [];


    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/components/outlet/OutletDetails',
            params: {
              outletId: id,
              storeName,
              propName,
              phoneNumber,
              fullAddress: fullAddress || '',
              location: JSON.stringify(item.location),
              lastOrderDate: lastOrder?.orderDate?.toDate?.()
                ? lastOrder.orderDate.toDate().toISOString()
                : lastOrder?.orderDate?.seconds
                  ? new Date(lastOrder.orderDate.seconds * 1000).toISOString()
                  : '',
              lastOrderAmount: lastOrder?.amount || 0,
              pendingAmount,
                          creditOrders: JSON.stringify(creditOrders)

            }
          })
        }
      >
        <View
          className={`border rounded-xl p-4 mb-4 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
          }`}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Store : {storeName}
                </Text>
                <View className={`px-3 py-1 rounded-full ${
                  isDark ? 'bg-gray-700' : 'bg-blue-50'
                }`}>
                  <Text className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                    {route || 'N/A'}
                  </Text>
                </View>
              </View>

              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Name : {propName}
              </Text>

              <View className="flex-row justify-between items-center mt-2">
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  📞 {phoneNumber || 'No phone'}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Last: {lastOrder ? formatDate(lastOrder.orderDate) : 'Never'}
                </Text>
              </View>
            </View>
          </View>

            {pendingAmount > 0 && (
          <View className="mt-2 pt-2 border-t border-gray-200">
            <View className="flex-row justify-between items-center">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Pending Credit:
              </Text>
              <Text className={`text-sm font-medium ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                ₹{pendingAmount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            </View>
            <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {creditOrders.length} pending credit {creditOrders.length === 1 ? 'order' : 'orders'}
            </Text>
          </View>
        )}
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return <Loader message="Loading data..." />;
  }

  // Get displayed outlets based on show all state
  const displayedOutlets = showAllOutlets
    ? filteredOutlets
    : filteredOutlets.slice(0, ITEMS_PER_PAGE);

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Fixed Header */}
      <View className={`px-4 py-3 ${isDark ? 'bg-black' : 'bg-gray-100'} border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Stores
        </Text>

        <View className="flex flex-row items-center gap-4 mb-2">
          <TextInput
            placeholder="Search stores..."
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            value={searchText}
            onChangeText={setSearchText}
            className={`flex-1 border rounded-lg px-4 py-3 ${
              isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
            }`}
          />
          <Pressable
            onPress={handleOrderPress}
            className="flex-row items-center gap-2 bg-blue-600 rounded-lg px-4 py-3 active:bg-blue-700"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white">Add Sales</Text>
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        data={displayedOutlets}
        keyExtractor={item => item.id}
        renderItem={renderOutlet}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchAllData(true)}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
        ListEmptyComponent={
          <Text className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No stores found
          </Text>
        }
        ListFooterComponent={() =>
          filteredOutlets.length > ITEMS_PER_PAGE && !showAllOutlets ? (
            <Pressable
              onPress={() => setShowAllOutlets(true)}
              className={`mt-4 p-3 rounded-lg ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
            >
              <Text className={`text-center ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                Show More ({filteredOutlets.length - ITEMS_PER_PAGE} more)
              </Text>
            </Pressable>
          ) : null
        }
      />

      <Order
        visible={showOrderModal}
        onClose={handleCloseOrder}
        onOrderSaved={handleOrderSaved}
      />
    </View>
  );
}