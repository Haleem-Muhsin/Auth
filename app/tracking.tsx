import { View, StyleSheet, Text, Dimensions, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

interface Location {
  latitude: number;
  longitude: number;
}

export default function Tracking() {
  const router = useRouter();
  const { ambulanceId, userLat, userLng } = useLocalSearchParams();
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);

  useEffect(() => {
    if (!ambulanceId) return;

    // Convert ambulanceId to match the format used in the database
    const driverEmail = ambulanceId.toString().replace('.', ',');
    const driverRef = ref(database, `drivers/${driverEmail}`);

    const unsubscribe = onValue(driverRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
      }
    });

    return () => unsubscribe();
  }, [ambulanceId]);

  const initialRegion = {
    latitude: parseFloat(userLat as string),
    longitude: parseFloat(userLng as string),
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Customer Location */}
        <Marker
          coordinate={{
            latitude: parseFloat(userLat as string),
            longitude: parseFloat(userLng as string),
          }}
          title="Customer Location"
        >
          <View style={styles.markerContainer}>
            <Ionicons name="location" size={30} color="#294B29" />
          </View>
        </Marker>

        {/* Driver Location */}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver Location"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="car" size={30} color="#294B29" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
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
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
}); 