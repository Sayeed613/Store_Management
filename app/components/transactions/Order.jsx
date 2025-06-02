import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection, doc, getDocs, increment, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContextProvider';
import { db } from '../../services/firebase/config';

const salesTypes = ['Godown', 'Salesman', 'Store'];
const purchaseTypes = ['Credit', 'Cash'];

const Order = ({ visible, onClose, onOrderSaved }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [customerName, setCustomerName] = useState('');
  const [salesType, setSalesType] = useState(salesTypes[0]);
  const [purchaseType, setPurchaseType] = useState(purchaseTypes[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState('');
  const [outlets, setOutlets] = useState([]);
  const [filteredOutlets, setFilteredOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [orderDate, setOrderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const outletsRef = collection(db, 'outlets');
        const snapshot = await getDocs(outletsRef);
        const outletList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOutlets(outletList);
      } catch (error) {
        console.error('Failed to load outlets:', error);
        Alert.alert('Error', 'Failed to load outlets');
      }
    };
    fetchOutlets();
  }, []);

  useEffect(() => {
    const params = router.params;
    if (params?.preselectedOutlet) {
      try {
        const preselectedOutlet = JSON.parse(params.preselectedOutlet);
        setSelectedOutlet(preselectedOutlet);
        setSearchText(preselectedOutlet.storeName);
        setCustomerName(preselectedOutlet.propName || '');
        setShowSuggestions(false);
      } catch (error) {
        console.error('Failed to parse preselected outlet:', error);
      }
    }
  }, [router.params]);

  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredOutlets([]);
      setShowSuggestions(false);
      return;
    }

    const lowerSearchText = searchText.toLowerCase();
    const filtered = outlets.filter(outlet =>
      outlet.storeName?.toLowerCase().includes(lowerSearchText) ||
      outlet.phoneNumber?.includes(lowerSearchText) ||
      outlet.propName?.toLowerCase().includes(lowerSearchText)
    );

    setFilteredOutlets(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [searchText, outlets]);

  const handleSelectOutlet = (outlet) => {
    setSelectedOutlet(outlet);
    setSearchText(outlet.storeName);
    setCustomerName(outlet.propName || '');
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (purchaseType === 'Cash') {
      setAmount(totalAmount || '');
      setTotalAmount('');
      setPaidAmount('');
    } else {
      setTotalAmount(amount || '');
      setAmount('');
      setPaidAmount('');
    }
  }, [purchaseType]);

  const handleSaveSale = async () => {
    if (!selectedOutlet) {
      Alert.alert('Error', 'Please select an outlet');
      return;
    }

    if (purchaseType === 'Credit') {
      if (!totalAmount || !paidAmount) {
        Alert.alert('Error', 'Please enter both total amount and paid amount for credit sales');
        return;
      }
    } else {
      if (!amount) {
        Alert.alert('Error', 'Please enter the amount');
        return;
      }
    }

    setLoading(true);
    try {
      const saleAmount = purchaseType === 'Credit' ? Number(totalAmount) : Number(amount);
      const paid = purchaseType === 'Credit' ? Number(paidAmount) : saleAmount;
      const balance = Math.max(0, saleAmount - paid);

      const initialPayment = paid > 0 ? [{
        amount: paid,
        date: orderDate,
        paymentType: 'Cash',
        notes: 'Initial payment'
      }] : [];

      const saleData = {
        outletId: selectedOutlet.id,
        storeName: selectedOutlet.storeName,
        salesType,
        purchaseType,
        amount: saleAmount,
        totalPaid: paid,
        remainingBalance: balance,
        status: balance === 0 ? 'Completed' : 'Pending',
        customerName: customerName.trim(),
        orderDate,
        createdAt: serverTimestamp(),
        payments: initialPayment
      };

      const saleRef = await addDoc(collection(db, 'sales'), saleData);

      // Update outlet
      const outletRef = doc(db, 'outlets', selectedOutlet.id);
      await updateDoc(outletRef, {
        lastOrderAmount: saleAmount,
        lastOrderDate: orderDate,
        lastOrderId: saleRef.id,
        lastOrderType: purchaseType,
        lastOrderStatus: balance === 0 ? 'Completed' : 'Pending',
        lastSalesType: salesType,
        totalOrders: increment(1),
        totalAmount: increment(saleAmount),
        pendingAmount: increment(balance),
        updatedAt: serverTimestamp()
      });

      // Update local state and close modal
      if (typeof onOrderSaved === 'function') {
        onOrderSaved({ ...saleData, id: saleRef.id });
      }

      handleClose();
      Alert.alert('Success', 'Order saved successfully');

    } catch (error) {
      console.error('Failed to save order:', error);
      Alert.alert('Error', 'Failed to save order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchText('');
    setSelectedOutlet(null);
    setCustomerName('');
    setSalesType(salesTypes[0]);
    setPurchaseType(purchaseTypes[0]);
    setAmount('');
    setTotalAmount('');
    setPaidAmount('');
    setOrderDate(new Date());
    setShowSuggestions(false);
    onClose?.();
  };


  const renderSearchBar = () => (
    <View className="relative z-20">
      <TextInput
        placeholder="Search outlet"
        placeholderTextColor={isDark ? '#888' : '#999'}
        value={searchText}
        onChangeText={text => {
          setSearchText(text);
          if (selectedOutlet) {
            setSelectedOutlet(null);
          }
        }}
        onFocus={() => {
          setShowSuggestions(true);
          if (selectedOutlet) {
            setSelectedOutlet(null);
            setSearchText('');
          }
        }}
        className={`border rounded-xl px-4 py-3 ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
          }`}
      />

      {showSuggestions && filteredOutlets.length > 0 && (
        <View
          className="absolute top-full left-0 right-0 mt-1 z-30"
          style={{
            maxHeight: 100,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <View
            className={`border rounded-xl overflow-hidden ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
              }`}
          >
            <FlatList
              data={filteredOutlets}
              keyExtractor={item => item.id}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 300 }} // Match container height
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectOutlet(item)}
                  className={`px-4 py-3 border-b ${isDark ? 'border-gray-700 active:bg-gray-700' : 'border-gray-200 active:bg-gray-100'
                    }`}
                >
                  <Text
                    className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'
                      }`}
                  >
                    {item.storeName}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}
                  >
                    {item.propName} • {item.phoneNumber}
                  </Text>
                  <Text
                    className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-600'
                      }`}
                    numberOfLines={1}
                  >
                    {[item.street, item.route, item.locality].filter(Boolean).join(', ')}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
  const renderSelectedOutlet = () => (
    <Pressable
      onPress={() => {
        setSelectedOutlet(null);
        setSearchText('');
        setShowSuggestions(true);
      }}
    >
      <View className={`border rounded-xl px-4 py-3 mb-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
        }`}>
        <Text className={isDark ? 'text-white' : 'text-gray-900'}>
          {selectedOutlet.storeName}
        </Text>
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {selectedOutlet.propName} • {selectedOutlet.phoneNumber}
        </Text>
        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
          {[selectedOutlet.street, selectedOutlet.route, selectedOutlet.locality]
            .filter(Boolean)
            .join(', ')}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className={`flex-row justify-between items-center px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            New Order
          </Text>
          <Pressable
            onPress={handleClose}
            className="p-2 rounded-lg active:bg-gray-200"
          >
            <Text className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Close
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <FlatList
            ListHeaderComponent={
              <View className="p-4">
                <View className="relative z-20">
                  {selectedOutlet ? renderSelectedOutlet() : renderSearchBar()}
                </View>

                <View className="relative z-10 mt-4 space-y-4">
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    className={`border rounded-xl px-4 py-3 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
                      }`}
                  >
                    <Text className={isDark ? 'text-white' : 'text-gray-900'}>
                      Order Date: {orderDate.toLocaleDateString()}
                    </Text>
                  </Pressable>

                  <View>
                    <Text className={`font-semibold text-base mt-4 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      Sales Type
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {salesTypes.map(type => (
                        <Pressable
                          key={type}
                          onPress={() => setSalesType(type)}
                          className={`px-4 py-2 rounded-full border mt-2 ${salesType === type
                            ? 'bg-blue-600 border-blue-600'
                            : isDark
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white border-gray-300'
                            }`}
                        >
                          <Text className={`text-sm font-medium ${salesType === type ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                            {type}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View>
                    <Text className={`font-semibold text-base mt-4 ${isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                      Purchase Type
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {purchaseTypes.map(type => (
                        <Pressable
                          key={type}
                          onPress={() => setPurchaseType(type)}
                          className={`px-4 py-2 rounded-full border mt-2  ${purchaseType === type
                            ? 'bg-blue-600 border-blue-600'
                            : isDark
                              ? 'bg-gray-800 border-gray-700'
                              : 'bg-white border-gray-300'
                            }`}
                        >
                          <Text className={`text-sm font-medium  ${purchaseType === type ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-900'
                            }`}>
                            {type}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {purchaseType === 'Cash' ? (
                      <TextInput
                        placeholder="Amount"
                        placeholderTextColor={isDark ? '#888' : '#999'}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        className={`border rounded-xl px-4 py-3 mt-4 ${isDark
                            ? 'border-gray-700 bg-gray-800 text-white'
                            : 'border-gray-300 bg-white text-gray-900'
                          }`}
                      />
                    ) : (
                      <>
                        <TextInput
                          placeholder="Total Amount"
                          placeholderTextColor={isDark ? '#888' : '#999'}
                          value={totalAmount}
                          onChangeText={(text) => {
                            setTotalAmount(text);
                            // Optionally, you can clear paid amount when total changes
                            setPaidAmount('');
                          }}
                          keyboardType="numeric"
                          className={`border rounded-xl px-4 py-3 mt-4 ${isDark
                              ? 'border-gray-700 bg-gray-800 text-white'
                              : 'border-gray-300 bg-white text-gray-900'
                            }`}
                        />
                        <TextInput
                          placeholder="Paid Amount"
                          placeholderTextColor={isDark ? '#888' : '#999'}
                          value={paidAmount}
                          onChangeText={setPaidAmount}
                          keyboardType="numeric"
                          className={`border rounded-xl px-4 py-3 mt-4 ${isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-white text-gray-900'
                            }`}
                        />

                        <Text className={`mt-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Balance: {Math.max(0, (Number(totalAmount) || 0) - (Number(paidAmount) || 0)).toFixed(2)}
                        </Text>
                      </>
                    )}
                  </View>


                  <Pressable
                    onPress={handleSaveSale}
                    disabled={loading || !selectedOutlet}
                    className={`py-3 rounded-xl items-center mt-4 ${loading || !selectedOutlet ? 'bg-gray-500' : 'bg-blue-600 active:bg-blue-700'
                      }`}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        Save Order
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            }
            data={[]}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!showSuggestions}
          />
        </KeyboardAvoidingView>

        {Platform.OS === 'ios' ? (
          showDatePicker && (
            <Modal
              visible={showDatePicker}
              transparent={true}
              animationType="slide"
            >
              <View className="flex-1 justify-end bg-black/50">
                <View className={isDark ? 'bg-gray-800' : 'bg-white'}>
                  <View className="flex-row justify-end p-2 border-b border-gray-200">
                    <Pressable onPress={() => setShowDatePicker(false)} className="px-4 py-2">
                      <Text className="text-blue-600 font-semibold">Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={orderDate}
                    mode="date"
                    display="spinner"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) setOrderDate(selectedDate);
                    }}
                    textColor={isDark ? 'white' : 'black'}
                  />
                </View>
              </View>
            </Modal>
          )
        ) : (
          showDatePicker && (
            <DateTimePicker
              value={orderDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setOrderDate(selectedDate);
              }}
            />
          )
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default Order;