import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import MapView, { Marker, LatLng } from 'react-native-maps';
import { useEffect, useState } from 'react';
import { database, firestore } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DriverTrackingProps {
  bookingId: string;
  customerEmail: string;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function DriverTracking({ bookingId, customerEmail, initialRegion }: DriverTrackingProps) {
  const router = useRouter();
  const [customerLocation, setCustomerLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const customerRef = ref(database, `customers/${customerEmail.replace('.', ',')}`);
    const unsubscribe = onValue(customerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCustomerLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    return () => unsubscribe();
  }, [customerEmail]);

  const handleCompleteRide = async () => {
    try {
      await updateDoc(doc(firestore, 'bookings', bookingId), {
        status: 'completed',
        completedAt: Date.now()
      });
      Alert.alert('Success', 'Ride completed successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Could not complete ride');
    }
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {customerLocation && (
          <Marker 
            coordinate={{
              latitude: customerLocation.latitude,
              longitude: customerLocation.longitude
            }} 
            title="Customer Location"
          >
            <Ionicons name="person" size={30} color="#4CAF50" />
          </Marker>
        )}
      </MapView>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>
      <Pressable style={styles.completeButton} onPress={handleCompleteRide}>
        <Text style={styles.completeButtonText}>Complete Ride</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#294B29',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
  },
  completeButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#294B29',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
}); 