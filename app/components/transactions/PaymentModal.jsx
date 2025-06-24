import { MaterialIcons } from '@expo/vector-icons';
import {
  arrayUnion,
  doc,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { useTheme } from '../../context/ThemeContextProvider';
import { db } from '../../services/firebase/config';

const PaymentModal = ({ visible, onClose, order, onPaymentAdded }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [newPayment, setNewPayment] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPaid = useMemo(() => {
    if (!order?.payments) return 0;
    return order.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [order?.payments]);

  const credit = useMemo(() => {
    if (!order?.amount) return 0;
    return order.amount - (totalPaid || 0);
  }, [order?.amount, totalPaid]);

  if (!order || !visible) return null;

  const validatePayment = (amount) => {
    const paymentAmount = Number(amount);

    if (!amount || amount.trim() === '') {
      Alert.alert('Error', 'Please enter a payment amount');
      return false;
    }

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (paymentAmount > credit) {
      Alert.alert('Error', 'Payment amount cannot exceed remaining credit');
      return false;
    }

    if (paymentAmount > 10000000) {
      Alert.alert('Error', 'Amount exceeds maximum limit (1 Crore)');
      return false;
    }

    if (amount.includes('.') && amount.split('.')[1].length > 2) {
      Alert.alert('Error', 'Amount cannot have more than 2 decimal places');
      return false;
    }

    return true;
  };

  const handleAddPayment = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      const trimmedAmount = newPayment?.trim();
      if (!validatePayment(trimmedAmount)) return;
      addPayment(trimmedAmount);
    }, 100);
  };

  const addPayment = async (amount) => {
    setLoading(true);
    try {
      const paymentAmount = Number(amount);
      const currentDate = new Date();

      const batch = writeBatch(db);
      const updatedTotalPaid = totalPaid + paymentAmount;
      const updatedStatus = order.amount - updatedTotalPaid <= 0 ? 'Completed' : 'Pending';

      batch.update(doc(db, 'sales', order.id), {
        payments: arrayUnion({
          amount: paymentAmount,
          date: currentDate,
          paymentType: 'Cash'
        }),
        totalPaid: increment(paymentAmount),
        status: updatedStatus,
        lastPaymentDate: currentDate,
        updatedAt: serverTimestamp()
      });

      if (order.outletId) {
        batch.update(doc(db, 'outlets', order.outletId), {
          pendingAmount: increment(-paymentAmount),
          updatedAt: serverTimestamp()
        });
      }

      await batch.commit();

      const updatedOrder = {
        ...order,
        totalPaid: updatedTotalPaid,
        payments: [
          ...(order.payments || []),
          {
            amount: paymentAmount,
            date: currentDate,
            paymentType: 'Cash'
          }
        ],
        status: updatedStatus,
        lastPaymentDate: currentDate
      };

      onPaymentAdded(updatedOrder);
      setNewPayment('');
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      const timestamp = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return timestamp.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const formateTime = (data) => {
    if (!data) return '';
    try {
      const timestamp = data?.seconds ? new Date(data.seconds * 1000) : new Date(data);
      return timestamp.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Time formatting error:', error);
      return '';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View  className="flex-1 justify-center items-center bg-black/50">
        <View
          className={`w-[90%] rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-xl`}
          style={{ maxHeight: '75%' }}
        >
          <View className={`flex-row justify-between items-center p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View>
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Payment Details
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {order.storeName}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <MaterialIcons name="close" size={20} color={isDark ? 'white' : 'black'} />
            </Pressable>
          </View>

          <ScrollView
            className="p-4"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <View className="flex-row justify-between mb-4">
              <View className={`p-4 rounded-xl flex-1 mr-2 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Amount
                </Text>
                <Text className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{order.amount.toFixed(2)}
                </Text>
              </View>
              <View className={`p-4 rounded-xl flex-1 ml-2 ${isDark ? 'bg-gray-800' : 'bg-red-50'}`}>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Balance
                </Text>
                <Text className={`text-xl font-bold mt-1 ${credit > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-green-400' : 'text-green-600')}`}>
                  ₹{credit.toFixed(2)}
                </Text>
              </View>
            </View>

            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Payment Progress
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {((totalPaid / order.amount) * 100).toFixed(0)}%
                </Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-500"
                  style={{ width: `${(totalPaid / order.amount) * 100}%` }}
                />
              </View>
            </View>

            {credit > 0 && (
              <View className="mb-6">
                <Text className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Add Payment
                </Text>
                <View className="flex-row">
                  <TextInput
                    className={`flex-1 px-4 py-3 rounded-l-xl border ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                    placeholder="Enter amount"
                    placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                    keyboardType="numeric"
                    value={newPayment}
                    onChangeText={setNewPayment}
                    blurOnSubmit
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={handleAddPayment}
                    disabled={loading}
                    className={`px-6 py-3 rounded-r-xl ${loading ? 'bg-gray-500' : 'bg-blue-500'}`}
                  >
                    <Text className="text-white font-medium">
                      {loading ? 'Adding...' : 'Pay'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View>
              <Text className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Payment History
              </Text>
              <FlatList
                data={(order.payments || []).slice().reverse()}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
                renderItem={({ item }) => (
                  <View className={`flex-row justify-between items-center p-4 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <View>
                      <View className="flex-row items-center">
                        <MaterialIcons
                          name="payments"
                          size={16}
                          color={isDark ? '#9ca3af' : '#4b5563'}
                        />
                        <Text className={`ml-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          ₹{item.amount.toFixed(2)}
                        </Text>
                      </View>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {formateTime(item.date)}
                      </Text>
                    </View>
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                      {formatDate(item.date)}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} italic text-center p-4`}>
                    No payments recorded
                  </Text>
                }
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentModal;
