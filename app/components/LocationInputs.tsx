import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationInputs() {
  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="location" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="From"
          placeholderTextColor="#666"
        />
      </View>
      <View style={styles.divider} />
      <View style={styles.inputContainer}>
        <Ionicons name="location" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="To"
          placeholderTextColor="#666"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 15,
    marginTop: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
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
}); 