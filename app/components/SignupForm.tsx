import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Checkbox from 'expo-checkbox';
import { useState } from 'react';

export default function SignupForm() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Create account</Text>
      <Text style={styles.title}>Sign Up</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput 
          style={styles.input}
          placeholder="John Doe"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Email</Text>
        <TextInput 
          style={styles.input}
          placeholder="placeholder@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Create Password</Text>
        <TextInput 
          style={styles.input}
          secureTextEntry
          placeholder="••••••••"
        />
      </View>

      <View style={styles.optionsRow}>
        <View style={styles.rememberMe}>
          <Checkbox
            style={styles.checkbox}
            value={isChecked}
            onValueChange={setIsChecked}
            color={isChecked ? '#007AFF' : undefined}
          />
          <Text style={styles.rememberText}>I agree to the Terms & Conditions</Text>
        </View>
      </View>

      <Pressable style={styles.signInButton}>
        <Text style={styles.signInText}>Create Account</Text>
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
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
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
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    flex: 1,
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
}); 