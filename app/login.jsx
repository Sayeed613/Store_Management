import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PinModal from './components/Aunthentication/PinModal';
import Loader from './components/common/Loader';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContextProvider';
import { db } from './services/firebase/config';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showNewPinModal, setShowNewPinModal] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState(['', '', '', '']);
  const [newPinDigits, setNewPinDigits] = useState(['', '', '', '']);
  const [foundUserId, setFoundUserId] = useState(null);
  const { login, loading, error, user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pinInput = useRef(null);

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
    }
  }, [user]);

  const validateInputs = () => {
    if (!username) return setValidationError('Username is required');
    if (!/^[a-zA-Z0-9@_]+$/.test(username)) return setValidationError('Invalid characters in username');
    if (!pin) return setValidationError('PIN is required');
    if (!/^\d{4}$/.test(pin)) return setValidationError('PIN must be exactly 4 digits');
    setValidationError('');
    return true;
  };

  const handleLogin = async () => {
    if (validateInputs()) {
      const success = await login(username, pin);
      if (success) router.replace('/(tabs)');
    }
  };
  const handleForgotPin = () => {
    setPhoneDigits(['', '', '', '']);
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async () => {
    const last4Digits = phoneDigits.join('');

    if (!/^\d{4}$/.test(last4Digits)) {
      Alert.alert('Invalid', 'Please enter exactly 4 digits');
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      // Find the user matching last 4 digits of phone number
      const userDoc = snapshot.docs.find(doc => {
        const user = doc.data();
        return user.phone?.slice(-4) === last4Digits;
      });

      if (!userDoc) {
        Alert.alert('Not Found', 'No user found with that phone number');
        setShowPhoneModal(false);
        return;
      }

      setFoundUserId(userDoc.id);
      setShowPhoneModal(false);
      setNewPinDigits(['', '', '', '']);
      setShowNewPinModal(true);

    } catch (error) {
      console.error('Forgot PIN error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleNewPinSubmit = async () => {
    const newPin = newPinDigits.join('');

    if (!/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'PIN must be exactly 4 digits');
      return;
    }

    try {
      // Update PIN in Firestore
      await updateDoc(doc(db, 'users', foundUserId), {
        pin: newPin,
      });

      setShowNewPinModal(false);
      setFoundUserId(null);
      Alert.alert('Success', 'Your PIN has been reset!');
    } catch (error) {
      console.error('Update PIN error:', error);
      Alert.alert('Error', 'Failed to update PIN. Please try again.');
    }
  };

  const updatePhoneDigit = (index, value) => {
    const newDigits = [...phoneDigits];
    newDigits[index] = value;
    setPhoneDigits(newDigits);
  };

  const updateNewPinDigit = (index, value) => {
    const newDigits = [...newPinDigits];
    newDigits[index] = value;
    setNewPinDigits(newDigits);
  };

  if (loading) return <Loader message="Checking session..." />;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-between px-6 py-8"
      >
        <View className="mt-12">
          <View className="mb-12">
            <Text className={`text-3xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Welcome Back
            </Text>
            <Text className={`text-sm text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Sign in to continue
            </Text>
          </View>

          <View className="space-y-6">
            <View className="relative mb-6">
              <Ionicons
                name="person-outline"
                size={20}
                style={{ position: 'absolute', top: 18, left: 12 }}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <TextInput
                className={`pl-3 pr-4 py-4 rounded-xl text-base border ${isDark
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-gray-100 text-gray-900 border-gray-300'
                  }`}
                placeholder="Username"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={username}
                onChangeText={(text) => {
                  setUsername(text.replace(/[^a-zA-Z0-9@_]/g, ''));
                  setValidationError('');
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => pinInput.current?.focus()}
              />
            </View>

            <View className="relative">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                style={{ position: 'absolute', top: 18, left: 12 }}
                color={isDark ? '#9ca3af' : '#6b7280'}
              />
              <TextInput
                ref={pinInput}
                className={`pl-3 pr-12 py-4 rounded-xl text-base border ${isDark
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-gray-100 text-gray-900 border-gray-300'
                  }`}
                placeholder="PIN"
                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                value={pin}
                onChangeText={(text) => {
                  setPin(text);
                  setValidationError('');
                }}
                secureTextEntry={!showPin}
                keyboardType="numeric"
                maxLength={4}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPin(!showPin)}
                style={{ position: 'absolute', right: 16, top: 20 }}
              >
                <Ionicons
                  name={showPin ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={isDark ? '#9ca3af' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgotPin} className="mb-4">
              <Text className="text-right text-red-900 text-sm font-medium mt-2">Forgot PIN ?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              onPress={handleLogin}
              className={`py-4 mt-3 rounded-xl ${username && pin.length === 4
                ? 'bg-indigo-600'
                : 'bg-indigo-400 opacity-80'
                }`}
            >
              <Text className="text-center text-white font-semibold text-base">Sign In</Text>
            </TouchableOpacity>

                        {(error || validationError) && (
              <View className="bg-red-500/10 p-3 rounded-lg mt-4">
                <Text className="text-red-500 text-center text-sm">
                  {validationError || error}
                </Text>
              </View>
            )}

            </View>
        </View>
      </KeyboardAvoidingView>

      {/* Phone Number Modal */}
      <Modal
        visible={showPhoneModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`m-6 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Text className={`text-lg font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Forgot PIN
            </Text>
            <Text className={`text-sm text-center  ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Enter last 4 digits of
            </Text>
            <Text className={`text-sm text-center  mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              your registered phone number
            </Text>

            <PinModal
              values={phoneDigits}
              onChange={updatePhoneDigit}
              isDark={isDark}
            />

            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={() => setShowPhoneModal(false)}
                className={`flex-1 mr-2 py-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <Text className={`text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePhoneSubmit}
                className="flex-1 ml-2 py-3 rounded-lg bg-indigo-600"
              >
                <Text className="text-center font-medium text-white">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New PIN Modal */}
      <Modal
        visible={showNewPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewPinModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`m-6 p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <Text className={`text-lg font-bold text-center mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Reset PIN
            </Text>
            <Text className={`text-sm text-center mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Enter your new 4-digit PIN
            </Text>

            <PinModal
              values={newPinDigits}
              onChange={updateNewPinDigit}
              isDark={isDark}
            />

            <View className="flex-row justify-between mt-6">
              <TouchableOpacity
                onPress={() => setShowNewPinModal(false)}
                className={`flex-1 mr-2 py-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <Text className={`text-center font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNewPinSubmit}
                className="flex-1 ml-2 py-3 rounded-lg bg-indigo-600"
              >
                <Text className="text-center font-medium text-white">Reset PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
