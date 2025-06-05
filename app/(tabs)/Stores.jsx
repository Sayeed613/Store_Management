import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View
} from 'react-native';
import Loader from "../components/common/Loader";
import Order from "../components/transactions/Order";
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const ITEMS_PER_PAGE = 12;

export default function Stores() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [outlets, setOutlets] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [outletOrders, setOutletOrders] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchOutlets = async (isLoadMore = false) => {
    try {
      let q = query(
        collection(db, 'outlets'),
        orderBy('storeName'),
        limit(ITEMS_PER_PAGE)
      );

      if (isLoadMore && lastVisible) {
        q = query(
          collection(db, 'outlets'),
          orderBy('storeName'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(q);
      const outletList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

      const outletIds = outletList.map(o => o.id);
      const newOrdersMap = {};

      if (outletIds.length > 0) {
        const chunks = [];
        for (let i = 0; i < outletIds.length; i += 10) {
          chunks.push(outletIds.slice(i, i + 10));
        }

        await Promise.all(chunks.map(async (chunk) => {
          // Modified query to fetch all orders
          const ordersQuery = query(
            collection(db, 'sales'),
            where('outletId', 'in', chunk),
            orderBy('orderDate', 'desc')
          );

          const ordersSnapshot = await getDocs(ordersQuery);

          ordersSnapshot.docs.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };
            const outletId = order.outletId;

            if (!newOrdersMap[outletId]) {
              newOrdersMap[outletId] = {
                lastOrder: null,
                pendingAmount: 0,
                creditOrders: []
              };
            }

            // Update last order
            if (!newOrdersMap[outletId].lastOrder ||
                (order.orderDate?.seconds > newOrdersMap[outletId].lastOrder.orderDate?.seconds)) {
              newOrdersMap[outletId].lastOrder = order;
            }

            // Track pending credit orders
            if (order.purchaseType === 'Credit' && order.status === 'Pending') {
              const remainingBalance = order.amount - (order.totalPaid || 0);
              if (remainingBalance > 0) {
                newOrdersMap[outletId].pendingAmount += remainingBalance;
                newOrdersMap[outletId].creditOrders.push(order);
              }
            }
          });
        }));
      }

      if (isLoadMore) {
        setOutlets(prev => [...prev, ...outletList]);
        setFilteredOutlets(prev => [...prev, ...outletList]);
        setOutletOrders(prev => ({ ...prev, ...newOrdersMap }));
      } else {
        setOutlets(outletList);
        setFilteredOutlets(outletList);
        setOutletOrders(newOrdersMap);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setLastVisible(null);
    await fetchOutlets();
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchOutlets(true);
  }, [hasMore, isLoading, lastVisible]);

  const handleSearch = useCallback((text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredOutlets(outlets);
      return;
    }

    const lowerText = text.toLowerCase();
    const filtered = outlets.filter(outlet =>
      outlet.storeName?.toLowerCase().includes(lowerText) ||
      outlet.phoneNumber?.includes(text) ||
      outlet.propName?.toLowerCase().includes(lowerText)
    );
    setFilteredOutlets(filtered);
  }, [outlets]);

  const formatDate = useCallback((date) => {
    if (!date) return 'No orders yet';
    try {
      let timestamp;
      if (date?.toDate) {
        timestamp = date.toDate();
      } else if (date?.seconds) {
        timestamp = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        timestamp = date;
      } else {
        return 'Invalid date';
      }

      return timestamp.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date error';
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const renderOutlet = useCallback(({ item }) => {
    const { storeName, propName, phoneNumber, route, fullAddress, id } = item;
    const orderInfo = outletOrders[id] || {};
    const lastOrder = orderInfo.lastOrder;
    const pendingAmount = orderInfo.pendingAmount || 0;
    const creditOrders = orderInfo.creditOrders || [];

    return (
      <Pressable
        onPress={() => router.push({
          pathname: "/outlet/[id]",
          params: {
            id,
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
        })}
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

        {pendingAmount > 0 && (
          <View className="mt-2  ">
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

          </View>
        )}
              <View className="flex-row justify-between border-t border-gray-200 items-center mt-2">
                <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {creditOrders.length} pending credit {creditOrders.length === 1 ? 'order' : 'orders'}
            </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Last: {lastOrder ? formatDate(lastOrder.orderDate) : 'Never'}
                </Text>
              </View>
            </View>
          </View>


        </View>
      </Pressable>
    );
  }, [outletOrders, isDark, router]);

  if (isLoading) {
    return <Loader message="Loading stores..." />;
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <View className={`px-4 py-3 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <Text className={`text-2xl font-bold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Stores
        </Text>

        <TextInput
          placeholder="Search stores..."
          placeholderTextColor={isDark ? '#888' : '#999'}
          value={searchText}
          onChangeText={handleSearch}
          className={`border rounded-xl px-4 py-3 ${
            isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
      </View>

      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        data={filteredOutlets}
        keyExtractor={item => item.id}
        renderItem={renderOutlet}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? '#ffffff' : '#000000'}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className={`text-base ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No stores found
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setShowOrderModal(true)}
        className="absolute bottom-8 left-1/2 -ml-12 w-32 h-12 flex-row items-center justify-center rounded-full bg-blue-600 shadow-lg active:bg-blue-700"
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
        onOrderSaved={() => {
          setShowOrderModal(false);
          handleRefresh();
        }}
      />
    </View>
  );
}