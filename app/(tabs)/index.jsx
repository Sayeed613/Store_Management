import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import AnalyticsOverview from '../components/analytics/AnalyticsOverview';
import Loader from "../components/common/Loader";
import Order from "../components/transactions/Order";
import { useTheme } from '../context/ThemeContextProvider';
import { fetchAnalytics } from '../services/firebase/analytics';
import { db } from '../services/firebase/config';

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
      const analytics = await fetchAnalytics();
      setAnalyticsData(analytics.analytics);

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

      const ordersByOutlet = {};
      ordersSnapshot.docs.forEach(doc => {
        const order = { id: doc.id, ...doc.data() };
        if (!ordersByOutlet[order.outletId]) {
          ordersByOutlet[order.outletId] = [];
        }
        ordersByOutlet[order.outletId].push(order);
      });

      const ordersMap = {};
      outletList.forEach(outlet => {
        const outletOrders = ordersByOutlet[outlet.id] || [];
        outletOrders.sort((a, b) => {
          const dateA = a.orderDate?.seconds || 0;
          const dateB = b.orderDate?.seconds || 0;
          return dateB - dateA;
        });

        ordersMap[outlet.id] = {
          lastOrder: outletOrders[0] || null,
          pendingAmount: outletOrders
            .filter(order => order.status === 'Pending')
            .reduce((total, order) => total + (Number(order.amount) || 0), 0)
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
    const refreshInterval = setInterval(() => fetchAllData(), 300000); // 5 minutes
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
    const { storeName, propName, phoneNumber, fullAddress, id } = item;
    const orderInfo = outletOrders[id] || {};
    const lastOrder = orderInfo.lastOrder;
    const pendingAmount = orderInfo.pendingAmount || 0;

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
              pendingAmount
            }
          })
        }
        className={`border rounded-lg p-4 mb-4 shadow-sm ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}
      >
        <View className="flex-row justify-between items-start">
          <Text className={`text-lg font-bold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {storeName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {lastOrder ? formatDate(lastOrder.orderDate) : 'No orders'}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {propName}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ₹{lastOrder?.amount || 0}
          </Text>
        </View>

        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {phoneNumber}
        </Text>
      </Pressable>
    );
  };

  if (isLoading) {
    return <Loader message="Loading data..." />;
  }

  return (
    <ScrollView
      className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => fetchAllData(true)}
          tintColor={isDark ? '#ffffff' : '#000000'}
        />
      }
    >
      <View className="p-4">
        <AnalyticsOverview data={analyticsData} />

        <Text className={`text-2xl font-bold my-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Stores
        </Text>

        <View className="flex flex-row items-center gap-4 mb-4">
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
            className="bg-blue-600 rounded-lg px-4 py-2 active:bg-blue-700"
          >
            <Text className="text-white text-lg">New Order</Text>
          </Pressable>
        </View>

        <FlatList
          data={filteredOutlets}
          keyExtractor={item => item.id}
          renderItem={renderOutlet}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text className={`text-center mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No stores found
            </Text>
          }
        />
      </View>

      <Order visible={showOrderModal} onClose={handleCloseOrder} onOrderSaved={handleOrderSaved} />
    </ScrollView>
  );
}