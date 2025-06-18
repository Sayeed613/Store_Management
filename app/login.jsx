import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Loader from './components/common/Loader';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContextProvider';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [validationError, setValidationError] = useState('');
    const { login, loading, error } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const pinInput = useRef(null);

    const validateInputs = () => {
        if (!username) {
            setValidationError('Username is required');
            return false;
        }
        if (!pin) {
            setValidationError('PIN is required');
            return false;
        }
        if (pin.length !== 4) {
            setValidationError('PIN must be 4 digits');
            return false;
        }
        setValidationError('');
        return true;
    };

    const handleLogin = async () => {
        if (validateInputs()) {
            const success = await login(username, pin);
            if (success) {
                router.replace('/(tabs)');
            }
        }
    };

    if (loading) {
        return <Loader message="Signing in..." />;
    }

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                className="flex-1 justify-between px-6 py-8"
            >
                <View className="mt-12">
                    {/* Header */}
                    <View className="mb-12">
                        <Text className={`text-3xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            Welcome Back
                        </Text>
                        <Text className={`text-sm text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Sign in to continue
                        </Text>
                    </View>

                    {/* Inputs */}
                    <View className="space-y-6">
                        {/* Username */}
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
                                    setUsername(text);
                                    setValidationError('');
                                }}
                                autoCapitalize="none"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    if (username) {
                                        pinInput.current?.focus();
                                    }
                                }}
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
                        <View className="mt-12">
                            <TouchableOpacity
                                disabled={loading}
                                onPress={handleLogin}
                                className={`py-4 rounded-xl ${username && pin.length === 4
                                    ? 'bg-indigo-600'
                                    : 'bg-indigo-400 opacity-80'
                                    }`}
                            >
                                <Text className="text-center text-white font-semibold text-base">
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </View>
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
        </SafeAreaView>
    );
}
