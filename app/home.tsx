import { View, StyleSheet, SafeAreaView, Pressable, Alert, Dimensions, Animated, Text, ScrollView, BackHandler, Platform, Linking } from 'react-native';
import AmbulanceList from './components/AmbulanceList';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { auth, firestore, database } from './firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Ambulance } from './types/ambulance';
import * as Location from 'expo-location';
import { ref, onValue, set } from 'firebase/database';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

const customMapStyle = [
  {
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#7c93a3"
      },
      {
        "lightness": "-10"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry",
    "stylers": [
      {
        "visibility": "on"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#c2d1d6"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#f1f6f8"
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#c2d1d6"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#e3e8eb"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#c2d1d6"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [
      {
        "color": "#c2d1d6"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#b3d2e5"
      }
    ]
  }
];

export default function Home() {
  const router = useRouter();
  const navigation = useNavigation();
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const [nearbyAmbulances, setNearbyAmbulances] = useState<Ambulance[]>([]);
  const [driverLocations, setDriverLocations] = useState<{[key: string]: {latitude: number; longitude: number}}>({});

  useEffect(() => {
    const ambulancesRef = collection(firestore, 'ambulances');
    const unsubscribe = onSnapshot(ambulancesRef, (snapshot) => {
      const ambulanceData = snapshot.docs.map(doc => ({
        id: doc.id,
        driverEmail: doc.id,
        ...doc.data()
      })) as Ambulance[];
      
      setAmbulances(ambulanceData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const driversRef = ref(database, 'drivers');
    const unsubscribe = onValue(driversRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDriverLocations(data);
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'ios') {
        // Disable the swipe back gesture
        navigation.setOptions({
          gestureEnabled: false,
        });
      }
    }, [navigation])
  );

  // Keep the Android back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Only show sign out prompt if we're on the home page and user is signed in
      const currentUser = auth.currentUser;
      if (currentUser && router.canGoBack()) {
        Alert.alert(
          'Sign Out',
          'Are you sure you want to sign out?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Sign Out',
              onPress: handleLogout,
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [router]);

  const handleLocationChange = async (from: string, to: string) => {
    try {
      if (from) {
        const fromLocation = await Location.geocodeAsync(from);
        if (fromLocation[0]) {
          setFromCoords({
            latitude: fromLocation[0].latitude,
            longitude: fromLocation[0].longitude,
          });
        }
      }
      if (to) {
        const toLocation = await Location.geocodeAsync(to);
        if (toLocation[0]) {
          setToCoords({
            latitude: toLocation[0].latitude,
            longitude: toLocation[0].longitude,
          });
        }
      }

      // Calculate distance if both coordinates are available
      if (fromCoords && toCoords) {
        const distance = calculateDistance(
          fromCoords.latitude,
          fromCoords.longitude,
          toCoords.latitude,
          toCoords.longitude
        );
        setRouteDistance(distance);
      }
    } catch (error) {
      console.error('Error geocoding addresses:', error);
    }
  };

  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (value: number) => {
    return (value * Math.PI) / 180;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await signOut(auth);
              await AsyncStorage.removeItem('rememberMe');
              router.replace('/index1');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const getMarkerColor = (status: Ambulance['status']) => {
    switch (status) {
      case 'available':
        return 'green';
      case 'busy':
        return 'red';
      case 'offline':
        return 'gray';
      default:
        return 'red';
    }
  };

  const handleAmbulanceSelect = (ambulance: any) => {
    setSelectedAmbulance(ambulance.id);
    // Additional booking logic can be added here
  };

  const toggleExpand = (expand: boolean) => {
    setIsExpanded(expand);
    Animated.timing(slideAnim, {
      toValue: expand ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -Dimensions.get('window').height + 150]
  });

  const handleFindLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location services to continue');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Update map region to focus on user's location
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });

      // Set user's location marker
      setFromCoords({
        latitude,
        longitude,
      });

      // Filter only available ambulances
      const availableAmbulances = ambulances.filter(ambulance => 
        ambulance.status === 'available'
      );

      // Sort ambulances by distance
      const sortedAmbulances = availableAmbulances.sort((a, b) => {
        const distanceA = calculateDistance(
          latitude,
          longitude,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          latitude,
          longitude,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      });

      setNearbyAmbulances(sortedAmbulances);
      setIsExpanded(true);

    } catch (error) {
      Alert.alert('Error', 'Could not detect location');
      console.error(error);
    }
  };

  const handleSOS = async () => {
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for emergency services.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };

      // Find nearest available ambulance
      let nearestAmbulance: Ambulance | null = null;
      let shortestDistance = Infinity;

      for (const ambulance of ambulances) {
        if (ambulance.status === 'available' && driverLocations[ambulance.driverEmail]) {
          const driverLocation = driverLocations[ambulance.driverEmail];
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            driverLocation.latitude,
            driverLocation.longitude
          );

          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestAmbulance = ambulance;
          }
        }
      }

      if (!nearestAmbulance) {
        Alert.alert('No Ambulances', 'No available ambulances found nearby. Please try again or call emergency services directly.');
        return;
      }

      // Book the ambulance
      const ambulanceRef = doc(firestore, 'ambulances', nearestAmbulance.id);
      await updateDoc(ambulanceRef, {
        status: 'booked',
        currentCustomer: auth.currentUser?.email,
        pickupLocation: userLocation
      });

      // Place call to ambulance
      const phoneNumber = nearestAmbulance.phoneNumber || '911'; // Fallback to emergency services
      const url = `tel:${phoneNumber}`;
      
      Alert.alert(
        'Emergency Response',
        `Ambulance has been dispatched to your location. Connecting call to ${phoneNumber}...`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Call Now',
            onPress: () => {
              Linking.canOpenURL(url)
                .then(supported => {
                  if (supported) {
                    return Linking.openURL(url);
                  }
                })
                .catch(err => console.error('Error placing call:', err));
            },
            style: 'destructive'
          }
        ]
      );
    } catch (error) {
      console.error('Error handling SOS:', error);
      Alert.alert('Error', 'Failed to process emergency request. Please call emergency services directly.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          customMapStyle={customMapStyle}
          initialRegion={{
            latitude: 9.5916,
            longitude: 76.5222,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {fromCoords && (
            <Marker
              coordinate={fromCoords}
              title="Pickup"
              pinColor="green"
            />
          )}
          {toCoords && (
            <Marker
              coordinate={toCoords}
              title="Destination"
              pinColor="red"
            />
          )}
          {fromCoords && toCoords && (
            <Polyline
              coordinates={[fromCoords, toCoords]}
              strokeColor="#294B29"
              strokeWidth={3}
            />
          )}
          {ambulances.map((ambulance) => {
            const driverEmail = ambulance.id.replace(',', '.');
            const driverLocation = driverLocations[driverEmail];
            
            return (
              <Marker
                key={ambulance.id}
                coordinate={{
                  latitude: driverLocation?.latitude || ambulance.latitude,
                  longitude: driverLocation?.longitude || ambulance.longitude
                }}
                title={`Ambulance ${ambulance.id}`}
                description={`Status: ${ambulance.status}`}
              >
                <Ionicons 
                  name="medical" 
                  size={30} 
                  color={getMarkerColor(ambulance.status)} 
                />
              </Marker>
            );
          })}
        </MapView>
      </View>

      <Animated.View 
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY }],
            height: isExpanded ? '50%' : 'auto',
            backgroundColor: '#DBE7C9',
          }
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.headerLeft}>
              <Pressable onPress={handleLogout} style={styles.userIcon}>
                <Ionicons name="person-circle-outline" size={30} color="#294B29" />
              </Pressable>
              <Pressable 
                style={styles.pendingRequestsButton}
                onPress={() => router.push('/pending-requests')}
              >
                <Ionicons name="time-outline" size={24} color="#294B29" />
                <Text style={styles.pendingRequestsText}>Pending Requests</Text>
              </Pressable>
            </View>
            <Pressable 
              style={styles.locationButton}
              onPress={handleFindLocation}
            >
              <Ionicons name="navigate" size={24} color="#294B29" />
              <Text style={styles.locationText}>Find my location</Text>
              <Ionicons name="chevron-forward" size={24} color="#294B29" />
            </Pressable>
          </View>

          {isExpanded && nearbyAmbulances.length > 0 && (
            <AmbulanceList 
            ambulances={nearbyAmbulances} 
            onSelect={handleAmbulanceSelect} 
            userLocation={fromCoords}
          />
          )}
        </View>
      </Animated.View>

      <Pressable
        style={styles.sosButton}
        onPress={handleSOS}
      >
        <Ionicons name="warning" size={24} color="white" />
        <Text style={styles.sosText}>SOS</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 15,
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#000',
    opacity: 0.2,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 15,
  },
  contentContainer: {
    flex: 1,
  },
  ambulanceListContainer: {
    flex: 1,
    marginTop: 20,
  },
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 25,
    zIndex: 2,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  userIcon: {
    padding: 5,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginLeft: 15,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  ambulanceList: {
    flex: 1,
    marginTop: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#294B29',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  ambulanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  ambulanceInfo: {
    marginLeft: 15,
    flex: 1,
  },
  ambulanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ambulanceSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  pendingRequestsButton: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginLeft: Platform.OS === 'android' ? 15 : 10
  },
  pendingRequestsText: {
    fontSize: 14,
    color: '#294B29',
    marginLeft: 5
  },
  sosButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 60,
    right: 20,
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sosText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
    fontSize: 16,
  },
}); 