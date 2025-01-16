import { View, StyleSheet, SafeAreaView, Pressable, Alert } from 'react-native';
import LocationInputs from './components/LocationInputs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container1}>
        <Pressable onPress={handleLogout} style={styles.iconContainer}>
          <Ionicons name="person-circle-outline" size={30} color="#294B29" />
        </Pressable>
      </View>
      <View style={styles.container2}>
        <LocationInputs />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container1: {
    flex: 3,
    alignItems: "center",
    marginTop: 10,
    position: 'relative',
  },
  container2: {
    flex: 1,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#DBE7C9",
  },
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 25,
    zIndex: 1,
  }
}); 