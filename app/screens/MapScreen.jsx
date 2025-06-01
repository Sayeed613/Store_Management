
import * as Location from 'expo-location';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
import LocationMap from '../components/maps/LocationMap';

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();



  const initialLocation = params.location
    ? JSON.parse(params.location)
    : {
        latitude: 12.957118,
        longitude: 78.271515,
      };

  const handleLocationSelect = async (location) => {
    if (!location) return;

    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const locationData = {
        ...location,
        address: `${address.street || ''}, ${address.city || ''}`,
      };

      if (params.outletId) {
        router.back();
        router.setParams({
          location: JSON.stringify(locationData),
          outletId: params.outletId
        });
      } else {
        router.push({
          pathname: '/(tabs)/add-outlet',
          params: {
            location: JSON.stringify(locationData)
          }
        });
      }
    } catch (error) {
      console.error('Error getting address:', error);
      Alert.alert('Error', 'Failed to get location address');
    }
  };

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <LocationMap
        initialLocation={initialLocation}
        onLocationSelect={handleLocationSelect}
        onCancel={() => router.back()}
        showAddress={true}
      />
    </View>
  );
}
