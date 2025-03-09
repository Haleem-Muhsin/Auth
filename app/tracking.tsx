import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useEffect, useState } from 'react';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

interface Location {
  latitude: number;
  longitude: number;
}

export default function Tracking() {
  const { ambulanceId, userLat, userLng } = useLocalSearchParams();
  const router = useRouter();
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [customerLocation, setCustomerLocation] = useState<Location>({
    latitude: Number(userLat),
    longitude: Number(userLng)
  });

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

    return () => {
      unsubscribeDriver();
    };
  }, [ambulanceId]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: Number(userLat),
          longitude: Number(userLng),
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Your Location"
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
      </MapView>
      <Pressable 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
}); 