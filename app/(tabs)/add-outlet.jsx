import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import PinModal from '../components/Aunthentication/PinModal';
import { LoadingButton } from '../components/common/LoadingButton';
import { FormField } from '../components/forms/FromField';
import { Select } from '../components/forms/Select';
import MapPreview from '../components/maps/MapPreview';
import { FORM_INITIAL_STATE } from '../constants/outlet.constants';
import { fetchRoutes } from '../constants/route';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';

const AddOutlet = () => {
  // State and hooks initialization
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  const [formData, setFormData] = useState(FORM_INITIAL_STATE);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [routeOptions, setRouteOptions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValues, setPinValues] = useState(['', '', '', '']);
  const [existingOutlet, setExistingOutlet] = useState(null);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const routes = await fetchRoutes();
        setRouteOptions(routes);
      } catch (err) {
        console.error('Failed to load routes:', err);
        Alert.alert('Error', 'Could not fetch route options');
      }
    };
    loadRoutes();
  }, []);

  const resetForm = useCallback(() => {
    setFormData(FORM_INITIAL_STATE);
    setLocationConfirmed(false);
    setLocationLoading(false);
    setSaveLoading(false);
    setHasUnsavedChanges(false);
    AsyncStorage.removeItem('outletFormData');
  }, []);

  const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    updateFormField('phoneNumber', cleaned);
  };

  const handleCreditLimitChange = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    updateFormField('creditLimit', cleaned);
    if (params.outletId) {
      debouncedCreditLimitUpdate(cleaned);
    }
  };

  const debouncedCreditLimitUpdate = useCallback(
    debounce(async (newLimit) => {
      if (!params.outletId) return;
      try {
        await updateDoc(doc(db, 'outlets', params.outletId), {
          creditLimit: newLimit,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to auto-save credit limit:', error);
      }
    }, 1000),
    [params.outletId]
  );

  const handleLocationUpdate = useCallback(async (locationData) => {
    if (!locationData) return;
    setLocationLoading(true);
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });

      setFormData(prev => ({
        ...prev,
        location: locationData,
        street: address.street || prev.street || '',
        locality: address.city || prev.locality || '',
        formattedAddress: [address.street, address.city, address.region].filter(Boolean).join(', ')
      }));

      setLocationConfirmed(true);
      setHasUnsavedChanges(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setLocationLoading(false);
    }
  }, []);

  const handleLocationPress = async () => {
    await AsyncStorage.setItem('outletFormData', JSON.stringify(formData));
    router.push({
      pathname: '/screens/MapScreen',
      params: { outletId: params.outletId || '' }
    });
  };

  const phoneExists = async (numberWithPrefix) => {
    const outletsRef = collection(db, 'outlets');
    const q = query(outletsRef, where('phoneNumber', '==', numberWithPrefix));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return {
        exists: true,
        outlet: { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
      };
    }
    return { exists: false, outlet: null };
  };

  const verifyPinAndActivate = async (enteredPin) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const matchingUser = users.find(user => user.pin === enteredPin);

      if (matchingUser) {
        const outletData = {
          propName: `${formData.firstName} ${formData.lastName}`.trim(),
          phoneNumber: `+91${formData.phoneNumber}`,
          storeName: formData.storeName,
          route: formData.route,
          street: formData.street || '',
          locality: formData.locality || '',
          landmark: formData.landmark || '',
          address: [formData.street, formData.locality, formData.landmark].filter(Boolean).join(', '),
          location: formData.location,
          creditLimit: formData.creditLimit || '0',
          status: 'active',
          updatedAt: serverTimestamp(),
          reactivatedBy: matchingUser.id,
          reactivatedAt: serverTimestamp()
        };

        Object.keys(outletData).forEach(key =>
          outletData[key] === undefined && delete outletData[key]
        );

        await updateDoc(doc(db, 'outlets', existingOutlet.id), outletData);
        Alert.alert('Success', 'Outlet has been reactivated');
        setShowPinModal(false);
        setPinValues(['', '', '', '']);
        setExistingOutlet(null);
        resetForm();
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Incorrect PIN');
        setPinValues(['', '', '', '']);
      }
    } catch (error) {
      console.error('PIN verification failed:', error);
      Alert.alert('Error', 'Failed to verify PIN');
      setPinValues(['', '', '', '']);
    }
  };

  const handleSubmit = async () => {
    const fullPhoneNumber = formData.phoneNumber ? `+91${formData.phoneNumber}` : '';

    if (!formData.storeName || !fullPhoneNumber || !formData.location || !formData.route || !formData.creditLimit) {
      Alert.alert(
        'Missing Information',
        'Please fill all required fields including store name, phone number, location, route and credit limit'
      ); return;
    }

    setSaveLoading(true);
    try {
      if (!params.outletId) {
        const { exists, outlet } = await phoneExists(fullPhoneNumber);
        if (exists) {
          if (outlet.status === 'inactive') {
            setExistingOutlet(outlet);
            Alert.alert(
              'Inactive Outlet Found',
              'This outlet exists but is inactive. Would you like to reactivate it?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => {
                    setSaveLoading(false);
                    setExistingOutlet(null);
                  }
                },
                {
                  text: 'Reactivate',
                  onPress: () => {
                    setSaveLoading(false);
                    setShowPinModal(true);
                  }
                }
              ]
            );
            return;
          } else {
            Alert.alert('Duplicate Entry', 'An active outlet with this phone number already exists.');
            setSaveLoading(false);
            return;
          }
        }
      }

      const outletData = {
        propName: `${formData.firstName} ${formData.lastName}`.trim(),
        phoneNumber: fullPhoneNumber,
        storeName: formData.storeName,
        route: formData.route,
        street: formData.street,
        locality: formData.locality,
        landmark: formData.landmark,
        address: [formData.street, formData.locality, formData.landmark].filter(Boolean).join(', '),
        location: formData.location,
        creditLimit: formData.creditLimit,
        status: 'active',
        updatedAt: serverTimestamp()
      };

      if (params.outletId) {
        await updateDoc(doc(db, 'outlets', params.outletId), outletData);
        Alert.alert('Success', 'Outlet updated successfully');
      } else {
        await addDoc(collection(db, 'outlets'), {
          ...outletData,
          createdAt: serverTimestamp()
        });
        Alert.alert('Success', 'Outlet added successfully');
        resetForm();
      }

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to save outlet');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await AsyncStorage.removeItem('outletFormData');
      setFormData(FORM_INITIAL_STATE);
      setLocationConfirmed(false);
      setHasUnsavedChanges(false);
      const routes = await fetchRoutes();
      setRouteOptions(routes);
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh form');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              resetForm();
              router.back();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  useFocusEffect(
    useCallback(() => {
      const checkLocation = async () => {
        if (params.location) {
          try {
            const locationData = JSON.parse(params.location);
            handleLocationUpdate(locationData);
            router.setParams({ location: null });
          } catch (error) {
            console.error('Failed to parse location:', error);
          }
        }
      };
      checkLocation();
    }, [params.location])
  );

  useEffect(() => {
    const loadSavedData = async () => {
      if (!params.outletId) {
        const saved = await AsyncStorage.getItem('outletFormData');
        if (saved) {
          const data = JSON.parse(saved);
          setFormData(data);
          if (data.location) setLocationConfirmed(true);
        }
      }
    };
    loadSavedData();
  }, [params.outletId]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (hasUnsavedChanges) {
          handleCancel();
          return true;
        }
        return false;
      }
    );
    return () => subscription.remove();
  }, [hasUnsavedChanges]);

  // Render
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-gray-100'}`}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 ,
            paddingBottom: 70
          }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#60A5FA' : '#2563EB'}
            />
          }
        >
          {/* Form Fields */}
          <FormField
            label="Store Name *"
            value={formData.storeName}
            onChangeText={(val) => updateFormField('storeName', val)}
            required
            placeholder="Enter store name"
          />

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <FormField
                label="First Name *"
                value={formData.firstName}
                onChangeText={(val) => updateFormField('firstName', val)}
                required
                placeholder="First name"
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Last Name"
                value={formData.lastName}
                onChangeText={(val) => updateFormField('lastName', val)}
                placeholder="Last name"
              />
            </View>
          </View>

          <FormField
            label="Phone Number *"
            value={formData.phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder="Enter 10-digit number"
            keyboardType="phone-pad"
            maxLength={10}
            required
          />

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <Select
                label="Route *"
                value={formData.route}
                options={routeOptions}
                onChange={(val) => updateFormField('route', val)}
                required
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Street"
                value={formData.street}
                onChangeText={(val) => updateFormField('street', val)}
                placeholder="Street"
              />
            </View>
          </View>

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <FormField
                label="Locality"
                value={formData.locality}
                onChangeText={(val) => updateFormField('locality', val)}
                placeholder="Locality"
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Landmark"
                value={formData.landmark}
                onChangeText={(val) => updateFormField('landmark', val)}
                placeholder="Landmark"
              />
            </View>
          </View>

          <FormField
            label="Credit Limit *"
            value={formData.creditLimit}
            onChangeText={handleCreditLimitChange}
            placeholder="Enter credit limit"
            keyboardType="numeric"
            required
          />

          {formData.location && locationConfirmed && (
            <View className="mb-4">
              <MapPreview
                location={{
                  ...formData.location,
                  address: formData.formattedAddress
                }}
                height={200}
                showAddress
              />
            </View>
          )}

          <View className="mb-4">
            <LoadingButton
              text={locationConfirmed ? 'Update Location' : 'Add Location *'}
              onPress={handleLocationPress}
              loading={locationLoading}
              variant="success"
              disabled={locationLoading}
              className="w-full"
            />

            <View className="flex-row gap-4 mt-3">
              <LoadingButton
                text="Cancel"
                onPress={handleCancel}
                variant="secondary"
                className="flex-1"
              />
              <LoadingButton
                text={params.outletId ? 'Update' : 'Save'}
                loading={saveLoading}
                onPress={handleSubmit}
                className="flex-1"
                disabled={
                  !formData.storeName ||
                  !formData.phoneNumber ||
                  !formData.location ||
                  !formData.route ||
                  !formData.creditLimit ||
                  locationLoading
                }
              />
            </View>
          </View>
        </ScrollView>
      </View>
      <Modal
        isVisible={showPinModal}
        backdropOpacity={0.5}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriver
        hideModalContentWhileAnimating
        style={{ margin: 0 }}
        statusBarTranslucent
        onBackdropPress={() => {
          setShowPinModal(false);
          setPinValues(['', '', '', '']);
          setExistingOutlet(null);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center items-center px-4">
            <View
              className={`p-8 rounded-3xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl w-full max-w-[320px]`}
            >
              <View className="mb-6">
                <Text
                  className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}
                >
                  Enter PIN to Reactivate
                </Text>
                <Text
                  className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                >
                  Please enter your PIN to reactivate this outlet
                </Text>
              </View>

              <View className="items-center">
                <PinModal
                  values={pinValues}
                  onChange={(index, value) => {
                    const newPinValues = [...pinValues];
                    newPinValues[index] = value;
                    setPinValues(newPinValues);

                    if (index === 3 && value !== '') {
                      verifyPinAndActivate(newPinValues.join(''));
                    }
                  }}
                  isDark={isDark}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default AddOutlet;