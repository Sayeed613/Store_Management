import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const LocationMap = ({ initialLocation, onLocationSelect, onCancel }) => {
  const mapRef = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
         timeout: 2000, 
        maximumAge: 2000,
      });

      const currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setSelectedLocation(currentLocation);

      mapRef.current?.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        },
        1000
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
  ref={mapRef}
  provider={PROVIDER_GOOGLE}
  style={styles.map}
  initialRegion={{
    ...selectedLocation,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  }}
  showsUserLocation={true}
  showsMyLocationButton={false}
/>

      <SafeAreaView edges={['top']} style={styles.topButtons}>
        <Pressable onPress={onCancel} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#374151" />
        </Pressable>

        <Pressable
          onPress={getCurrentLocation}
          style={[styles.locationButton, loading && styles.locationButtonDisabled]}
          disabled={loading}
        >
          <MaterialIcons
            name="my-location"
            size={24}
            color="#0066ff"
            style={{ opacity: loading ? 0.5 : 1 }}
          />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottomButtons}>
        <View style={styles.buttonRow}>
          <Pressable onPress={onCancel} style={[styles.button, styles.cancelButton]}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => onLocationSelect(selectedLocation)}
            style={[styles.button, styles.confirmButton]}
          >
            <Text style={styles.confirmText}>Confirm Location</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  locationButtonDisabled: {
    opacity: 0.7,
  },
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cancelButton: {
    backgroundColor: 'white',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  cancelText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
  confirmText: {
    textAlign: 'center',
    fontWeight: '600',
    color: 'white',
  },
});

export default LocationMap;
