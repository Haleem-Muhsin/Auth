import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useEffect, useState } from 'react';
import { database, firestore } from './firebase';
import { ref, onValue } from 'firebase/database';
import { doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

interface Location {
  latitude: number;
  longitude: number;
}

export default function Tracking() {
  const params = useLocalSearchParams();
  const ambulanceId = params.ambulanceId as string;
  const customerEmail = params.customerEmail as string;
  const bookingId = params.bookingId as string;
  const router = useRouter();
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [isNearCustomer, setIsNearCustomer] = useState(false);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  useEffect(() => {
    // Listen to driver's location
    const driverRef = ref(database, `drivers/${ambulanceId}`);
    const unsubscribeDriver = onValue(driverRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    // Listen to customer's location
    const customerRef = ref(database, `customers/${customerEmail.replace('.', ',')}`);
    const unsubscribeCustomer = onValue(customerRef, (snapshot) => {
      const data = snapshot.val();
      console.log("customer location",data);
      
      if (data) {
        setCustomerLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    return () => {
      unsubscribeDriver();
      unsubscribeCustomer();
    };
  }, [ambulanceId, customerEmail]);

  // Check if driver is near customer
  useEffect(() => {
    if (driverLocation && customerLocation) {
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
      // If distance is less than 100 meters (0.1 km)
      setIsNearCustomer(distance < 0.1);
    }
  }, [driverLocation, customerLocation]);

  const handleCompleteTask = async () => {
    try {
      // Update booking status in Firestore
      await updateDoc(doc(firestore, 'bookings', bookingId), {
        status: 'completed',
        completedAt: Date.now()
      });
      Alert.alert('Success', 'Task completed successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Could not complete the task');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={customerLocation ? {
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : {
          latitude: 9.728454579963863,
          longitude: 76.72728729002546,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Customer Location"
          >
            <Ionicons name="person" size={30} color="#4CAF50" />
          </Marker>
        )}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Ambulance Location"
          >
            <Ionicons name="medical" size={30} color="#F44336" />
          </Marker>
        )}
      {
        driverLocation&&customerLocation&&(
          <Polyline
            coordinates={[driverLocation, customerLocation]}
            strokeColor="#000"
            strokeWidth={2}
          />
        )
      }
      </MapView>
      <Pressable 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>
      
      {isNearCustomer && (
        <Pressable 
          style={styles.completeButton}
          onPress={handleCompleteTask}
        >
          <Text style={styles.completeButtonText}>Complete Task</Text>
        </Pressable>
      )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completeButton: {
    position: 'absolute',
    bottom: 30,
    left: '10%',
    right: '10%',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
}); 