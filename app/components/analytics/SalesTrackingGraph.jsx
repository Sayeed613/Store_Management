import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContextProvider';

const SalesTrackingGraph = ({ transactions = [] }) => {
  const scrollViewRef = useRef(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const screenWidth = Dimensions.get('window').width - 48;
  const chartWidth = Math.max(screenWidth, screenWidth * 1.5);

  // State for tooltip info
  const [tooltipPos, setTooltipPos] = useState({ visible: false, x: 0, y: 0, value: 0, label: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: isDark ? '#1f2937' : '#ffffff',
    backgroundGradientTo: isDark ? '#1f2937' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '3',
      stroke: isDark ? '#22c55e' : '#16a34a',
      // Add shadow for better visibility
      style: {
        shadowColor: isDark ? '#000' : '#888',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      }
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // Solid lines
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: '600',
    },
  };

  const processData = useMemo(() => {
    try {
      const last6Months = new Array(6).fill(0).map((_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index));
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          totalSales: 0,
          creditSales: 0,
          timestamp: date.getTime()
        };
      });

      transactions.forEach(transaction => {
        if (!transaction.orderDate) return;

        let transDate;
        try {
          if (transaction.orderDate?.toDate) {
            transDate = transaction.orderDate.toDate();
          } else if (transaction.orderDate?.seconds) {
            transDate = new Date(transaction.orderDate.seconds * 1000);
          } else {
            transDate = new Date(transaction.orderDate);
          }
          const monthYearKey = transDate.toLocaleString('default', { month: 'short' }) + transDate.getFullYear();
          const monthData = last6Months.find(m =>
            (m.month + m.year) === monthYearKey
          );

          if (monthData) {
            const amount = Number(transaction.amount) || 0;
            monthData.totalSales += amount;

            if (transaction.purchaseType === 'Credit') {
              monthData.creditSales += amount;
            }
          }
        } catch (error) {
          console.error('Transaction date processing error:', error, transaction);
        }
      });

      return {
        labels: last6Months.map(m => m.month),
        datasets: [
          {
            data: last6Months.map(m => m.totalSales),
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // green
            strokeWidth: 3,
            withShadow: true,
            withArea: true,
            gradientFrom: '#22c55e',
            gradientTo: '#a7f3d0',
          },
          {
            data: last6Months.map(m => m.creditSales),
            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // red
            strokeWidth: 3,
            withShadow: true,
            withArea: true,
            gradientFrom: '#ef4444',
            gradientTo: '#fecaca',
          }
        ],
        legend: ['Total Sales', 'Credit Sales']
      };
    } catch (error) {
      console.error('Data processing error:', error);
      return {
        labels: [],
        datasets: [{ data: [] }, { data: [] }],
        legend: ['Total Sales', 'Credit Sales']
      };
    }
  }, [transactions]);

  const totals = useMemo(() => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return transactions.reduce((acc, transaction) => {
        if (!transaction.orderDate) return acc;

        let transDate;
        try {
          if (transaction.orderDate?.toDate) {
            transDate = transaction.orderDate.toDate();
          } else if (transaction.orderDate?.seconds) {
            transDate = new Date(transaction.orderDate.seconds * 1000);
          } else {
            transDate = new Date(transaction.orderDate);
          }

          if (transDate.getMonth() === currentMonth &&
            transDate.getFullYear() === currentYear) {
            const amount = Number(transaction.amount) || 0;
            acc.monthTotal += amount;

            if (transaction.purchaseType === 'Credit') {
              acc.monthCredit += amount;
            }
          }
        } catch (error) {
          console.error('Transaction date processing error:', error);
        }
        return acc;
      }, { monthTotal: 0, monthCredit: 0 });

    } catch (error) {
      console.error('Totals calculation error:', error);
      return { monthTotal: 0, monthCredit: 0 };
    }
  }, [transactions]);

  return (
    <View className={`rounded-xl p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>


      <View className="flex-row justify-between mb-6">
        <View className="flex-1 mr-2 p-3 rounded-xl bg-green-100">
          <Text className="text-xs text-green-800">Monthly Sales</Text>
          <Text className="text-sm font-bold text-green-800">
            ₹{totals.monthTotal.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </Text>
        </View>
        <View className="flex-1 ml-2 p-3 rounded-xl bg-red-100">
          <Text className="text-xs text-red-800">Credit Sales</Text>
          <Text className="text-sm font-bold text-red-800">
            ₹{totals.monthCredit.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="h-[280px]"
      >
        <View>
          <LineChart
            data={processData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={true}
            withInnerLines={false}
            yAxisLabel="₹"
            yAxisInterval={1}
            // Add onDataPointClick for tooltips
            onDataPointClick={(data) => {
              setTooltipPos({
                visible: true,
                x: data.x,
                y: data.y,
                value: data.value,
                label: processData.labels[data.index],
              });
            }}
          />
          {/* Tooltip */}
          {tooltipPos.visible && (
            <View
              style={{
                position: 'absolute',
                left: tooltipPos.x - 30,
                top: tooltipPos.y - 40,
                backgroundColor: isDark ? '#111827' : '#f3f4f6',
                padding: 6,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? '#22c55e' : '#16a34a',
                zIndex: 10,
              }}
            >
              <Text style={{ color: isDark ? '#d1fae5' : '#065f46', fontWeight: '700' }}>
                {tooltipPos.label}
              </Text>
              <Text style={{ color: isDark ? '#d1fae5' : '#065f46' }}>
                ₹{tooltipPos.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Text className={`text-center text-sm mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
      </Text>
    </View>
  );
};

export default SalesTrackingGraph;