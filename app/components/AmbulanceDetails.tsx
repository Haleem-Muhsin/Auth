import { View, Text, StyleSheet, Pressable, Linking, Modal, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ambulance } from '../types/ambulance';
import * as Location from 'expo-location';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ref, set } from 'firebase/database';
import { database, auth, firestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AmbulanceDetailsProps {
  ambulance: Ambulance;
  isVisible: boolean;
  onClose: () => void;
}

export default function AmbulanceDetails({ ambulance, isVisible, onClose }: AmbulanceDetailsProps) {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const handleCall = () => {
    Linking.openURL(`tel:${ambulance.phoneNumber}`);
  };

  const getPriceRange = (type: string) => {
    switch (type) {
      case 'Basic':
        return '₹15/km';
      case 'Advanced':
        return '₹25/km';
      case 'ICU':
        return '₹40/km';
      default:
        return '₹15/km';
    }
  };

  const handleBookNow = async () => {
    try {
      if (!auth.currentUser?.email) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      // Store customer location in realtime database
      const customerRef = ref(database, `customers/${auth.currentUser.email.replace('.', ',')}`);
      await set(customerRef, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        lastUpdated: Date.now(),
        requestedAmbulanceId: ambulance.id,
        status: 'waiting'
      });

      // Create booking in Firestore
      const bookingRef = doc(firestore, 'bookings', `${auth.currentUser.email}_${Date.now()}`);
      await setDoc(bookingRef, {
        customerId: auth.currentUser.email,
        ambulanceId: ambulance.id,
        status: 'pending',
        timestamp: Date.now(),
        customerLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      });

      Alert.alert(
        'Confirm Booking',
        `Book ${ambulance.type} ambulance from ${ambulance.hospital}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Confirm', 
            onPress: () => {
              router.push({
                pathname: "/tracking",
                params: { 
                  ambulanceId: ambulance.id,
                  userLat: location.coords.latitude,
                  userLng: location.coords.longitude
                }
              });
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Could not process booking');
    }
  };

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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>Ambulance Details</Text>
                <Pressable onPress={onClose}>
                  <Ionicons name="close" size={24} color="#294B29" />
                </Pressable>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <Ionicons name="car" size={24} color="#294B29" />
                  <Text style={styles.detailText}>
                    {ambulance.id} - {ambulance.type} Ambulance
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="person" size={24} color="#294B29" />
                  <Text style={styles.detailText}>{ambulance.driver}</Text>
                </View>

                <Pressable style={styles.phoneRow} onPress={handleCall}>
                  <Ionicons name="call" size={24} color="#294B29" />
                  <Text style={[styles.detailText, styles.phoneNumber]}>
                    {ambulance.phoneNumber}
                  </Text>
                  <Text style={styles.callText}>(Tap to call)</Text>
                </Pressable>

                <View style={styles.detailRow}>
                  <Ionicons name="medical" size={24} color="#294B29" />
                  <Text style={styles.detailText}>{ambulance.hospital}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="pricetag" size={24} color="#294B29" />
                  <Text style={styles.detailText}>
                    Base Price: {getPriceRange(ambulance.type || 'Basic')}
                  </Text>
                </View>

                <View style={[styles.detailRow, styles.statusRow]}>
                  <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.statusText}>Available Now</Text>
                </View>
              </View>

              <Pressable style={styles.bookButton} onPress={handleBookNow}>
                <Text style={styles.bookButtonText}>Book Now</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#294B29',
  },
  detailsContainer: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  phoneNumber: {
    color: '#294B29',
    textDecorationLine: 'underline',
  },
  callText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  statusRow: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: '#294B29',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 