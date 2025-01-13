import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Checkbox from 'expo-checkbox';
import { useState } from 'react';

export default function LoginForm() {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome back!</Text>
      <Text style={styles.title}>Login</Text>
      
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
        <Text style={styles.label}>Your Password</Text>
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
          <Text style={styles.rememberText}>Remember me</Text>
        </View>
        <Pressable>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </Pressable>
      </View>

      <Pressable style={styles.signInButton}>
        <Text style={styles.signInText}>Sign In</Text>
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
}); 