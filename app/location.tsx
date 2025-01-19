import LocationPage from './components/LocationPage';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function Location() {
  const router = useRouter();
  const { from, to } = useLocalSearchParams();
  
  return (
    <LocationPage 
      ambulances={[]} // Pass your ambulances here
      initialFrom={from as string}
      initialTo={to as string}
      onLocationSelect={(from, to) => {
        // Handle location selection
        router.back();
      }}
    />
  );
} 