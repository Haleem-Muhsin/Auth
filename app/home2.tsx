import { View, StyleSheet, SafeAreaView, Pressable, Alert, Text, Modal, TextInput, ScrollView, BackHandler, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { auth, firestore, database } from './firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Ambulance } from './types/ambulance';
import React from 'react';
import * as Location from 'expo-location';
import { ref, set } from 'firebase/database';
import type { Booking } from './types/booking';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Home2() {
  const router = useRouter();
  const navigation = useNavigation();
  const [ambulanceDetails, setAmbulanceDetails] = useState<Ambulance | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [editableDetails, setEditableDetails] = useState<Partial<Ambulance>>({});
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [showDatePicker, setShowDatePicker] = useState({
    insuranceStart: false,
    insuranceEnd: false,
    pollutionEnd: false,
    currentDate: new Date(),
    currentField: '' as 'insuranceStartDate' | 'insuranceEndDate' | 'pollutionEndDate' | ''
  });

  const ambulanceTypes = ['Basic', 'Advanced', 'ICU'] as const;
  const statusTypes = ['available', 'busy', 'offline'] as const;

  useEffect(() => {
    fetchAmbulanceDetails();
  }, []);

  useEffect(() => {
    if (ambulanceDetails) {
      const now = Date.now();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      // Check insurance end date
      if (ambulanceDetails.insuranceEndDate) {
        const daysUntilInsuranceExpiry = (ambulanceDetails.insuranceEndDate - now) / (24 * 60 * 60 * 1000);
        if (daysUntilInsuranceExpiry <= 30 && daysUntilInsuranceExpiry > 0) {
          Alert.alert(
            'Insurance Expiring Soon',
            `Your insurance will expire in ${Math.ceil(daysUntilInsuranceExpiry)} days. Please renew it soon.`
          );
        } else if (daysUntilInsuranceExpiry <= 0) {
          Alert.alert(
            'Insurance Expired',
            'Your insurance has expired. Please renew it immediately.'
          );
        }
      }

      // Check pollution end date
      if (ambulanceDetails.pollutionEndDate) {
        const daysUntilPollutionExpiry = (ambulanceDetails.pollutionEndDate - now) / (24 * 60 * 60 * 1000);
        if (daysUntilPollutionExpiry <= 30 && daysUntilPollutionExpiry > 0) {
          Alert.alert(
            'Pollution Check Expiring Soon',
            `Your pollution check will expire in ${Math.ceil(daysUntilPollutionExpiry)} days. Please get it renewed soon.`
          );
        } else if (daysUntilPollutionExpiry <= 0) {
          Alert.alert(
            'Pollution Check Expired',
            'Your pollution check has expired. Please get it renewed immediately.'
          );
        }
      }
    }
  }, [ambulanceDetails]);

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
            'A customer needs an ambulance',
            [
              { 
                text: 'Booking Request',
                onPress: () => router.push('/bookings')
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
        longitude: ambulanceDetails?.longitude || 0,
        driverEmail: auth.currentUser.email,
        insuranceStartDate: editableDetails.insuranceStartDate || Date.now(),
        insuranceEndDate: editableDetails.insuranceEndDate || Date.now() + (365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
        pollutionEndDate: editableDetails.pollutionEndDate || Date.now() + (180 * 24 * 60 * 60 * 1000) // Default to 6 months from now
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
    });

    return () => backHandler.remove();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentField = showDatePicker.currentField;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(prev => ({
        ...prev,
        insuranceStart: false,
        insuranceEnd: false,
        pollutionEnd: false
      }));
    }

    if (event.type === 'set' && selectedDate && currentField) {
      setEditableDetails(prev => ({
        ...prev,
        [currentField]: selectedDate.getTime()
      }));
    }
  };

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
                <Ionicons name="person" size={24} color="#294B29" />
                <Text style={styles.detailText}>
                  Driver: {ambulanceDetails.driver}
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

              <View style={styles.documentDetailsContainer}>
                <View style={styles.documentHeader}>
                  <Ionicons name="document-text" size={24} color="#294B29" />
                  <Text style={styles.documentTitle}>Document Details</Text>
                  <Pressable 
                    onPress={() => {
                      setEditableDetails({
                        ...editableDetails,
                        insuranceStartDate: ambulanceDetails.insuranceStartDate,
                        insuranceEndDate: ambulanceDetails.insuranceEndDate,
                        pollutionEndDate: ambulanceDetails.pollutionEndDate
                      });
                      setIsEditingDates(true);
                    }}
                    style={styles.editIconButton}
                  >
                    <Ionicons name="pencil" size={20} color="#294B29" />
                  </Pressable>
                </View>
                
                <View style={styles.documentContent}>
                  <View style={styles.documentRow}>
                    <Ionicons name="shield-checkmark" size={20} color="#294B29" />
                    <Text style={styles.documentText}>
                      Insurance: {new Date(ambulanceDetails.insuranceStartDate).toLocaleDateString()} - {new Date(ambulanceDetails.insuranceEndDate).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.documentRow}>
                    <Ionicons name="leaf" size={20} color="#294B29" />
                    <Text style={styles.documentText}>
                      Pollution Check: Valid until {new Date(ambulanceDetails.pollutionEndDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
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

      {/* Add this new modal for editing dates */}
      <Modal
        visible={isEditingDates}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingDates(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Document Dates</Text>
              <Pressable onPress={() => setIsEditingDates(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#294B29" />
              </Pressable>
            </View>

            <ScrollView>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Insurance Start Date</Text>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateText}>
                    {editableDetails.insuranceStartDate 
                      ? new Date(editableDetails.insuranceStartDate).toLocaleDateString()
                      : 'Select Insurance Start Date'}
                  </Text>
                  <Pressable 
                    onPress={() => {
                      const currentDate = editableDetails.insuranceStartDate 
                        ? new Date(editableDetails.insuranceStartDate)
                        : new Date();
                      setShowDatePicker({
                        ...showDatePicker,
                        insuranceStart: true,
                        currentDate,
                        currentField: 'insuranceStartDate'
                      });
                    }}
                    style={styles.calendarIconButton}
                  >
                    <Ionicons name="calendar" size={20} color="#294B29" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Insurance End Date</Text>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateText}>
                    {editableDetails.insuranceEndDate 
                      ? new Date(editableDetails.insuranceEndDate).toLocaleDateString()
                      : 'Select Insurance End Date'}
                  </Text>
                  <Pressable 
                    onPress={() => {
                      const currentDate = editableDetails.insuranceEndDate 
                        ? new Date(editableDetails.insuranceEndDate)
                        : new Date();
                      setShowDatePicker({
                        ...showDatePicker,
                        insuranceEnd: true,
                        currentDate,
                        currentField: 'insuranceEndDate'
                      });
                    }}
                    style={styles.calendarIconButton}
                  >
                    <Ionicons name="calendar" size={20} color="#294B29" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pollution End Date</Text>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateText}>
                    {editableDetails.pollutionEndDate 
                      ? new Date(editableDetails.pollutionEndDate).toLocaleDateString()
                      : 'Select Pollution End Date'}
                  </Text>
                  <Pressable 
                    onPress={() => {
                      const currentDate = editableDetails.pollutionEndDate 
                        ? new Date(editableDetails.pollutionEndDate)
                        : new Date();
                      setShowDatePicker({
                        ...showDatePicker,
                        pollutionEnd: true,
                        currentDate,
                        currentField: 'pollutionEndDate'
                      });
                    }}
                    style={styles.calendarIconButton}
                  >
                    <Ionicons name="calendar" size={20} color="#294B29" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <Pressable 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setIsEditingDates(false)}
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

              {/* Date Picker for Android */}
              {Platform.OS === 'android' && (showDatePicker.insuranceStart || showDatePicker.insuranceEnd || showDatePicker.pollutionEnd) && (
                <DateTimePicker
                  value={showDatePicker.currentDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={showDatePicker.currentField === 'insuranceStartDate' ? new Date() : undefined}
                />
              )}

              {/* Date Picker for iOS */}
              {Platform.OS === 'ios' && (showDatePicker.insuranceStart || showDatePicker.insuranceEnd || showDatePicker.pollutionEnd) && (
                <View style={styles.datePickerWrapper}>
                  <View style={styles.datePickerHeader}>
                    <Text style={styles.datePickerTitle}>
                      Select {showDatePicker.currentField.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Text>
                    <Pressable 
                      style={styles.closePicker}
                      onPress={() => {
                        setShowDatePicker(prev => ({
                          ...prev,
                          insuranceStart: false,
                          insuranceEnd: false,
                          pollutionEnd: false
                        }));
                      }}
                    >
                      <Ionicons name="close" size={24} color="#294B29" />
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={showDatePicker.currentDate}
                    mode="date"
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={showDatePicker.currentField === 'insuranceStartDate' ? new Date() : undefined}
                    themeVariant="light"
                  />
                </View>
              )}
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
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginTop: Platform.OS === 'ios' ? 50 : 0, // Add space for notch on iOS
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
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
    borderColor: 'white',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedTypeText: {
    color: 'blue',
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
  modalScrollView: {
    flex: 1,
  },
  modalForm: {
    paddingBottom: 20,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  calendarIconButton: {
    padding: 5,
    marginLeft: 10,
  },
  datePickerWrapper: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#294B29',
    textTransform: 'capitalize',
  },
  closePicker: {
    padding: 5,
  },
  editIconButton: {
    padding: 5,
    marginLeft: 10,
  },
  documentDetailsContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#294B29',
    flex: 1,
  },
  documentContent: {
    gap: 12,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  documentText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});
