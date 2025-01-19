import { View, Text, StyleSheet, SafeAreaView, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Ambulance } from '../types/ambulance';
import { router } from 'expo-router';

interface LocationPageProps {
  ambulances: Ambulance[];
  initialFrom: string;
  initialTo: string;
  onLocationSelect: (from: string, to: string) => void;
}

export default function LocationPage({ 
  ambulances, 
  initialFrom, 
  initialTo, 
  onLocationSelect 
}: LocationPageProps) {
  const [fromLocation, setFromLocation] = useState(initialFrom);
  const [toLocation, setToLocation] = useState(initialTo);

  const handleBack = () => {
    onLocationSelect(fromLocation, toLocation);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#294B29" />
        </Pressable>
        <Text style={styles.title}>Select a location</Text>
      </View>

      <View style={styles.inputsContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="location" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Your location"
            placeholderTextColor="#666"
            value={fromLocation}
            onChangeText={setFromLocation}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.inputWrapper}>
          <Ionicons name="location" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Select ambulance"
            placeholderTextColor="#666"
            value={toLocation}
            onChangeText={setToLocation}
          />
        </View>
      </View>

      <View style={styles.ambulanceList}>
        <Text style={styles.listTitle}>Available Ambulances Nearby</Text>
        {ambulances
          .filter(amb => amb.status === 'available')
          .map((ambulance) => (
            <Pressable
              key={ambulance.id}
              style={styles.ambulanceItem}
              onPress={() => {
                setFromLocation(`Ambulance ${ambulance.id}`);
              }}
            >
              <Ionicons name="medical" size={24} color="#294B29" />
              <View style={styles.ambulanceInfo}>
                <Text style={styles.ambulanceTitle}>Ambulance {ambulance.id}</Text>
                <Text style={styles.ambulanceSubtitle}>
                  {ambulance.driver || 'Driver not assigned'}
                </Text>
              </View>
            </Pressable>
          ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#294B29',
  },
  inputsContainer: {
    padding: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  ambulanceList: {
    flex: 1,
    padding: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#294B29',
  },
  ambulanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ambulanceInfo: {
    marginLeft: 15,
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
}); 