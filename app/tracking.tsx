import { View, StyleSheet, Text, Dimensions, Pressable } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAVZAf7LiDv1vhup7V6PQgKCBTefxsaGt0'

interface Location {
  latitude: number;
  longitude: number;
}

export default function Tracking() {
  const router = useRouter();
  const { ambulanceId, userLat, userLng } = useLocalSearchParams();
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const mapRef = useRef<MapView>(null);

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
        ref={mapRef}
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

        {/* Directions between driver and customer */}
        {driverLocation && (
          <MapViewDirections
            origin={driverLocation}
            destination={{
              latitude: parseFloat(userLat as string),
              longitude: parseFloat(userLng as string),
            }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor="#294B29"
            onReady={result => {
              setRouteInfo({
                distance: `${result.distance.toFixed(1)} km`,
                duration: `${Math.ceil(result.duration)} min`
              });
              
              // Fit the map to show both markers and the route
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: 100,
                  right: 50,
                  bottom: 100,
                  left: 50
                },
                animated: true
              });
            }}
          />
        )}
      </MapView>

      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </Pressable>

      {/* Route Information */}
      {routeInfo && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>Distance: {routeInfo.distance}</Text>
          <Text style={styles.routeText}>ETA: {routeInfo.duration}</Text>
        </View>
      )}
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
  },
  routeInfo: {
    position: 'absolute',
    top: 100,
    left: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeText: {
    fontSize: 16,
    color: '#294B29',
    marginBottom: 5,
    fontWeight: '500',
  }
}); 