import { View, Text, TextInput, Pressable, StyleSheet, Alert, BackHandler } from "react-native";
import Checkbox from 'expo-checkbox';
import { useState, useEffect } from 'react';
import { useRouter } from "expo-router";
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DriverLoginForm() {
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

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
            onPress: handleSignOut,
            style: 'destructive',
          },
        ],
        { cancelable: true }
      );
      return true;
    });

    return () => backHandler.remove();
  }, [router]);

  useEffect(() => {
    checkPersistedAuth();
  }, []);

  const checkPersistedAuth = async () => {
    try {
      const persistedAuth = await AsyncStorage.getItem('rememberMe');
      if (persistedAuth === 'true' && auth.currentUser) {
        router.push('/home2');
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    }
  };

  const handleSignIn = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    if (!email || !password) {
      if (!email) setEmailError('Email is required');
      if (!password) setPasswordError('Password is required');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      if (isChecked) {
        await AsyncStorage.setItem('rememberMe', 'true');
      }
      router.push('/home2');
    } catch (error: any) {
      const errorMessage = error.message;
      if (errorMessage.includes('user-not-found')) {
        setEmailError('No account found with this email');
      } else if (errorMessage.includes('wrong-password')) {
        setPasswordError('Incorrect password');
      } else if (errorMessage.includes('invalid-email')) {
        setEmailError('Invalid email format');
      } else {
        setPasswordError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('rememberMe');
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome back!</Text>
      <Text style={styles.title}>Driver Login</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Email</Text>
        <TextInput 
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="placeholder@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Password</Text>
        <TextInput 
          style={[styles.input, passwordError ? styles.inputError : null]}
          secureTextEntry
          placeholder="••••••••"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
          }}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      </View>

      <View style={styles.optionsRow}>
        <View style={styles.rememberMe}>
          <Checkbox
            style={styles.checkbox}
            value={isChecked}
            onValueChange={setIsChecked}
            color={isChecked ? '#007AFF' : undefined}
          />
          <Text style={styles.rememberText}>Remember me</Text>
        </View>
        <Pressable>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </Pressable>
      </View>

      <Pressable 
        style={[styles.signInButton, loading && styles.disabledButton]} 
        onPress={handleSignIn}
        disabled={loading}
      >
        <Text style={styles.signInText}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginVertical: 5,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginVertical: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    margin: 0,
    marginRight: 8,
    borderRadius: 4,
    width: 20,
    height: 20,
  },
  rememberText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#007AFF',
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
}); 