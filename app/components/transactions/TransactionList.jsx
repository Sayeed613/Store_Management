import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PaymentModal from './PaymentModal';

const StatusBadge = ({ status, isDark }) => {
  const getStatusColor = () => {
    if (status === 'Completed') {
      return {
        bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
        text: isDark ? 'text-green-400' : 'text-green-700',
        icon: 'check-circle'
      };
    }
    return {
      bg: isDark ? 'bg-red-500/20' : 'bg-red-100',
      text: isDark ? 'text-red-400' : 'text-red-700',
      icon: 'error'
    };
  };

  const { bg, text, icon } = getStatusColor();

  return (
    <View className={`flex-row items-center px-2 py-1 rounded-full ${bg}`}>
      <MaterialIcons name={icon} size={12} className={text} />
      <Text className={`text-xs ml-1 font-medium ${text}`}>
        {status || 'Unknown'}
      </Text>
    </View>
  );
};

const FilterButton = ({ label, active, onPress, isDark }) => (
  <Pressable
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-2 ${
      active
        ? isDark ? 'bg-blue-600' : 'bg-blue-500'
        : isDark ? 'bg-gray-700' : 'bg-gray-100'
    }`}
  >
    <Text className={`${
      active ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'
    } font-medium`}>
      {label}
    </Text>
  </Pressable>
);

const TransactionItem = ({ transaction, isDark, onDelete, onAddPayment, index }) => {
  const totalPaid = transaction.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const remainingAmount = transaction.amount - totalPaid;
  const completed = remainingAmount <= 0;

  const borderClass = completed
    ? isDark ? 'border-l-4 border-green-400' : 'border-l-4 border-green-600'
    : isDark ? 'border-l-4 border-red-400' : 'border-l-4 border-red-600';

  const renderRightActions = () => (
    <Pressable
      onPress={() => Alert.alert(
        'Delete Transaction',
        'Are you sure you want to delete this transaction?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', onPress: () => onDelete?.(transaction.id), style: 'destructive' }
        ]
      )}
      className="bg-red-500 justify-center items-center w-16 rounded-md mb-2"
      android_ripple={{ color: '#b91c1c' }}
    >
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Swipeable renderRightActions={renderRightActions}>
        <Pressable onPress={() => onAddPayment(transaction)} className={`mb-2 mx-1 rounded-md p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} ${borderClass}`}>
          <View className="flex-row justify-between items-center mt-1 space-x-3">
            <StatusBadge status={completed ? 'Completed' : 'Pending'} isDark={isDark} />
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {transaction.salesType} • {transaction.purchaseType}
            </Text>
          </View>

          <View className="flex-row items-center mt-3 justify-between">
            <View className="flex-row gap-4 space-x-6">
              <View>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Total
                </Text>
                <Text className={`text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  ₹{transaction.amount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Balance
                </Text>
                <Text className={`text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  ₹{remainingAmount.toLocaleString('en-IN')}
                </Text>
              </View>

              <View>
                <Text className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Paid
                </Text>
                <Text className={`text-base font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  ₹{totalPaid.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {transaction.purchaseType === 'Credit' && (
              remainingAmount > 0 ? (
                <Pressable
                  onPress={() => onAddPayment(transaction)}
                  className={`px-3 py-1 rounded-md ${isDark ? 'bg-blue-600' : 'bg-blue-500'} active:opacity-80`}
                  android_ripple={{ color: isDark ? '#2563ebaa' : '#3b82f6aa' }}
                >
                  <Text className="text-white font-semibold text-sm">Add Payment</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => onAddPayment(transaction)}
                  className={`px-3 py-1 rounded-md ${isDark ? 'bg-green-600' : 'bg-green-500'} active:opacity-80`}
                  android_ripple={{ color: isDark ? '#16a34aaa' : '#22c55eaa' }}
                >
                  <Text className="text-white font-semibold text-sm">View Payments</Text>
                </Pressable>
              )
            )}
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
};



const TransactionList = ({ transactions = [], isDark, onDeleteTransaction, onTransactionUpdate }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [filter, setFilter] = useState('all');
  const INCREMENT = 5;

  const storeDetails = useMemo(() =>
    transactions[0] || null,
    [transactions]
  );

  const filterCounts = useMemo(() => ({
    all: transactions.length,
    credit: transactions.filter(t => t.purchaseType === 'Credit').length,
    cash: transactions.filter(t => t.purchaseType === 'Cash').length,
  }), [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t =>
      t.purchaseType?.toLowerCase() === filter.toLowerCase()
    );
  }, [transactions, filter]);

  const displayedTransactions = useMemo(() =>
    filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount]
  );

  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + INCREMENT, filteredTransactions.length));
  }, [filteredTransactions.length]);

  const handleShowLess = useCallback(() => {
    setVisibleCount(INCREMENT);
  }, []);

  const handleAddPayment = useCallback((transaction) => {
    setSelectedTransaction(transaction);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setSelectedTransaction(null);
  }, []);

  const handlePaymentAdded = useCallback((updatedTransaction) => {
    onTransactionUpdate?.(updatedTransaction);
    setSelectedTransaction(null);
  }, [onTransactionUpdate]);

  return (
    <>
      <ScrollView
        className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <View className="p-4">

          <View className="flex-row justify-between items-center mb-4">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transaction History
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {`Showing ${displayedTransactions.length} of ${filterCounts[filter]}`}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <FilterButton
              label={`All (${filterCounts.all})`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
              isDark={isDark}
            />
            <FilterButton
              label={`Credit (${filterCounts.credit})`}
              active={filter === 'credit'}
              onPress={() => setFilter('credit')}
              isDark={isDark}
            />
            <FilterButton
              label={`Cash (${filterCounts.cash})`}
              active={filter === 'cash'}
              onPress={() => setFilter('cash')}
              isDark={isDark}
            />
          </ScrollView>

          {displayedTransactions.length === 0 ? (
            <View className={`p-8 rounded-xl ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            } items-center`}>
              <MaterialIcons
                name="receipt-long"
                size={48}
                color={isDark ? '#4b5563' : '#9ca3af'}
              />
              <Text className={`mt-2 text-base ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No {filter !== 'all' ? filter : ''} transactions found
              </Text>
            </View>
          ) : (
            displayedTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isDark={isDark}
                onDelete={onDeleteTransaction}
                onAddPayment={handleAddPayment}
                index={index}
              />
            ))
          )}

          {visibleCount < filteredTransactions.length ? (
            <Pressable
              onPress={handleShowMore}
              className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Text className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Show More
              </Text>
            </Pressable>
          ) : visibleCount > INCREMENT && filteredTransactions.length > INCREMENT && (
            <Pressable
              onPress={handleShowLess}
              className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
            >
              <Text className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Show Less
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <PaymentModal
        visible={!!selectedTransaction}
        onClose={handleClosePaymentModal}
        order={selectedTransaction}
        onPaymentAdded={handlePaymentAdded}
      />
    </>
  );
};

export default TransactionList;