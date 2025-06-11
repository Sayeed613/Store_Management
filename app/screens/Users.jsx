import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import PinModal from '../components/Aunthentication/PinModal';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const UserCard = ({ user, onResetPin, isDark }) => (
  <View className={`p-4 mb-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
    <View className="flex-row justify-between items-center">
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {user.name}
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          ID: {user.id.substring(0, 8)}...
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onResetPin(user)}
        className={`flex-row items-center px-3 py-2 rounded-lg
          ${isDark ? 'bg-blue-600' : 'bg-blue-500'} active:opacity-80`}
      >
        <MaterialIcons name="lock-reset" size={18} color="white" />
        <Text className="text-white ml-2 font-medium">Reset PIN</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const AddUserModal = ({ isVisible, onClose, onAdd, isDark }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !pin || pin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid name and 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      await onAdd({ name, pin });
      setName('');
      setPin('');
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
            placeholder="Enter 4-digit PIN"
            value={pin}
            onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
            keyboardType="numeric"
            maxLength={4}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-6 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            secureTextEntry
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

const Users = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pinValues, setPinValues] = useState(['', '', '', '']);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

const handleAddUser = async (userData) => {
  try {
    await addDoc(collection(db, 'users'), {
      name: userData.name,
      pin: userData.pin,
      createdAt: new Date()
    });
    fetchUsers();
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

  const handleResetPin = (user) => {
    setSelectedUser(user);
    setShowPinModal(true);
  };

  const handlePinChange = (index, value) => {
    const newPinValues = [...pinValues];
    newPinValues[index] = value;
    setPinValues(newPinValues);

    if (index === 3 && value !== '') {
      updateUserPin(newPinValues.join(''));
    }
  };

  const updateUserPin = async (newPin) => {
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        pin: newPin,
        updatedAt: new Date()
      });
      Alert.alert('Success', 'PIN updated successfully');
      setShowPinModal(false);
      setPinValues(['', '', '', '']);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update PIN');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#2563EB'} />
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-6">
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 flex-row items-center"
          >
            <MaterialIcons name="person-add" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Add User</Text>
          </TouchableOpacity>
        </View>

        {users.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onResetPin={handleResetPin}
            isDark={isDark}
          />
        ))}
      </View>

      <AddUserModal
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
        isDark={isDark}
      />

      <Modal
        isVisible={showPinModal}
        backdropOpacity={0.5}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriver
        hideModalContentWhileAnimating
        onBackdropPress={() => {
          setShowPinModal(false);
          setPinValues(['', '', '', '']);
          setSelectedUser(null);
        }}
      >
        <View className="flex-1 justify-center items-center">
          <View className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl min-w-[320px]`}>
            <Text className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Reset PIN
            </Text>
            <Text className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter new PIN for {selectedUser?.name}
            </Text>

            <PinModal
              values={pinValues}
              onChange={handlePinChange}
              isDark={isDark}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Users;