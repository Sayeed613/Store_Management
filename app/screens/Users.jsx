import { MaterialIcons } from '@expo/vector-icons';
import { addDoc, collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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



// Add this component after the imports and before ResetPinModal
const AddUserModal = ({ isVisible, onClose, onAdd, isDark }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [userType, setUserType] = useState('admin');
  const [loading, setLoading] = useState(false);

  const validateUsername = (text) => {
    // Allow only letters, numbers, underscore and @
    return text.replace(/[^a-zA-Z0-9_@]/g, '');
  };

  const handleSubmit = async () => {
    if (!fullName || !username || !pin || pin.length !== 4) {
      Alert.alert('Error', 'Please fill all fields with valid data');
      return;
    }

    if (!phone || phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        fullName,
        username: username.toLowerCase(),
        pin,
        phone,
        userType
      });

      // Reset form
      setFullName('');
      setUsername('');
      setPin('');
      setPhone('');
      setUserType('admin');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} w-full`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Add New User
          </Text>

          <TextInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          />

          <TextInput
            placeholder="Username (letters, numbers, @ and _)"
            value={username}
            onChangeText={(text) => setUsername(validateUsername(text))}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          />

          <TextInput
            placeholder="Phone Number"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="numeric"
            maxLength={10}
            placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
            className={`p-3 rounded-lg mb-4 ${
              isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
          />

          <View className="relative mb-4">
            <TextInput
              placeholder="4-digit PIN"
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showPin}
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`p-3 rounded-lg pr-12 ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
            <TouchableOpacity
              onPress={() => setShowPin(!showPin)}
              className="absolute right-3 top-3"
            >
              <MaterialIcons
                name={showPin ? "visibility" : "visibility-off"}
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row mb-6">
            <TouchableOpacity
              onPress={() => setUserType('admin')}
              className="flex-row items-center mr-6"
            >
              <View className={`w-5 h-5 border rounded ${
                isDark ? 'border-gray-500' : 'border-gray-400'
              } ${userType === 'admin' ? 'bg-blue-500 border-blue-500' : ''}`}>
                {userType === 'admin' && (
                  <MaterialIcons name="check" size={18} color="white" />
                )}
              </View>
              <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Admin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUserType('salesman')}
              className="flex-row items-center"
            >
              <View className={`w-5 h-5 border rounded ${
                isDark ? 'border-gray-500' : 'border-gray-400'
              } ${userType === 'salesman' ? 'bg-blue-500 border-blue-500' : ''}`}>
                {userType === 'salesman' && (
                  <MaterialIcons name="check" size={18} color="white" />
                )}
              </View>
              <Text className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Salesman
              </Text>
            </TouchableOpacity>
          </View>

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
      </KeyboardAvoidingView>
    </Modal>
  );
};


// Reset PIN Modal Component
const ResetPinModal = ({ isVisible, onClose, onReset, isDark, userName }) => {
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [showPin1, setShowPin1] = useState(false);
  const [showPin2, setShowPin2] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!pin1 || !pin2 || pin1.length !== 4 || pin2.length !== 4) {
      Alert.alert('Error', 'Please enter valid 4-digit PINs');
      return;
    }

    if (pin1 !== pin2) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    setLoading(true);
    try {
      await onReset(pin1);
      setPin1('');
      setPin2('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to reset PIN');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} w-full`}>
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Reset PIN for {userName}
          </Text>

          <View className="relative mb-4">
            <TextInput
              placeholder="Enter new 4-digit PIN"
              value={pin1}
              onChangeText={(text) => setPin1(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showPin1}
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`p-3 rounded-lg pr-12 ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
            <TouchableOpacity
              onPress={() => setShowPin1(!showPin1)}
              className="absolute right-3 top-3"
            >
              <MaterialIcons
                name={showPin1 ? "visibility" : "visibility-off"}
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          <View className="relative mb-6">
            <TextInput
              placeholder="Re-enter new 4-digit PIN"
              value={pin2}
              onChangeText={(text) => setPin2(text.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry={!showPin2}
              placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
              className={`p-3 rounded-lg pr-12 ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            />
            <TouchableOpacity
              onPress={() => setShowPin2(!showPin2)}
              className="absolute right-3 top-3"
            >
              <MaterialIcons
                name={showPin2 ? "visibility" : "visibility-off"}
                size={24}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onClose}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <Text className={isDark ? 'text-white' : 'text-gray-900'}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              className={`px-4 py-2 rounded-lg ${loading ? 'bg-blue-400' : 'bg-blue-500'}`}
            >
              <Text className="text-white">{loading ? 'Resetting...' : 'Reset PIN'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// User Card Component
const UserCard = ({ user, onResetPin, isDark }) => {
  const [showPin, setShowPin] = useState(false);

  return (
    <View className={`p-4 mb-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {user.fullName}
          </Text>
          <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Username: @{user.username}
          </Text>
          <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            ID: {user.id}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              PIN: {showPin ? user.pin : '****'}
            </Text>
            <TouchableOpacity
              onPress={() => setShowPin(!showPin)}
              className="ml-2"
            >
              <MaterialIcons
                name={showPin ? "visibility" : "visibility-off"}
                size={20}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
            </TouchableOpacity>
          </View>
          <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Phone: {user.phone}
          </Text>
          <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            User Type: {user.userType}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => onResetPin(user)}
          className={`flex-row items-center px-3 py-2 rounded-lg
            ${isDark ? 'bg-blue-600' : 'bg-blue-500'} active:opacity-80`}
        >
          <MaterialIcons name="lock-reset" size={18} color="white" />
          <Text className="text-white ml-2">Reset PIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Users Component
const Users = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

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

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      unsubscribe();
    };
  }, []);

  const handleAddUser = async (userData) => {
    try {
      await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: new Date()
      });
      Alert.alert('Success', 'User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const handleResetPin = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const handleResetPinSubmit = async (newPin) => {
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, { pin: newPin });
      Alert.alert('Success', 'PIN reset successfully');
    } catch (error) {
      console.error('Error resetting PIN:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
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

        {!keyboardVisible && (
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className={`absolute bottom-6 right-6 p-4 rounded-full
              ${isDark ? 'bg-blue-600' : 'bg-blue-500'} shadow-lg`}
          >
            <MaterialIcons name="person-add" size={24} color="white" />
          </TouchableOpacity>
        )}

        <AddUserModal
          isVisible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddUser}
          isDark={isDark}
        />

        <ResetPinModal
          isVisible={showResetModal}
          onClose={() => {
            setShowResetModal(false);
            setSelectedUser(null);
          }}
          onReset={handleResetPinSubmit}
          isDark={isDark}
          userName={selectedUser?.fullName}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Users;