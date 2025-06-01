import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
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
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View
} from 'react-native';
import { LoadingButton } from '../components/common/LoadingButton';
import { FormField } from '../components/forms/FromField';
import { Select } from '../components/forms/Select';
import MapPreview from '../components/maps/MapPreview';
import { FORM_INITIAL_STATE } from '../constants/outlet.constants';
import { fetchRoutes } from '../constants/route';
import { useTheme } from '../context/ThemeContextProvider';
import { db } from '../services/firebase/config';


const AddOutlet = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();

  const [formData, setFormData] = useState(FORM_INITIAL_STATE);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [routeOptions, setRouteOptions] = useState([]);

    const [refreshing, setRefreshing] = useState(false);


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


  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. What would you like to do?',
        [
          {
            text: 'Save Draft',
            onPress: async () => {
              await AsyncStorage.setItem('outletFormData', JSON.stringify(formData));
              router.replace('/(tabs)');
            },
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              AsyncStorage.removeItem('outletFormData');
              setFormData(FORM_INITIAL_STATE);
              setLocationConfirmed(false);
              setHasUnsavedChanges(false);
              router.replace('/(tabs)');
            },
          },
          {
            text: 'Continue Editing',
            style: 'cancel',
          },
        ]
      );
    } else {
      router.replace('/(tabs)');
    }
  };

   const updateFormField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleLocationUpdate = useCallback(async (locationData) => {
    if (!locationData) return;
    setLocationLoading(true);
    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: locationData.latitude,
        longitude: locationData.longitude
      });

      const formattedAddress = [
        address.street,
        address.city,
        address.region
      ].filter(Boolean).join(', ');

      const updatedLocation = {
        ...locationData,
        address: formattedAddress
      };

      setFormData(prev => ({
        ...prev,
        location: updatedLocation,
        formattedAddress: formattedAddress,
        street: prev.street || address.street || '',
        locality: prev.locality || address.city || ''
      }));

      setLocationConfirmed(true);
      setHasUnsavedChanges(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to update location');
    } finally {
      setLocationLoading(false);
    }
  }, []);

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

        const saved = await AsyncStorage.getItem('outletFormData');
        if (saved) {
          const data = JSON.parse(saved);
          setFormData(data);
          if (data.location) setLocationConfirmed(true);
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
          if (data.location) {
            setLocationConfirmed(true);
          }
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

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    updateFormField('phoneNumber', cleaned);
  };

  const phoneExists = async (numberWithPrefix) => {
    const outletsRef = collection(db, 'outlets');
    const q = query(outletsRef, where('phoneNumber', '==', numberWithPrefix));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

   const handleLocationPress = async () => {
    await AsyncStorage.setItem('outletFormData', JSON.stringify(formData));
    router.push({
      pathname: '/screens/MapScreen',
      params: {
        outletId: params.outletId || '',
      }
    });
  };

const handleSubmit = async () => {
  const fullPhoneNumber = formData.phoneNumber ? `+91${formData.phoneNumber}` : '';

  if (!formData.storeName || !fullPhoneNumber || !formData.location || !formData.route) {
    Alert.alert('Missing Information', 'Please fill all required fields and add location');
    return;
  }

  setSaveLoading(true);
  try {
    if (!params.outletId && await phoneExists(fullPhoneNumber)) {
      Alert.alert(
        'Duplicate Entry',
        'An outlet with this phone number already exists.',
        [{ text: 'OK' }]
      );
      return;
    }

    const fullAddress = [
      formData.street,
      formData.locality,
      formData.landmark,
    ].filter(Boolean).join(', ');

    const outletData = {
      propName: `${formData.firstName} ${formData.lastName}`.trim(),
      phoneNumber: fullPhoneNumber,
      storeName: formData.storeName,
      route: formData.route,
      street: formData.street,
      locality: formData.locality,
      landmark: formData.landmark,
      address: fullAddress,
      location: formData.location,
      updatedAt: serverTimestamp(),
    };

    if (params.outletId) {
      await updateDoc(doc(db, 'outlets', params.outletId), outletData);
      Alert.alert('Success', 'Outlet updated successfully');
    } else {
      await addDoc(collection(db, 'outlets'), {
        ...outletData,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Outlet added successfully');
      await AsyncStorage.removeItem('outletFormData');
      setFormData(FORM_INITIAL_STATE);
      setLocationConfirmed(false);
      setHasUnsavedChanges(false);
    }

    router.replace('/(tabs)');
  } catch (err) {
    console.error('Error:', err);
    Alert.alert('Error', 'Failed to save outlet. Please try again.');
  } finally {
    setSaveLoading(false);
  }
};
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset form data
      await AsyncStorage.removeItem('outletFormData');
      setFormData(FORM_INITIAL_STATE);
      setLocationConfirmed(false);
      setHasUnsavedChanges(false);

      // Reset routes
      const routes = await fetchRoutes();
      setRouteOptions(routes);
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh form');
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#ffffff' : '#000000'}
            />
          }
        >
          <FormField
            label="Store Name *"
            value={formData.storeName}
            onChangeText={(value) => updateFormField('storeName', value)}
            placeholder="Enter store name"
            required
          />

          <View className="flex-row gap-2 mb-4">
            <View className="flex-1">
              <FormField
                label="First Name *"
                value={formData.firstName}
                onChangeText={(value) => updateFormField('firstName', value)}
                placeholder="First name"
                required
              />
            </View>
            <View className="flex-1">
              <FormField
                label="Last Name"
                value={formData.lastName}
                onChangeText={(value) => updateFormField('lastName', value)}
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

          <Select
  label="Route *"
  value={formData.route}
  options={routeOptions}
  onChange={(value) => updateFormField('route', value)}
  placeholder="Select route"
  required
/>

          <FormField
            label="Street"
            value={formData.street}
            onChangeText={(value) => updateFormField('street', value)}
            placeholder="Enter street name"
          />

          <FormField
            label="Locality"
            value={formData.locality}
            onChangeText={(value) => updateFormField('locality', value)}
            placeholder="Enter area/locality"
          />

          <FormField
            label="Landmark"
            value={formData.landmark}
            onChangeText={(value) => updateFormField('landmark', value)}
            placeholder="Enter nearby landmark"
          />

          {formData.location && locationConfirmed && (
            <View className="mb-4">
              <MapPreview
                location={{
                  ...formData.location,
                  address: formData.formattedAddress
                }}
                height={200}
                showAddress={true}
              />
            </View>
          )}

          <View className=" mb-4">
            <LoadingButton
              text={locationConfirmed ? 'Update Location' : 'Add Location *'}
              onPress={handleLocationPress}
              loading={locationLoading}
              variant="success"
              disabled={locationLoading}
              className="w-full "
            />

            <View className="flex-row gap-4 mt-3">
              <LoadingButton
                text="Cancel"
                onPress={handleCancel}
                variant="secondary"
                className="flex-1 w-full"

              />
              <LoadingButton
                text={params.outletId ? 'Update Outlet' : 'Save Outlet'}
                loading={saveLoading}
                onPress={handleSubmit}
                disabled={
                  !formData.storeName ||
                  !formData.phoneNumber ||
                  !formData.location ||
                  !formData.route ||
                  locationLoading
                }
                className="flex-1 w-full"
              />
            </View>
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AddOutlet;