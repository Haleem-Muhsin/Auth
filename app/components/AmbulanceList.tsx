import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Ambulance } from '../types/ambulance';
import AmbulanceDetails from './AmbulanceDetails';
import { useState } from 'react';

interface AmbulanceListProps {
  ambulances: Ambulance[];
  onSelect: (ambulance: Ambulance) => void;
}

const fakeAmbulances: Ambulance[] = [
  {
    id: 'KL-05-AB-1234',
    latitude: 9.5916,
    longitude: 76.5222,
    status: 'available',
    driver: 'Rajesh Kumar',
    phoneNumber: '+91 9876543210',
    lastUpdated: Date.now(),
    type: 'Basic',
    hospital: "St. Mary's Hospital"
  },
  {
    id: 'KL-05-CD-5678',
    latitude: 9.5968,
    longitude: 76.5359,
    status: 'available',
    driver: 'Arun Thomas',
    phoneNumber: '+91 9876543211',
    lastUpdated: Date.now(),
    type: 'Advanced',
    hospital: 'Medical College Kottayam'
  },
  {
    id: 'KL-05-EF-9012',
    latitude: 9.7160,
    longitude: 76.6860,
    status: 'available',
    driver: 'Joseph Mathew',
    phoneNumber: '+91 9876543212',
    lastUpdated: Date.now(),
    type: 'ICU',
    hospital: 'District Hospital Pala'
  },
  {
    id: 'KL-05-GH-3456',
    latitude: 9.7109,
    longitude: 76.6780,
    status: 'available',
    driver: 'Mary Philip',
    phoneNumber: '+91 9876543213',
    lastUpdated: Date.now(),
    type: 'Basic',
    hospital: 'Caritas Hospital'
  }
];

export default function AmbulanceList({ ambulances = fakeAmbulances, onSelect }: AmbulanceListProps) {
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);

  const handleAmbulancePress = (ambulance: Ambulance) => {
    setSelectedAmbulance(ambulance);
  };

  return (
    <ScrollView style={styles.container}>
      {ambulances.map((ambulance) => (
        <Pressable
          key={ambulance.id}
          style={styles.option}
          onPress={() => {
            handleAmbulancePress(ambulance);
            onSelect(ambulance);
          }}
        >
          <View style={styles.header}>
            <Ionicons name="medical" size={24} color="#294B29" />
            <Text style={styles.type}>
              {ambulance.type} Ambulance - {ambulance.id}
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.driverInfo}>
              Driver: {ambulance.driver}
            </Text>
            <Text style={styles.hospitalInfo}>
              Base: {ambulance.hospital}
            </Text>
          </View>
          <View style={styles.status}>
            <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.statusText}>Available Now</Text>
          </View>
        </Pressable>
      ))}
      {selectedAmbulance && (
        <AmbulanceDetails
          ambulance={selectedAmbulance}
          isVisible={!!selectedAmbulance}
          onClose={() => setSelectedAmbulance(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    color: '#294B29',
  },
  details: {
    marginLeft: 34,
  },
  driverInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  hospitalInfo: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 34,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
  }
}); 