import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../context/ThemeContextProvider';

const SalesTrackingGraph = ({ transactions = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    backgroundGradientFrom: isDark ? '#1f2937' : '#ffffff',
    backgroundGradientTo: isDark ? '#1f2937' : '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: isDark ? '#fff' : '#000'
    }
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
          creditPending: 0,
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
              const pendingAmount = transaction.remainingBalance ??
                (amount - (transaction.totalPaid || 0));
              monthData.creditPending += pendingAmount;
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
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            strokeWidth: 2
          },
          {
            data: last6Months.map(m => m.creditPending), // Show pending credit
            color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
            strokeWidth: 2
          }
        ],
        legend: ['Total Sales', 'Pending Credit'] // Updated legend
      };
    } catch (error) {
      console.error('Data processing error:', error);
      return defaultData;
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
        // Parse the transaction date
        if (transaction.orderDate?.toDate) {
          transDate = transaction.orderDate.toDate();
        } else if (transaction.orderDate?.seconds) {
          transDate = new Date(transaction.orderDate.seconds * 1000);
        } else {
          transDate = new Date(transaction.orderDate);
        }

        // Check if transaction is from current month
        if (transDate.getMonth() === currentMonth &&
            transDate.getFullYear() === currentYear) {
          const amount = Number(transaction.amount) || 0;
          acc.monthTotal += amount;

          // Calculate credit amount
          if (transaction.purchaseType === 'Credit') {
            const pendingAmount = transaction.remainingBalance ??
              (amount - (Number(transaction.totalPaid) || 0));
            acc.monthCredit += pendingAmount;
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
    <ScrollView className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
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
            ₹{totals.monthTotal.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2  })}
          </Text>
        </View>
        <View className="flex-1 ml-2 p-3 rounded-xl bg-red-100">
          <Text className="text-xs text-red-800">Credit Sales</Text>
          <Text className="text-sm font-bold text-red-800">
            ₹{totals.monthCredit.toLocaleString('en-IN', { maximumFractionDigits: 2,  minimumFractionDigits: 2  })}
          </Text>
        </View>
      </View>

      <View className="mb-4">
        <LineChart
          data={processData}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          fromZero
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
          yAxisLabel="₹"
          yAxisSuffix=""
        />
      </View>

      <Text className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
      </Text>
    </ScrollView>
  );
};

export default SalesTrackingGraph;