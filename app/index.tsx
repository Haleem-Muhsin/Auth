import { Platform, SafeAreaView, View, Text, Pressable, Image, BackHandler, Alert, Dimensions } from "react-native";
import { StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit?',
          [
            {
              text: 'Cancel',
              onPress: () => null,
              style: 'cancel',
            },
            {
              text: 'Exit',
              onPress: () => BackHandler.exitApp(),
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
        return true;
      });

      return () => backHandler.remove();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to MediMove</Text>
        <Text style={styles.subtitle}>Choose your role to continue</Text>
      </View>

      <View style={styles.cardsContainer}>
        <Pressable 
          style={styles.card}
          onPress={() => router.push('/index1')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person" size={40} color="#294B29" />
          </View>
          <Text style={styles.cardTitle}>Customer</Text>
          <Text style={styles.cardDescription}>
            Book an ambulance and track your ride in real-time
          </Text>
          <View style={styles.cardFooter}>
            <Ionicons name="arrow-forward" size={24} color="#294B29" />
          </View>
        </Pressable>

        <Pressable 
          style={styles.card}
          onPress={() => router.push('/index2')}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="car" size={40} color="#294B29" />
          </View>
          <Text style={styles.cardTitle}>Driver</Text>
          <Text style={styles.cardDescription}>
            Accept rides and help people reach their destination safely
          </Text>
          <View style={styles.cardFooter}>
            <Ionicons name="arrow-forward" size={24} color="#294B29" />
          </View>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Emergency Services at Your Fingertips</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#294B29',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#DBE7C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#294B29',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#294B29',
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});