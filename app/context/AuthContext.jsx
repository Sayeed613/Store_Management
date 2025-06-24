import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/firebase/config';

const AuthContext = createContext({
  user: null,
  loading: false,
  error: '',
  login: async () => false,
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const SESSION_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedData = await AsyncStorage.getItem('authUser');
      if (!storedData) {
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(storedData);
      const isExpired = Date.now() > parsed.expiry;

      if (isExpired) {
        await AsyncStorage.removeItem('authUser');
        setUser(null);
      } else {
        setUser(parsed.user);
      }
    } catch (err) {
      console.error('Error restoring session:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, pin) => {
  try {
    setLoading(true);
    setError('');

    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);

    const userDoc = querySnapshot.docs.find((doc) => {
      const userData = doc.data();
      return (
        userData.username?.trim().toLowerCase() === username.trim().toLowerCase() &&
        userData.pin?.trim() === pin.trim()
      );
    });

    if (!userDoc) {
      console.log('No matching user found for:', username);
      setError('Invalid credentials');
      return false;
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    };

    const type = userData.userType?.toLowerCase?.();

    if (type !== 'admin' && type !== 'salesman') {
      console.error('Invalid user type:', userData.userType);
      setError('Invalid user type');
      return false;
    }

    const expiry = Date.now() + 3 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('authUser', JSON.stringify({ user: userData, expiry }));

    setUser(userData);
    return true;
  } catch (err) {
    console.error('Login error:', err);
    setError('Login failed: ' + err.message);
    return false;
  } finally {
    setLoading(false);
  }
};


  const logout = async () => {
    await AsyncStorage.removeItem('authUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAdmin: user?.userType?.toLowerCase() === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
