import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../context/ThemeContextProvider';

const SalesTrackingGraph = ({ transactions = [] }) => {
  const scrollViewRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const screenWidth = Dimensions.get('window').width - 48;

  const [tooltipIndex, setTooltipIndex] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Processing transactions into chart-friendly format
  const { lineData1, lineData2, labels } = useMemo(() => {
    const months = new Array(6).fill(0).map((_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        label: d.toLocaleString('default', { month: 'short' }),
        timestamp: d.getTime(),
        totalSales: 0,
        creditSales: 0,
      };
    });

    transactions.forEach(transaction => {
      if (!transaction.orderDate) return;
      let date;
      try {
        if (transaction.orderDate?.toDate) {
          date = transaction.orderDate.toDate();
        } else if (transaction.orderDate?.seconds) {
          date = new Date(transaction.orderDate.seconds * 1000);
        } else {
          date = new Date(transaction.orderDate);
        }

        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const entry = months.find(m => m.label === month);
        if (entry) {
          const amount = Number(transaction.amount) || 0;
          entry.totalSales += amount;
          if (transaction.purchaseType === 'Credit') {
            entry.creditSales += amount;
          }
        }
      } catch (err) {
        console.warn('Date parse error:', err);
      }
    });

    const lineData1 = months.map((m, i) => ({
      value: m.totalSales,
      label: m.label.toUpperCase(),
      labelTextStyle: { color: isDark ? '#fff' : '#000' },
      frontColor: 'rgba(37, 99, 235, 1)', // blue
      color: 'rgba(147, 197, 253, 0.5)',
    }));

    const lineData2 = months.map((m, i) => ({
      value: m.creditSales,
      frontColor: 'rgba(239, 68, 68, 1)', // red
      color: 'rgba(252, 165, 165, 0.5)',
    }));

    return { lineData1, lineData2, labels: months.map(m => m.label) };
  }, [transactions]);

  const totals = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return transactions.reduce((acc, t) => {
      let date;
      try {
        if (t.orderDate?.toDate) date = t.orderDate.toDate();
        else if (t.orderDate?.seconds) date = new Date(t.orderDate.seconds * 1000);
        else date = new Date(t.orderDate);

        if (date.getMonth() === thisMonth && date.getFullYear() === thisYear) {
          const amt = Number(t.amount) || 0;
          acc.total += amt;
          if (t.purchaseType === 'Credit') acc.credit += amt;
        }
      } catch {}
      return acc;
    }, { total: 0, credit: 0 });
  }, [transactions]);

  return (
    <View className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-row justify-between items-center mb-6">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Monthly Sales Overview
        </Text>
        <MaterialCommunityIcons name="chart-line" size={22} color={isDark ? '#fff' : '#000'} />
      </View>

      <View className="flex-row justify-between mb-6">
        <View className="flex-1 mr-2 p-3 rounded-xl bg-green-100">
          <Text className="text-xs text-green-800">Monthly Sales</Text>
          <Text className="text-sm font-bold text-green-800">
            ₹{totals.total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View className="flex-1 ml-2 p-3 rounded-xl bg-red-100">
          <Text className="text-xs text-red-800">Credit Sales</Text>
          <Text className="text-sm font-bold text-red-800">
            ₹{totals.credit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} horizontal showsHorizontalScrollIndicator={false} className="h-[280px]">
        <View style={{ paddingRight: 32 }}>
          <LineChart
            areaChart
            curved
            data={lineData1}
            data2={lineData2}
            thickness={3}
            startFillColor1="rgba(37,99,235,0.6)" // Blue
            endFillColor1="rgba(147,197,253,0.1)"
            startFillColor2="rgba(239,68,68,0.6)" // Red
            endFillColor2="rgba(252,165,165,0.1)"
            yAxisTextStyle={{ color: isDark ? '#ccc' : '#444' }}
            xAxisLabelTextStyle={{ color: isDark ? '#ccc' : '#444' }}
            color1="rgba(37,99,235,1)"
            color2="rgba(239,68,68,1)"
            noOfSections={5}
            animateOnDataChange
            animationDuration={800}
            onPointClick={(item, index) => setTooltipIndex(index)}
            showVerticalLines
            rulesColor={isDark ? '#333' : '#e5e7eb'}
            xAxisColor={isDark ? '#333' : '#e5e7eb'}
            yAxisColor={isDark ? '#333' : '#e5e7eb'}
          />
        </View>
      </ScrollView>

      {/* Legend */}
      <View className="flex-row justify-center items-center mt-4 space-x-6">
        <View className="flex-row items-center space-x-2">
          <View className="w-3 h-3 rounded-full bg-blue-600" />
          <Text className="text-sm text-gray-700 dark:text-gray-300">Point 01</Text>
        </View>
        <View className="flex-row items-center space-x-2">
          <View className="w-3 h-3 rounded-full bg-red-500" />
          <Text className="text-sm text-gray-700 dark:text-gray-300">Point 02</Text>
        </View>
      </View>

      <Text className={`text-center text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
      </Text>
    </View>
  );
};

export default SalesTrackingGraph;
