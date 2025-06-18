import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 32) / 2;

const StatCard = ({ title, value, count, icon, color, isDark }) => (
  <View
    className={`mb-4 p-4 rounded-2xl ${isDark ? 'bg-black' : 'bg-white'}`}
    style={{
      width: CARD_WIDTH - 8,
      shadowColor: isDark ? '#000' : '#475569',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3
    }}
  >
    <View className={`flex-row justify-between items-center mb-2 `}>
      <View className={`p-2 rounded-lg bg-opacity-20`} style={{ backgroundColor: `${color}20` }}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
    </View>
    <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      ₹{(value || 0).toLocaleString('en-IN')}
    </Text>
    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
      {title}
    </Text>
    {count !== undefined && (
      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {count} orders
      </Text>
    )}
  </View>
);

const AnalyticsOverview = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const salesQuery = query(
        collection(db, 'sales'),
        where('orderDate', '>=', startOfMonth)
      );

      const querySnapshot = await getDocs(salesQuery);
      const sales = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const monthlyData = sales.reduce((acc, sale) => {
        const amount = Number(sale.amount) || 0;
        const totalPaid = sale.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

        return {
          totalAmount: acc.totalAmount + amount,
          cashAmount: acc.cashAmount + (sale.purchaseType === 'Cash' ? amount : 0),
          creditAmount: acc.creditAmount + (sale.purchaseType === 'Credit' ? amount : 0),
          orderCount: acc.orderCount + 1,
          pendingAmount: acc.pendingAmount + (amount - totalPaid),
        };
      }, {
        totalAmount: 0,
        cashAmount: 0,
        creditAmount: 0,
        orderCount: 0,
        pendingAmount: 0,
      });

      setAnalyticsData(monthlyData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text className="text-center mt-10">Loading analytics...</Text>;
  }

  return (
    <SafeAreaView className={`flex-1  ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <ScrollView className="px-2 -mt-10" showsVerticalScrollIndicator={false}>
        <View className="py-2">
          <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Analytics
          </Text>
          <Text className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Monthly performance overview
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <StatCard
              title="Cash Sales"
              value={analyticsData?.cashAmount}
              icon="cash"
              color="#22c55e"
              isDark={isDark}
            />
            <StatCard
              title="Credit Sales"
              value={analyticsData?.creditAmount}
              icon="credit-card"
              color="#3b82f6"
              isDark={isDark}
            />
            <StatCard
              title="Monthly Sales"
              value={analyticsData?.totalAmount}
              count={analyticsData?.orderCount}
              icon="chart-timeline-variant"
              color="#8b5cf6"
              isDark={isDark}
            />
            <StatCard
              title="Pending Amount"
              value={analyticsData?.pendingAmount}
              icon="clock-outline"
              color="#f59e0b"
              isDark={isDark}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsOverview;
