import { View, Text, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContextProvider';

const StatCard = ({ title, value, count, icon, color }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View
      className={`mr-4 p-4 rounded-xl ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
      style={{ minWidth: 200 }}
    >
      <View className="flex-row justify-between items-center mb-2">
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text
        className={`text-2xl font-bold mb-1 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}
      >
        ₹{(value || 0).toLocaleString('en-IN')}
      </Text>
      <Text
        className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        {title}
      </Text>
      {count !== undefined && (
        <Text
          className={`text-xs mt-1 ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}
        >
          {count} orders
        </Text>
      )}
    </View>
  );
};

const AnalyticsOverview = ({ data }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const currentMonth = data?.monthlyData?.[0] || {
    month: '',
    cashAmount: 0,
    creditAmount: 0,
    totalAmount: 0,
    orderCount: 0,
    allTimeTotal: 0
  };

  return (
    <View className="mb-6">
      <Text className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {currentMonth.month} Overview
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-4"
      >
        <StatCard
          title="Cash Sales"
          value={currentMonth.cashAmount}
          icon="cash"
          color="#22c55e"
        />
        <StatCard
          title="Credit Sales"
          value={currentMonth.creditAmount}
          icon="credit-card"
          color="#3b82f6"
        />
        <StatCard
          title="Monthly Sales"
          value={currentMonth.totalAmount}
          count={currentMonth.orderCount}
          icon="chart-timeline-variant"
          color="#8b5cf6"
        />
        <StatCard
          title="Total Sales"
          value={currentMonth.allTimeTotal}
          icon="chart-bar"
          color="#f59e0b"
        />
      </ScrollView>
    </View>
  );
};

export default AnalyticsOverview;