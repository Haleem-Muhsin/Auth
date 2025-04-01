import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
      where('status', '==', 'pending')
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

  const handleAcceptBooking = (booking: Booking & { id: string }) => {
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
          <Text style={styles.noBookings}>No pending bookings</Text>
        ) : (
          bookings.map((booking) => (
            <Pressable 
              key={booking.id} 
              style={styles.bookingCard}
              onPress={() => handleAcceptBooking(booking)}
            >
              <View style={styles.bookingInfo}>
                <Text style={styles.customerName}>Customer: {booking.customerId}</Text>
                <Text style={styles.timestamp}>
                  {new Date(booking.timestamp).toLocaleString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#294B29" />
            </Pressable>
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
    padding: 20
  },
  noBookings: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16
  },
  bookingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10
  },
  bookingInfo: {
    flex: 1
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5
  },
  timestamp: {
    color: '#666',
    fontSize: 14
  }
}); 