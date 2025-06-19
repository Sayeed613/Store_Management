import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const UserType = ({ isDark, isChecked, onToggle }) => (
  <TouchableOpacity
    onPress={onToggle}
    className="flex-row items-center mb-4"
  >
    <View className={`w-5 h-5 border rounded ${
      isDark ? 'border-gray-500' : 'border-gray-400'
    } ${isChecked ? 'bg-blue-500 border-blue-500' : ''}`}>
      {isChecked && (
        <MaterialIcons name="check" size={18} color="white" />
      )}
    </View>
    <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
      Register as Salesman
    </Text>
  </TouchableOpacity>
);

const AddUserModal = ({ isVisible, onClose, onAdd, isDark }) => {
  const [name, setName] = useState('');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [phone, setPhone] = useState('');
  const [isSalesman, setIsSalesman] = useState(false);
  const [loading, setLoading] = useState(false);

const checkDuplicatePhone = async (phone) => {
  try {
    const q = query(collection(db, 'users'), where('phone', '==', phone));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking phone:', error);
    return false;
  }
};

const handleSubmit = async () => {
  if (!name || !pin1 || !pin2 || pin1.length !== 4 || pin2.length !== 4) {
    Alert.alert('Error', 'Please enter a valid name and 4-digit PINs');
    return;
  }

  if (!phone || phone.length !== 10) {
    Alert.alert('Error', 'Please enter a valid 10-digit phone number');
    return;
  }

  if (pin1 !== pin2) {
    Alert.alert('Error', 'PINs do not match');
    return;
  }

  setLoading(true);
  try {
    // Check for duplicate phone number
    const isDuplicate = await checkDuplicatePhone(phone);
    if (isDuplicate) {
      Alert.alert('Error', 'This phone number is already registered');
      setLoading(false);
      return;
    }

    await onAdd({
      name,
      pin: pin1,
      phone,
      userType: isSalesman ? 'salesman' : 'admin'
    });
    setName('');
    setPin1('');
    setPin2('');
    setPhone('');
    setIsSalesman(false);
    onClose();
  } catch (error) {
    Alert.alert('Error', 'Failed to add user');
  } finally {
    setLoading(false);
  }
};


  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver
      hideModalContentWhileAnimating
      onBackdropPress={onClose}
    >
      <View className="flex-1 justify-center items-center">
        <View className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} w-[90%]`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Add New User
          </Text>

          <TextInput
            placeholder="Enter user name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          />
          <TextInput
            placeholder="Enter phone number"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="numeric"
            maxLength={10}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          />

          <TextInput
            placeholder="Enter 4-digit PIN"
            value={pin1}
            onChangeText={(text) => setPin1(text.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            secureTextEntry
          />

          <TextInput
            placeholder="Re-enter 4-digit PIN"
            value={pin2}
            onChangeText={(text) => setPin2(text.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-6 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            secureTextEntry
          />


          <UserType
            isDark={isDark}
            isChecked={isSalesman}
            onToggle={() => setIsSalesman(!isSalesman)}
          />

          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onClose}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Text className={isDark ? 'text-white' : 'text-gray-900'}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${loading ? 'bg-blue-400' : 'bg-blue-500'}`}
            >
              <Text className="text-white">{loading ? 'Adding...' : 'Add User'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};



const UserCard = ({ user, onResetPin, isDark }) => (

  <View className={`p-4 mb-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.name}
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          ID: {user.id}
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Phone: {(user.phone)}
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          User Type: {user.userType || 'admin'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onResetPin(user)}
        className={`flex-row items-center px-3 py-2 rounded-lg
          ${isDark ? 'bg-blue-600' : 'bg-blue-500'} active:opacity-80`}
      >
        <MaterialIcons name="lock-reset" size={18} color="white" />
      </TouchableOpacity>
    </View>
  </View>
);

const Users = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

 useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersData);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users');
        setLoading(false);
        setRefreshing(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, []);


  const handleAddUser = async (userData) => {
    try {
      await addDoc(collection(db, 'users'), {
        name: userData.name,
        pin: userData.pin,
        phone: userData.phone,
        userType: userData.userType,
        createdAt: new Date()
      });
      // No need to call fetchUsers here as the real-time listener will update automatically
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };


  const handleResetPin = (user) => {
    Alert.alert('Reset PIN', `Reset PIN for ${user.name}?`);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <View className="p-4">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Users
        </Text>
        </View>
      <ScrollView className="flex-1 p-4">
        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onResetPin={handleResetPin}
            isDark={isDark}
          />
        ))}
      </ScrollView>

      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        className={`absolute bottom-6 right-6 p-4 rounded-full
          ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
      >
        <MaterialIcons name="person-add" size={24} color="white" />
      </TouchableOpacity>

      <AddUserModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
        isDark={isDark}
      />
    </SafeAreaView>
  );
};

export default Users;