import { View, Text, Pressable, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/currency';

const formatDateTime = (date) => {
  if (!date) return 'No date';
  try {
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

const TransactionItem = ({ transaction, isDark, onDelete }) => {
  const renderRightActions = (progress, dragX) => {
    return (
      <Pressable
        onPress={() => {
          Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Delete',
                onPress: () => onDelete(transaction.id),
                style: 'destructive'
              }
            ]
          );
        }}
        className="bg-red-500 justify-center px-4"
      >
        <MaterialCommunityIcons name="delete" size={24} color="white" />
      </Pressable>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View className="p-4 bg-inherit">
        <View className="flex-row justify-between items-start">
          <View>
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(transaction.amount)}
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatDateTime(transaction.orderDate)}
            </Text>
          </View>
          <View className="items-end">
            <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {transaction.salesType}
            </Text>
            <Text className={`text-sm ${

                 isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              {transaction.purchaseType}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
};

const TransactionList = ({ transactions = [], isDark, onDeleteTransaction }) => {
  return (
    <View className={`rounded-xl mb-4 ${
      isDark ? 'bg-gray-800' : 'bg-white'
    } shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <View className="p-4 border-b border-gray-200">
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Transaction History
        </Text>
      </View>

      <View className="divide-y divide-gray-200">
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            isDark={isDark}
            onDelete={onDeleteTransaction}
          />
        ))}

        {transactions.length === 0 && (
          <View className="p-4">
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No transactions found
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TransactionList;