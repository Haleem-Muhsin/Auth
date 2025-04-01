import { View, StyleSheet, SafeAreaView, Pressable, Alert, Text, Modal, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, firestore, database } from './firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Ambulance } from './types/ambulance';
import React from 'react';
import * as Location from 'expo-location';
import { ref, set } from 'firebase/database';
import type { Booking } from './types/booking';

export default function Home2() {
  const router = useRouter();
  const [ambulanceDetails, setAmbulanceDetails] = useState<Ambulance | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [editableDetails, setEditableDetails] = useState<Partial<Ambulance>>({});
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);

  const ambulanceTypes = ['Basic', 'Advanced', 'ICU'] as const;
  const statusTypes = ['available', 'busy', 'offline'] as const;

  useEffect(() => {
    fetchAmbulanceDetails();
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startLocationTracking = async () => {
      if (!auth.currentUser?.email) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        (location) => {
          const driverRef = ref(database, `drivers/${auth.currentUser!.email!.replace('.', ',')}`);
          set(driverRef, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            lastUpdated: Date.now(),
            status: ambulanceDetails?.status || 'offline'
          });
        }
      );
    };

    startLocationTracking();
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser?.email) return;

    const bookingsRef = collection(firestore, 'bookings');
    const q = query(
      bookingsRef, 
      where('ambulanceId', '==', auth.currentUser.email),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const booking = change.doc.data() as Booking;
          console.log('New booking request received:', booking);
          Alert.alert(
            'New Booking Request',
            'A customer needs an ambulance. Accept the request?',
            [
              { text: 'Reject', style: 'cancel' },
              { 
                text: 'Accept',
                onPress: () => handleAcceptBooking(change.doc.id, booking)
              }
            ]
          );
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const fetchAmbulanceDetails = async () => {
    if (!auth.currentUser) {
      console.log('No authenticated user found');
      router.replace('/');
      return;
    }
    
    try {
      console.log('Fetching details for user:', auth.currentUser.email);
      const driverDoc = doc(firestore, 'ambulances', auth.currentUser.email!);
      const docSnap = await getDoc(driverDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Ambulance;
        console.log('Fetched ambulance details:', data);
        setAmbulanceDetails(data);
        setEditableDetails(data);
        setIsActive(data.status === 'available');
      } else {
        console.log('No ambulance document found');
        Alert.alert('No ambulance details found');
      }
    } catch (error) {
      console.error('Error fetching ambulance details:', error);
      Alert.alert('Error', 'Failed to fetch ambulance details');
    }
  };

  const handleStatusToggle = async () => {
    if (!ambulanceDetails || !auth.currentUser?.email) return;

    try {
      const newStatus = isActive ? 'offline' : 'available';
      const driverDoc = doc(firestore, 'ambulances', auth.currentUser.email);
      
      await updateDoc(driverDoc, {
        status: newStatus,
        lastUpdated: Date.now()
      });

      setAmbulanceDetails({
        ...ambulanceDetails,
        status: newStatus as Ambulance['status']
      });
      setIsActive(!isActive);
      Alert.alert('Status Updated', `You are now ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
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
              router.replace('/');
            } catch (error) {
              console.error('Error signing out:', error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleEditPress = () => {
    setIsEditing(true);
  };

  const handleSaveDetails = async () => {
    console.log('Current auth state:', auth.currentUser);
    console.log('Current ambulance details:', ambulanceDetails);
    console.log('Current editable details:', editableDetails);

    if (!auth.currentUser?.email) {
      console.log('No authenticated user email');
      Alert.alert('Error', 'Please log in again');
      router.replace('/');
      return;
    }

    if (!editableDetails?.id) {
      console.log('No vehicle number plate provided');
      Alert.alert('Error', 'Vehicle number plate is required');
      return;
    }

    try {
      // Use email as document ID
      const driverDoc = doc(firestore, 'ambulances', auth.currentUser.email);
      const updateData: Ambulance = {
        id: editableDetails.id,
        driver: editableDetails.driver!,
        hospital: editableDetails.hospital!,
        phoneNumber: editableDetails.phoneNumber!,
        type: editableDetails.type!,
        status: editableDetails.status || 'offline',
        lastUpdated: Date.now(),
        latitude: ambulanceDetails?.latitude || 0,
        longitude: ambulanceDetails?.longitude || 0
      };

      console.log('Saving update data:', updateData);

      // Check if document exists
      const docSnap = await getDoc(driverDoc);
      
      if (!docSnap.exists()) {
        await setDoc(driverDoc, updateData);
        console.log('Created new ambulance document with email:', auth.currentUser.email);
      } else {
        await updateDoc(driverDoc, updateData as Partial<Ambulance>);
        console.log('Updated existing ambulance document:', auth.currentUser.email);
      }
      
      setAmbulanceDetails(updateData);
      setIsActive(updateData.status === 'available');
      setIsEditing(false);
      Alert.alert('Success', 'Details saved successfully');
    } catch (error) {
      console.error('Error saving details:', error);
      Alert.alert('Error', `Failed to save details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAcceptBooking = async (bookingId: string, booking: Booking) => {
    try {
      await updateDoc(doc(firestore, 'bookings', bookingId), {
        status: 'accepted'
      });

      setCurrentBooking(booking);
      router.push({
        pathname: "/tracking",
        params: { 
          bookingId,
          customerEmail: booking.customerId,
          userLat: booking.pickupLocation.latitude,
          userLng: booking.pickupLocation.longitude
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Could not accept booking');
    }
  };

  // Add this useEffect to monitor auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('No user found in auth state change');
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Ambulance Details</Text>
          <View style={styles.headerButtons}>
            <Pressable onPress={handleEditPress} style={styles.iconButton}>
              <Ionicons name="pencil" size={24} color="#294B29" />
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={24} color="#294B29" />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          {ambulanceDetails && (
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Ionicons name="car" size={24} color="#294B29" />
                <Text style={styles.detailText}>
                  Number Plate: {ambulanceDetails.id}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="medical" size={24} color="#294B29" />
                <Text style={styles.detailText}>
                  Type: {ambulanceDetails.type || 'Basic'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="business" size={24} color="#294B29" />
                <Text style={styles.detailText}>
                  Hospital: {ambulanceDetails.hospital}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="call" size={24} color="#294B29" />
                <Text style={styles.detailText}>
                  Contact: {ambulanceDetails.phoneNumber}
                </Text>
              </View>

              <Pressable 
                onPress={handleStatusToggle}
                style={[
                  styles.statusButton,
                  { backgroundColor: isActive ? '#4CAF50' : '#666' }
                ]}
              >
                <Text style={styles.statusButtonText}>
                  {isActive ? 'Set as Inactive' : 'Set as Active'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={isEditing}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditing(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Ambulance Details</Text>
              <Pressable onPress={() => setIsEditing(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#294B29" />
              </Pressable>
            </View>

            <ScrollView>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vehicle Number Plate</Text>
                <TextInput
                  style={styles.input}
                  value={editableDetails.id}
                  onChangeText={(text) => setEditableDetails(prev => ({ ...prev, id: text }))}
                  placeholder="Enter vehicle number plate"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Driver Name</Text>
                <TextInput
                  style={styles.input}
                  value={editableDetails.driver}
                  onChangeText={(text) => setEditableDetails(prev => ({ ...prev, driver: text }))}
                  placeholder="Enter driver name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Ambulance Type</Text>
                <View style={styles.typeContainer}>
                  {ambulanceTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeButton,
                        editableDetails.type === type && styles.selectedTypeButton
                      ]}
                      onPress={() => setEditableDetails(prev => ({ ...prev, type }))}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        editableDetails.type === type && styles.selectedTypeText
                      ]}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Status</Text>
                <View style={styles.typeContainer}>
                  {statusTypes.map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.typeButton,
                        editableDetails.status === status && styles.selectedTypeButton,
                        { 
                          backgroundColor: editableDetails.status === status 
                            ? status === 'available' 
                              ? '#4CAF50' 
                              : status === 'busy' 
                                ? '#FFA500' 
                                : '#666'
                            : 'transparent'
                        }
                      ]}
                      onPress={() => {
                        console.log('Setting status to:', status); // Debug log
                        setEditableDetails(prev => ({ 
                          ...prev, 
                          status: status as Ambulance['status']
                        }));
                      }}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        editableDetails.status === status && styles.selectedTypeText,
                        { color: editableDetails.status === status ? 'white' : '#294B29' }
                      ]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hospital</Text>
                <TextInput
                  style={styles.input}
                  value={editableDetails.hospital}
                  onChangeText={(text) => setEditableDetails(prev => ({ ...prev, hospital: text }))}
                  placeholder="Enter hospital name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editableDetails.phoneNumber}
                  onChangeText={(text) => setEditableDetails(prev => ({ ...prev, phoneNumber: text }))}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.buttonContainer}>
                <Pressable 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.button, styles.saveButton]} 
                  onPress={handleSaveDetails}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Pressable 
        style={styles.bookingsButton} 
        onPress={() => router.push('/bookings')}
      >
        <Ionicons name="list" size={24} color="white" />
        <Text style={styles.buttonText}>Bookings</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#DBE7C9',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#294B29',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  detailsContainer: {
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    gap: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#294B29',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  saveButton: {
    backgroundColor: '#294B29',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 5,
  },
  typeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#294B29',
    alignItems: 'center',
  },
  selectedTypeButton: {
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTypeText: {
    color: 'white',
  },
  bookingsButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    backgroundColor: '#294B29',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 25,
    gap: 8
  },
});
