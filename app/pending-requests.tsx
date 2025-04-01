import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from './types/booking';

export default function PendingRequests() {
  const [requests, setRequests] = useState<(Booking & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser?.email) return;

    const bookingsRef = collection(firestore, 'bookings');
    const q = query(
      bookingsRef,
      where('customerId', '==', auth.currentUser.email),
      where('status', 'in', ['pending', 'accepted'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Booking & { id: string })[];
      setRequests(newRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCancelRequest = async (requestId: string) => {
    try {
      const bookingRef = doc(firestore, 'bookings', requestId);
      await updateDoc(bookingRef, {
        status: 'cancelled'
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleTrackAmbulance = (request: Booking & { id: string }) => {
    router.push({
      pathname: "/tracking",
      params: {
        ambulanceId: request.ambulanceId,
        userLat: request.pickupLocation.latitude,
        userLng: request.pickupLocation.longitude
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#294B29" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#294B29" />
        </Pressable>
        <Text style={styles.title}>Pending Requests</Text>
      </View>

      <ScrollView style={styles.requestList}>
        {requests.length === 0 ? (
          <Text style={styles.noRequests}>No pending requests</Text>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestInfo}>
                <View style={styles.vehicleInfo}>
                  <Ionicons name="car" size={20} color="#294B29" />
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleText}>
                      Vehicle ID: {request.ambulanceId}
                    </Text>
                    <Text style={styles.vehicleType}>
                      Type: {request.vehicleType || 'Standard Ambulance'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.timestamp}>
                  Requested on: {new Date(request.timestamp).toLocaleString()}
                </Text>
                <Text style={styles.status}>Status: {request.status}</Text>
              </View>
              <View style={styles.actionButtons}>
                {request.status === 'accepted' && (
                  <Pressable 
                    style={styles.trackButton}
                    onPress={() => handleTrackAmbulance(request)}
                  >
                    <Ionicons name="navigate" size={24} color="#294B29" />
                    <Text style={styles.trackButtonText}>Track</Text>
                  </Pressable>
                )}
                {request.status === 'pending' && (
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={() => handleCancelRequest(request.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
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
  requestList: {
    padding: 20
  },
  noRequests: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10
  },
  requestInfo: {
    flex: 1
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  vehicleDetails: {
    marginLeft: 8,
    flex: 1
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#294B29',
    marginBottom: 4
  },
  vehicleType: {
    fontSize: 14,
    color: '#666'
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  status: {
    color: '#294B29',
    fontWeight: '500'
  },
  cancelButton: {
    padding: 5
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trackButton: {
    padding: 5
  },
  trackButtonText: {
    marginLeft: 5,
    color: '#294B29',
    fontWeight: '500'
  }
}); 