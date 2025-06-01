import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatCurrency } from '../../utils/currencyAndTime';
import PaymentModal from "./PaymentModal";

const StatusBadge = ({ status, isDark }) => {
  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          bg: isDark ? 'bg-green-500/20' : 'bg-green-100',
          text: isDark ? 'text-green-400' : 'text-green-700',
          icon: 'check-circle'
        };
      case 'pending':
        return {
          bg: isDark ? 'bg-yellow-500/20' : 'bg-yellow-100',
          text: isDark ? 'text-yellow-400' : 'text-yellow-700',
          icon: 'pending'
        };
      default:
        return {
          bg: isDark ? 'bg-gray-500/20' : 'bg-gray-100',
          text: isDark ? 'text-gray-400' : 'text-gray-700',
          icon: 'help'
        };
    }
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

const DateDivider = ({ date, isDark }) => (
  <View className="py-3 px-4">
    <View className="flex-row items-center">
      <View className={`flex-1 h-[1px] ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`} />
      <Text className={`mx-4 text-xs font-medium ${
        isDark ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {new Date(date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </Text>
      <View className={`flex-1 h-[1px] ${isDark ? 'bg-gray-700/50' : 'bg-gray-200'}`} />
    </View>
  </View>
);



const TransactionItem = ({ transaction, isDark, onDelete, onPressPayment, index }) => {
    const renderRightActions = () => (
    <Pressable
      onPress={() => {
        Alert.alert(
          'Delete Transaction',
          'Are you sure you want to delete this transaction?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              onPress: () => onDelete?.(transaction.id),
              style: 'destructive'
            }
          ]
        );
      }}
      className="bg-red-500 justify-center items-center w-16"
    >
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );

  const totalPaid = transaction.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const remainingAmount = transaction.amount - totalPaid;
  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <Swipeable renderRightActions={renderRightActions}>
        <Pressable
        onPress={() => onPressPayment(transaction)}
        className={`p-4  ${isDark ? 'bg-gray-800' : 'bg-white'} active:opacity-70`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row gap-2 items-center">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                <MaterialIcons
                  name={transaction.purchaseType === 'Cash' ? 'payments' : 'account-balance'}
                  size={20}
                  color={isDark ? '#9ca3af' : '#4b5563'}
                />
              </View>
              <View>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(transaction.amount)}
                </Text>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {new Date(transaction.orderDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </View>
          <View className="items-end space-y-1">
            <StatusBadge
              status={remainingAmount > 0 ? 'pending' : 'completed'}
              isDark={isDark}
            />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {transaction.salesType} • {transaction.purchaseType}
            </Text>
          </View>
        </View>

        {transaction.purchaseType === 'Credit' && (
          <>
            <View className="mt-3 pl-12">
              <View className="flex-row justify-between">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Paid Amount:
                </Text>
                <Text className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'
                  }`}>
                  ₹{totalPaid.toLocaleString('en-IN')}
                </Text>
              </View>
              {remainingAmount > 0 && (
                <View className="flex-row justify-between">
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Remaining:
                  </Text>
                  <Text className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                    ₹{remainingAmount.toLocaleString('en-IN')}
                  </Text>
                </View>
              )}


            </View>

          </>
        )}
      </Pressable>
      </Swipeable>
    </Animated.View>
  );
};

const TransactionList = ({ transactions = [], isDark, onDeleteTransaction, onTransactionUpdate }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const groupedTransactions = useMemo(() => {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.orderDate).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {});
  }, [transactions]);

  const handlePressPayment = useCallback((transaction) => {
    if (transaction.purchaseType === 'Credit') {
      setSelectedTransaction(transaction);
    }
  }, []);

  return (
    <>
      <ScrollView
        className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <View className="flex-row justify-between items-center">
            <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Transaction History
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {transactions.length} transactions
            </Text>
          </View>
        </View>

        {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
          <View key={date}>
            <DateDivider date={date} isDark={isDark} />
            {dateTransactions.map((transaction, index) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isDark={isDark}
                onDelete={onDeleteTransaction}
                onPressPayment={handlePressPayment}
                index={index}
              />
            ))}
          </View>
        ))}

        {transactions.length === 0 && (
          <View className="p-8 items-center">
            <MaterialIcons
              name="receipt-long"
              size={40}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No transactions found
            </Text>
          </View>
        )}
      </ScrollView>

      <PaymentModal
        visible={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        order={selectedTransaction}
        onPaymentAdded={(updatedTransaction) => {
          onTransactionUpdate?.(updatedTransaction);
          setSelectedTransaction(null);
        }}
        isDark={isDark}
      />
    </>
  );
};

export default TransactionList;