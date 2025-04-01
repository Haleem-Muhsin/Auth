import { Platform, SafeAreaView, View, ScrollView, BackHandler, Alert } from "react-native";
import { StyleSheet } from "react-native";
import { useState } from "react";
import SwitchTabs from "./components/SwitchTabs";
import LoginForm from "./components/Customer/LoginForm";
import SignupForm from "./components/Customer/SignupForm";
import DriverSetUp from "./components/Driver/DriverSetUp";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export default function Index() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (activeTab === 'signup') {
          // If on signup, go back to signin
          setActiveTab('signin');
          return true;
        } else {
          // If on signin, show exit confirmation
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
        }
      });

      return () => backHandler.remove();
    }, [activeTab])
  );

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container1}>
          <SwitchTabs onTabChange={handleTabChange} />
          {activeTab === 'signin' ? (
            <LoginForm />
          ) : (
            <SignupForm setActiveTab={setActiveTab} />
          )}
        </View>
      </ScrollView>
        <View style={styles.container2}>
          <DriverSetUp />
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container1: {
    flex: 3,
    alignItems: "center",
    marginHorizontal: 25,
    marginBottom: 25,
    borderRadius: 20,
    marginTop: 10,
    backgroundColor: "#DBE7C9",
  },
  container2: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 25,
    borderRadius: 20,
    backgroundColor: "#DBE7C9",
    maxHeight: 150,
    padding: Platform.OS === "android" ? 10 : 10,
    marginBottom: Platform.OS === "android" ? 30 : 0,
  },
});
