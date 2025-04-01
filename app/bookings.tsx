import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from './types/booking';

export default function Bookings() {
  const [bookings, setBookings] = useState<(Booking & { id: string })[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser?.email) return;

    const bookingsRef = collection(firestore, 'bookings');
    const q = query(
      bookingsRef,
      where('ambulanceId', '==', auth.currentUser.email),
      where('status', 'in', ['pending', 'accepted'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Booking & { id: string })[];
      setBookings(newBookings);
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptBooking = async (booking: Booking & { id: string }) => {
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), {
        status: 'accepted'
      });
      Alert.alert('Success', 'Booking request accepted');
    } catch (error) {
      Alert.alert('Error', 'Could not accept booking');
    }
  };

  const handleRejectBooking = async (booking: Booking & { id: string }) => {
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), {
        status: 'rejected'
      });
      Alert.alert('Success', 'Booking request rejected');
    } catch (error) {
      Alert.alert('Error', 'Could not reject booking');
    }
  };

  const handleTrackBooking = (booking: Booking & { id: string }) => {
    router.push({
      pathname: "/tracking",
      params: {
        bookingId: booking.id,
        customerEmail: booking.customerId,
        userLat: booking.pickupLocation.latitude,
        userLng: booking.pickupLocation.longitude
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#294B29" />
        </Pressable>
        <Text style={styles.title}>Booking Requests</Text>
      </View>

      <ScrollView style={styles.bookingList}>
        {bookings.length === 0 ? (
          <Text style={styles.noBookings}>No bookings</Text>
        ) : (
          bookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingInfo}>
                <Text style={styles.customerName}>Customer: {booking.customerId}</Text>
                <Text style={styles.timestamp}>
                  Requested on: {new Date(booking.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.vehicleType}>
                  Vehicle Type: {booking.vehicleType}
                </Text>
                <Text style={styles.status}>
                  Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                {booking.status === 'pending' ? (
                  <>
                    <Pressable 
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectBooking(booking)}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptBooking(booking)}
                    >
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable 
                    style={[styles.actionButton, styles.trackButton]}
                    onPress={() => handleTrackBooking(booking)}
                  >
                    <Text style={styles.actionButtonText}>Track</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backButton: {
    marginRight: 15
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#294B29'
  },
  bookingList: {
    flex: 1,
    padding: 15
  },
  noBookings: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  bookingInfo: {
    marginBottom: 15
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  vehicleType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center'
  },
  acceptButton: {
    backgroundColor: '#4CAF50'
  },
  rejectButton: {
    backgroundColor: '#f44336'
  },
  trackButton: {
    backgroundColor: '#294B29'
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
}); 