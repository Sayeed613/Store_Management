import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Alert, Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';
import { formatCurrency } from '../../utils/currencyAndTime';

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

const PaymentHistory = ({ payments, isDark }) => {
  if (!payments?.length) return null;

  return (
    <View className="mt-2 pl-12 border-t border-gray-700/20 pt-2">
      <Text className={`text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        Payment History
      </Text>
      <View className="space-y-2">
        {payments.map((payment, index) => (
          <View key={index} className="flex-row justify-between items-center">
            <View className="flex-row items-center space-x-2">
              <MaterialIcons
                name="payment"
                size={14}
                color={isDark ? '#9ca3af' : '#4b5563'}
              />
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {new Date(payment.date).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              ₹{payment.amount.toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const TransactionItem = ({ transaction, isDark, onDelete }) => {
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
              onPress: () => onDelete(transaction.id),
              style: 'destructive'
            }
          ]
        );
      }}
      className="bg-red-500 justify-center items-center w-16"
    >
      <MaterialCommunityIcons name="delete" size={24} color="white" />
    </Pressable>
  );

  const totalPaid = transaction.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const remainingAmount = transaction.amount - totalPaid;

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <Animated.View
        entering={FadeIn}
        className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
      >
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <View className="flex-row gap-2 items-center space-x-2">
              <View className={`w-10 h-10 rounded-full items-center justify-center ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <MaterialIcons
                  name={transaction.salesType === 'Cash' ? 'payments' : 'account-balance'}
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
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View className="items-end space-y-1">
            <StatusBadge status={transaction.status} isDark={isDark} />
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {transaction.salesType} • {transaction.purchaseType}
            </Text>
          </View>
        </View>

        {transaction.salesType === 'Credit' && (
          <View className="mt-3 pl-12">
            <View className="flex-row justify-between">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Paid Amount:
              </Text>
              <Text className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                ₹{totalPaid.toLocaleString('en-IN')}
              </Text>
            </View>
            {remainingAmount > 0 && (
              <View className="flex-row justify-between">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Remaining:
                </Text>
                <Text className={`text-sm font-medium ${
                  isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                  ₹{remainingAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
          </View>
        )}

        {transaction.salesType === 'Credit' && transaction.payments?.length > 0 && (
          <PaymentHistory payments={transaction.payments} isDark={isDark} />
        )}

        {transaction.notes && (
          <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {transaction.notes}
          </Text>
        )}
      </Animated.View>
    </Swipeable>
  );
};

const TransactionList = ({ transactions = [], isDark, onDeleteTransaction }) => {
  return (
    <View className={`rounded-xl overflow-hidden ${
      isDark ? 'bg-gray-800' : 'bg-white'
    } shadow-sm`}>
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

      <View className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            isDark={isDark}
            onDelete={onDeleteTransaction}
          />
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
      </View>
    </View>
  );
};

export default TransactionList;