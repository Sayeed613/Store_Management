import { Entypo, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import Loader from "../components/common/Loader";
import Order from "../components/transactions/Order";
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const ITEMS_PER_PAGE = 12;

const formatDate = (date) => {
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
};

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
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const buttonTranslateY = useRef(new Animated.Value(0)).current;

  // Debounce scroll check for smoother animation
  const handleScroll = (event) => {
    const currentY = event.nativeEvent.contentOffset.y;

    if (currentY > lastScrollY.current + 10) {
      // Scrolling down -> hide
      Animated.timing(buttonTranslateY, {
        toValue: 140,
        useNativeDriver: true,
      }).start();
    } else if (currentY < lastScrollY.current - 10) {
      // Scrolling up -> show
      Animated.timing(buttonTranslateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentY;
  };;

  useEffect(() => {
    setIsLoading(true);
    let unsubscribeOutlets;
    let unsubscribeOrders = {};

    const setupOutletListener = () => {
      const q = query(
        collection(db, 'outlets'),
        orderBy('storeName'),
        limit(ITEMS_PER_PAGE)
      );

      unsubscribeOutlets = onSnapshot(q, async (snapshot) => {
        const outletList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const activeOutlets = outletList.filter(o => o.status === 'active');

        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
        setOutlets(activeOutlets);
        setFilteredOutlets(activeOutlets);

        const activeOutletIds = activeOutlets.map(o => o.id);
        const chunks = [];
        for (let i = 0; i < activeOutletIds.length; i += 10) {
          chunks.push(activeOutletIds.slice(i, i + 10));
        }

        Object.values(unsubscribeOrders).forEach(unsub => unsub());
        unsubscribeOrders = {};

        chunks.forEach(chunk => {
          const ordersQuery = query(
            collection(db, 'sales'),
            where('outletId', 'in', chunk),
            orderBy('orderDate', 'desc')
          );

          unsubscribeOrders[chunk.join()] = onSnapshot(ordersQuery, (ordersSnapshot) => {
            const newOrdersMap = {};

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

              if (
                !newOrdersMap[outletId].lastOrder ||
                (order.orderDate?.seconds > newOrdersMap[outletId].lastOrder.orderDate?.seconds)
              ) {
                newOrdersMap[outletId].lastOrder = order;
              }

              if (order.purchaseType === 'Credit' && order.status === 'Pending') {
                const remainingBalance = order.amount - (order.totalPaid || 0);
                if (remainingBalance > 0) {
                  newOrdersMap[outletId].pendingAmount += remainingBalance;
                  newOrdersMap[outletId].creditOrders.push(order);
                }
              }
            });

            setOutletOrders(prev => ({ ...prev, ...newOrdersMap }));
          });
        });

        setIsLoading(false);
      }, (error) => {
        console.error('Real-time data error:', error);
        setIsLoading(false);
      });
    };

    setupOutletListener();

    return () => {
      if (unsubscribeOutlets) unsubscribeOutlets();
      Object.values(unsubscribeOrders).forEach(unsub => unsub());
    };
  }, []);

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

  const isNewStore = (createdAt) => {
    if (!createdAt) return false;
    const storeDate = createdAt?.toDate?.() || new Date(createdAt?.seconds * 1000);
    const diffTime = Math.abs(new Date() - storeDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const renderOutlet = useCallback(({ item }) => {
    const {
      storeName,
      propName,
      phoneNumber,
      route,
      fullAddress,
      id,
      creditLimit,
      status,
      createdAt
    } = item;

    const orderInfo = outletOrders[id] || {};
    const lastOrder = orderInfo.lastOrder;
    const pendingAmount = orderInfo.pendingAmount || 0;
    const creditOrders = orderInfo.creditOrders || [];

    const lastOrderAmount = lastOrder?.amount || 0;
    const lastOrderDate = lastOrder?.orderDate;
    const showNewBadge = !lastOrder && isNewStore(createdAt);

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
            lastOrderDate: lastOrderDate?.seconds
              ? new Date(lastOrderDate.seconds * 1000).toISOString()
              : '',
            lastOrderAmount,
            pendingAmount,
            creditLimit,
            creditOrders: JSON.stringify(creditOrders),
            status
          }
        })}
      >
        <View className={`border rounded-xl p-4 mb-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
          <View className="flex-row justify-between items-center mb-2">
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{storeName}</Text>
            <View className="flex-row items-center space-x-1">
              <Entypo name="location-pin" size={16} color="#3B82F6" />
              <Text className="text-sm text-blue-600">{route || 'N/A'}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between mb-2">
            <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Owner: {propName}</Text>
            {showNewBadge && (
              <View className="ml-2 px-2 py-1 bg-green-500 rounded-full">
                <Text className="text-white text-xs font-medium">New Store</Text>
              </View>
            )}
          </View>

          <View className="flex-row justify-between border-t border-b py-2 border-gray-200">
            <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Credit Limit: ₹{creditLimit?.toLocaleString('en-IN')}</Text>
            <Text className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'}`}>Pending: ₹{pendingAmount.toLocaleString('en-IN')}</Text>
          </View>

          <View className="flex-row gap-2 items-center mt-2">
            <FontAwesome5 name="clock" size={14} color="#6B7280" />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Last Order: ₹{lastOrderAmount.toLocaleString('en-IN')} on {formatDate(lastOrderDate)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }, [outletOrders, isDark, router]);

  if (isLoading) {
    return <Loader message="Loading active stores..." />;
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
      <View className={`px-4 py-3 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Stores</Text>
        <TextInput
          placeholder="Search stores..."
          placeholderTextColor={isDark ? '#888' : '#999'}
          value={searchText}
          onChangeText={handleSearch}
          className={`border rounded-xl px-4 py-3 ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
        />
      </View>

      <FlatList
        data={filteredOutlets}
        keyExtractor={item => item.id}
        renderItem={renderOutlet}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No active stores found
            </Text>
          </View>
        }
      />

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: [
            { translateX: -56 },
            { translateY: buttonTranslateY }
          ],
          zIndex: 10
        }}
      >
        <Pressable
          onPress={() => setShowOrderModal(true)}
          className="w-32 h-12 flex-row items-center justify-center rounded-full bg-blue-600 shadow-lg active:bg-blue-700"
        >
          <Ionicons name="add" size={24} color="white" />
          <Text className="text-white font-medium ml-1">Add Sale</Text>
        </Pressable>
      </Animated.View>

      <Order
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onOrderSaved={() => setShowOrderModal(false)}
      />
    </View>
  );
}
