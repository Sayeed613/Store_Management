import { collection, getDocs } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/firebase/config';

// Create context with default values
const AuthContext = createContext({
  user: null,
  loading: false,
  error: '',
  login: async () => false,
  logout: () => {},
  isAdmin: false
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug effect to monitor user state changes
  useEffect(() => {
    if (user) {
      console.log('AuthContext - User State Update:', {
        name: user.name,
        userType: user.userType,
        rawUserType: String(user.userType),
        normalizedUserType: user.userType?.toLowerCase?.() || '',
        isAdmin: user.userType?.toLowerCase?.() === 'admin',
        timestamp: new Date().toISOString(),
        state: 'context-update'
      });
    } else {
      console.log('AuthContext - User State Update: No user');
    }
  }, [user]);

  const login = async (username, pin) => {
    try {
      setLoading(true);
      setError('');
      console.log('Login attempt:', { username, pin, timestamp: new Date().toISOString() });

      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);

      // Find user with case-insensitive name match
      const userDoc = querySnapshot.docs.find(doc => {
        const userData = doc.data();
        const storedName = (userData.name || '').trim().toLowerCase();
        const inputName = username.trim().toLowerCase();
        const storedPin = (userData.pin || '').trim();

        return storedName === inputName && storedPin === pin;
      });

      if (!userDoc) {
        console.log('No matching user found');
        setError('Invalid credentials');
        return false;
      }

      const userData = {
        id: userDoc.id,
        ...userDoc.data()
      };

      // Clean up the user data
      userData.name = userData.name.trim();
      // Make sure to remove any newlines and properly trim userType
      userData.userType = userData.userType.replace(/\n/g, '').trim().toLowerCase();

      // Validate userType
      if (userData.userType !== 'admin' && userData.userType !== 'salesman') {
        console.error('Invalid user type:', userData.userType);
        setError('Invalid user type');
        return false;
      }

      console.log('Setting user with data:', {
        name: userData.name,
        userType: userData.userType,
        isAdmin: userData.userType === 'admin'
      });

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

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      isAdmin: user?.userType === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};