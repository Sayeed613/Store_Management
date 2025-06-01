import { Dimensions, Text, View } from 'react-native';
import { VictoryAxis, VictoryChart, VictoryGroup, VictoryLegend, VictoryLine } from 'victory-native';
import { useTheme } from '../../context/ThemeContextProvider';

const SalesTrackingGraph = ({ transactions }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Colors for the graph
  const COLORS = {
    cash: '#22c55e', // Green for cash
    credit: '#ef4444', // Red for credit
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#fff' : '#000'
  };

  const processData = () => {
    const last6Months = new Array(6).fill(0).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        sales: 0,
        credit: 0,
        timestamp: date.getTime()
      };
    });

    const monthlyData = {};
    last6Months.forEach(month => {
      monthlyData[month.month] = { sales: 0, credit: 0 };
    });

    transactions.forEach(transaction => {
      if (!transaction.orderDate) return;

      const transDate = new Date(transaction.orderDate);
      const month = transDate.toLocaleString('default', { month: 'short' });

      if (monthlyData[month]) {
        const amount = Number(transaction.amount) || 0;
        if (transaction.salesType === 'Cash') {
          monthlyData[month].sales += amount;
        } else {
          monthlyData[month].credit += amount;
        }
      }
    });

    return last6Months.map(month => ({
      month: month.month,
      ...monthlyData[month.month]
    }));
  };

  const chartData = processData();

  return (
    <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Sales & Credit Overview
      </Text>

      <View style={{ height: 300 }}>
        <VictoryChart
          domainPadding={20}
          padding={{ top: 40, bottom: 50, left: 60, right: 40 }}
          width={Dimensions.get('window').width - 48}
        >
          <VictoryAxis
            tickFormat={(t) => t}
            style={{
              axis: { stroke: COLORS.text },
              tickLabels: {
                fill: COLORS.text,
                fontSize: 10,
                angle: -45
              },
              grid: { stroke: 'transparent' }
            }}
          />
          <VictoryAxis
            dependentAxis
            tickFormat={(t) => `₹${t/1000}K`}
            style={{
              axis: { stroke: COLORS.text },
              tickLabels: {
                fill: COLORS.text,
                fontSize: 10
              },
              grid: { stroke: COLORS.grid }
            }}
          />

          <VictoryGroup>
            <VictoryLine
              data={chartData}
              x="month"
              y="sales"
              style={{
                data: {
                  stroke: COLORS.cash,
                  strokeWidth: 2
                }
              }}
            />
            <VictoryLine
              data={chartData}
              x="month"
              y="credit"
              style={{
                data: {
                  stroke: COLORS.credit,
                  strokeWidth: 2
                }
              }}
            />
          </VictoryGroup>

          <VictoryLegend
            x={Dimensions.get('window').width / 2 - 120}
            y={10}
            orientation="horizontal"
            gutter={20}
            style={{
              labels: { fill: COLORS.text }
            }}
            data={[
              { name: 'Cash Sales', symbol: { fill: COLORS.cash } },
              { name: 'Credit', symbol: { fill: COLORS.credit } }
            ]}
          />
        </VictoryChart>
      </View>
    </View>
  );
};

export default SalesTrackingGraph;