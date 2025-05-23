import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function CustomerSetUp() {
  const router = useRouter();

  return (
    <View style={styles.driverContainer}>
      <Pressable onPress={() => router.push('/')}>
        <Text style={styles.driverText}>Customer? login/sign up here</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  driverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DBE7C9',
  },
  driverText: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
  },
});
