import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ambulance } from '../types/ambulance';

interface LocationExpandedProps {
  ambulances: Ambulance[];
  onSelectLocation: (location: string) => void;
  onClose: () => void;
}

export default function LocationExpanded({ ambulances, onSelectLocation, onClose }: LocationExpandedProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Ambulances Nearby</Text>
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={24} color="#294B29" />
        </Pressable>
      </View>
      <ScrollView style={styles.list}>
        {ambulances
          .filter(amb => amb.status === 'available')
          .map((ambulance) => (
            <Pressable
              key={ambulance.id}
              style={styles.item}
              onPress={() => onSelectLocation(`Ambulance ${ambulance.id}`)}
            >
              <Ionicons name="medical" size={24} color="#294B29" />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Ambulance {ambulance.id}</Text>
                <Text style={styles.itemSubtitle}>
                  {ambulance.driver || 'Driver not assigned'}
                </Text>
              </View>
            </Pressable>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 15,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#294B29',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemInfo: {
    marginLeft: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
}); 