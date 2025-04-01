import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import Checkbox from 'expo-checkbox';
import { useState } from 'react';
import { useRouter } from "expo-router";
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useUser } from '../../context/UserContext';

type SignupFormProps = {
  setActiveTab: (tab: 'signin' | 'signup') => void;
};

export default function SignupForm({ setActiveTab }: SignupFormProps) {
  const { setUserName } = useUser();
  const [isChecked, setIsChecked] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Password validation states
  const [hasMinLength, setHasMinLength] = useState(false);
  const [hasUpperCase, setHasUpperCase] = useState(false);
  const [hasLowerCase, setHasLowerCase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);

  const validatePassword = (text: string) => {
    setPassword(text);
    setHasMinLength(text.length >= 8);
    setHasUpperCase(/[A-Z]/.test(text));
    setHasLowerCase(/[a-z]/.test(text));
    setHasNumber(/[0-9]/.test(text));
    setHasSpecialChar(/[!@#$%^&amp;*(),.?":{}|&lt;&gt;]/.test(text));
  };

  const handleSignUp = async () => {
    if (!email || !password || !name || !isChecked) {
      Alert.alert('Error', 'Please fill in all fields and accept terms');
      return;
    }

    // Check if all password requirements are met
    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      Alert.alert('Password Requirements', 'Please ensure your password meets all requirements');
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      setUserName(name);
      setActiveTab('signin');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Create account</Text>
      <Text style={styles.title}>Customer Sign Up</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput 
          style={styles.input}
          placeholder="John Doe"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Your Email</Text>
        <TextInput 
          style={styles.input}
          placeholder="placeholder@gmail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Create Password</Text>
        <TextInput 
          style={styles.input}
          secureTextEntry
          placeholder="••••••••"
          value={password}
          onChangeText={validatePassword}
        />
        <View style={styles.passwordRequirements}>
          <Text style={[styles.requirementText, hasMinLength && styles.requirementMet]}>
            • At least 8 characters
          </Text>
          <Text style={[styles.requirementText, hasUpperCase && styles.requirementMet]}>
            • One uppercase letter
          </Text>
          <Text style={[styles.requirementText, hasLowerCase && styles.requirementMet]}>
            • One lowercase letter
          </Text>
          <Text style={[styles.requirementText, hasNumber && styles.requirementMet]}>
            • One number
          </Text>
          <Text style={[styles.requirementText, hasSpecialChar && styles.requirementMet]}>
            • One special character (!@#$%^&amp;*(),.?":{}|&lt;&gt;)
          </Text>
        </View>
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

      <Pressable 
        style={[styles.signInButton, loading && styles.disabledButton]}
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.signInText}>
          {loading ? 'Creating Account...' : 'Create Account'}
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
  passwordRequirements: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  requirementMet: {
    color: '#4CAF50',
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
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
}); 