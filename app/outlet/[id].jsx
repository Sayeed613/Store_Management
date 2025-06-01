import { Stack } from 'expo-router';
import OutletDetail from '../components/outlet/OutletDetails';

export default function OutletDetailsPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'card'
        }}
      />
      <OutletDetail />
    </>
  );
}