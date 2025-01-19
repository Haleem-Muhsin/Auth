import { View, TextInput, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState } from 'react';
import LocationExpanded from './LocationExpanded';
import { Ambulance } from '../types/ambulance';
import { router } from 'expo-router';

interface LocationInputsProps {
  onLocationChange: (from: string, to: string) => void;
  ambulances: Ambulance[];
  onFocus: () => void;
  onBlur: () => void;
}

export default function LocationInputs({ 
  onLocationChange, 
  ambulances,
  onFocus,
  onBlur 
}: LocationInputsProps) {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const currentLocation = `${address[0].street}, ${address[0].city}`;
        setFromLocation(currentLocation);
        onLocationChange(currentLocation, toLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleFromPress = () => {
    router.push({
      pathname: '/location',
      params: {
        from: fromLocation,
        to: toLocation,
      }
    });
  };

  const handleLocationSelect = (location: string) => {
    setFromLocation(location);
    onLocationChange(location, toLocation);
    setIsExpanded(false);
    onBlur();
  };

  const handleToLocationChange = (text: string) => {
    setToLocation(text);
    onLocationChange(fromLocation, text);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.inputContainer}
        onPress={handleFromPress}
        activeOpacity={0.7}
      >
        <Ionicons name="location" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="From"
          placeholderTextColor="#666"
          value={fromLocation}
          editable={false}
        />
        <Pressable onPress={getCurrentLocation} style={styles.currentLocation}>
          <Ionicons name="navigate" size={20} color="#294B29" />
        </Pressable>
      </TouchableOpacity>
      
      <View style={styles.divider} />
      
      <View style={styles.inputContainer}>
        <Ionicons name="location" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="To"
          placeholderTextColor="#666"
          value={toLocation}
          onChangeText={handleToLocationChange}
          onFocus={handleFromPress}
        />
      </View>

      {isExpanded && (
        <LocationExpanded
          ambulances={ambulances}
          onSelectLocation={handleLocationSelect}
          onClose={() => {
            setIsExpanded(false);
            onBlur();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 15,
    width: '100%',
  },
  inputContainer: {
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
  currentLocation: {
    padding: 8,
  }
}); 