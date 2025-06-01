import { MaterialIcons } from '@expo/vector-icons';
import {
  arrayUnion,
  doc,
  increment,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  FlatList,
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

  // Calculate totals
  const totalPaid = (order?.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingBalance = order ? order.amount - totalPaid : 0;

  const handleAddPayment = async () => {
    if (!newPayment || isNaN(newPayment) || Number(newPayment) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const paymentAmount = Number(newPayment);
    if (paymentAmount > remainingBalance) {
      Alert.alert('Error', 'Payment amount cannot exceed remaining balance');
      return;
    }

    setLoading(true);
    try {
      const currentDate = new Date();
      const newPaymentData = {
        amount: paymentAmount,
        date: currentDate,
        paymentType: 'Cash',
        notes: `Payment of ₹${paymentAmount}`
      };

      const newTotalPaid = totalPaid + paymentAmount;
      const newRemainingBalance = order.amount - newTotalPaid;
      const newStatus = newRemainingBalance <= 0 ? 'Completed' : 'Pending';

      const batch = writeBatch(db);

      // Update order document
      const orderRef = doc(db, 'sales', order.id);
      batch.update(orderRef, {
        payments: arrayUnion(newPaymentData),
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        lastPaymentDate: currentDate,
        updatedAt: serverTimestamp()
      });

      // Update outlet document
      const outletRef = doc(db, 'outlets', order.outletId);
      batch.update(outletRef, {
        pendingAmount: increment(-paymentAmount),
        updatedAt: serverTimestamp(),
        ...(newStatus === 'Completed' && { lastOrderStatus: 'Completed' })
      });

      await batch.commit();
      setNewPayment('');

      // Update local state
      const updatedOrder = {
        ...order,
        payments: [...(order.payments || []), newPaymentData],
        totalPaid: newTotalPaid,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        lastPaymentDate: currentDate
      };

      onPaymentAdded?.(updatedOrder);
      Alert.alert('Success', 'Payment added successfully', [
        { text: 'OK', onPress: onClose }
      ]);

    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className={`w-[90%] rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-xl`}>
          {/* Header */}
          <View className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row justify-between items-center">
              <View>
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Payment Details
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {order?.storeName}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-2">
                <MaterialIcons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="p-4">
            {/* Payment Input */}
            <View className="mb-4">
              <TextInput
                placeholder="Enter payment amount"
                placeholderTextColor={isDark ? '#888' : '#999'}
                value={newPayment}
                onChangeText={setNewPayment}
                keyboardType="numeric"
                className={`border rounded-xl px-4 py-3 ${
                  isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
              <Text className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Remaining Balance: ₹{remainingBalance.toLocaleString('en-IN')}
              </Text>
            </View>

            {/* Payment History */}
            {order?.payments?.length > 0 && (
              <View>
                <Text className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Payment History
                </Text>
                <FlatList
                  data={[...order.payments].reverse()}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View className={`p-3 mb-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <View className="flex-row justify-between">
                        <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </Text>
                        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {formatDate(item.date)}
                        </Text>
                      </View>
                    </View>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="p-4 border-t border-gray-200">
            <Pressable
              onPress={handleAddPayment}
              disabled={loading || !newPayment}
              className={`py-3 rounded-xl items-center ${
                loading || !newPayment ? 'bg-gray-500' : 'bg-blue-600'
              }`}
            >
              <Text className="text-white font-semibold">
                {loading ? 'Adding...' : 'Add Payment'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentModal;