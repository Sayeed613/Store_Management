import { MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { db } from '../../services/firebase/config';
import PinModal from '../Aunthentication/PinModal';
import PaymentModal from './PaymentModal';

const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    let timestamp;
    if (date?.toDate) {
      timestamp = date.toDate();
    } else if (date?.seconds) {
      timestamp = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      timestamp = date;
    } else {
      return 'Invalid date';
    }

    return timestamp.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

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
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValues, setPinValues] = useState(['', '', '', '']);

  const totalPaid = transaction.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const remainingAmount = transaction.amount - totalPaid;
  const completed = remainingAmount <= 0;

  const borderClass = completed
    ? isDark ? 'border-l-4 border-green-400' : 'border-l-4 border-green-600'
    : isDark ? 'border-l-4 border-red-400' : 'border-l-4 border-red-600';

  const verifyPinAndDelete = async (enteredPin) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const adminUser = querySnapshot.docs[0]?.data();

      if (adminUser?.pin.toString() === enteredPin) {
        onDelete?.(transaction.id);
        setShowPinModal(false);
        setPinValues(['', '', '', '']);
      } else {
        Alert.alert('Error', 'Incorrect PIN');
        setPinValues(['', '', '', '']);
      }
    } catch (error) {
      console.error('PIN verification error:', error);
      Alert.alert('Error', 'Failed to verify PIN');
    }
  };

  const handlePinChange = (index, value) => {
    const newPinValues = [...pinValues];
    newPinValues[index] = value;
    setPinValues(newPinValues);

    if (index === 3 && value !== '') {
      verifyPinAndDelete(newPinValues.join(''));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => setShowPinModal(true),
          style: 'destructive'
        }
      ]
    );
  };

  const renderRightActions = () => (
    <Pressable
      onPress={handleDelete}
      className="bg-red-500 justify-center items-center w-16 rounded-md mb-2"
      android_ripple={{ color: '#b91c1c' }}
    >
      <MaterialIcons name="delete" size={24} color="white" />
    </Pressable>
  );

  return (
    <>
      <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
        <Swipeable renderRightActions={renderRightActions}>
          <Pressable
            onPress={() => onAddPayment(transaction)}
            className={`mb-2 mx-1 rounded-md p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} ${borderClass}`}
          >
            <View className="flex-row justify-between items-center mt-1">
              <StatusBadge status={completed ? 'Completed' : 'Pending'} isDark={isDark} />
              <View className='flex-col gap-1 items-center justify-start'>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(transaction.orderDate)}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {transaction.salesType} • {transaction.purchaseType}
                </Text>
              </View>
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

              <Pressable
                onPress={() => onAddPayment(transaction)}
                className={`px-3 py-1 rounded-md ${
                  completed
                    ? isDark ? 'bg-green-600' : 'bg-green-500'
                    : isDark ? 'bg-blue-600' : 'bg-blue-500'
                } active:opacity-80`}
                android_ripple={{
                  color: completed
                    ? isDark ? '#16a34aaa' : '#22c55eaa'
                    : isDark ? '#2563ebaa' : '#3b82f6aa'
                }}
              >
                <Text className="text-white font-semibold text-sm">
                  {completed ? 'View Payments' : 'Add Payment'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Swipeable>
      </Animated.View>

      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl min-w-[320px]`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Confirm Delete
            </Text>
            <Text className={`text-sm text-center mb-8 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              Enter PIN to delete transaction
            </Text>

            <PinModal
              values={pinValues}
              onChange={handlePinChange}
              isDark={isDark}
            />

            <TouchableOpacity
              onPress={() => {
                setShowPinModal(false);
                setPinValues(['', '', '', '']);
              }}
              className="mt-6"
            >
              <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const TransactionList = ({ transactions = [], isDark, onDeleteTransaction, onTransactionUpdate }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [filter, setFilter] = useState('all');
  const INCREMENT = 5;

  const filterCounts = useMemo(() => {
    return transactions.reduce((acc, t) => {
      const totalPaid = t.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const isCompleted = totalPaid >= t.amount;

      return {
        all: acc.all + 1,
        pending: acc.pending + (isCompleted ? 0 : 1),
        completed: acc.completed + (isCompleted ? 1 : 0)
      };
    }, { all: 0, pending: 0, completed: 0 });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;

    return transactions.filter(t => {
      const totalPaid = t.payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
      const isCompleted = totalPaid >= t.amount;

      if (filter === 'pending') return !isCompleted;
      if (filter === 'completed') return isCompleted;
      return true;
    });
  }, [transactions, filter]);

  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + INCREMENT, filteredTransactions.length));
  }, [filteredTransactions.length]);

  const handleShowLess = useCallback(() => {
    setVisibleCount(INCREMENT);
  }, []);

  const handleDeleteTransaction = useCallback((transactionId) => {
    if (!transactionId) return;
    onDeleteTransaction?.(transactionId);
    setVisibleCount(prev => Math.max(INCREMENT, prev - 1));
  }, [onDeleteTransaction]);

  const handleAddPayment = useCallback((transaction) => {
    setSelectedTransaction(transaction);
  }, []);

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
              label={`Pending (${filterCounts.pending})`}
              active={filter === 'pending'}
              onPress={() => setFilter('pending')}
              isDark={isDark}
            />
            <FilterButton
              label={`Completed (${filterCounts.completed})`}
              active={filter === 'completed'}
              onPress={() => setFilter('completed')}
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
                onDelete={handleDeleteTransaction}
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
        onClose={() => setSelectedTransaction(null)}
        order={selectedTransaction}
        onPaymentAdded={(updatedTransaction) => {
          onTransactionUpdate?.(updatedTransaction);
          setSelectedTransaction(null);
        }}
      />
    </>
  );
};
export default TransactionList;