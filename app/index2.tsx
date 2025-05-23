import { Platform, SafeAreaView, ScrollView, View, BackHandler } from "react-native";
import { StyleSheet } from "react-native";
import { useState } from "react";
import SwitchTabs from "./components/SwitchTabs";
import DriverLoginForm from "./components/Driver/DriverLoginForm";
import DriverSignupForm from "./components/Driver/DriverSignupForm";
import CustomerSetUp from "./components/Customer/CustomerSetUp";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";

export default function index2() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (activeTab === 'signup') {
          // If on signup, go back to signin
          setActiveTab('signin');
          return true;
        } else {
          // If on signin, go back to role selection
          router.replace('/');
          return true;
        }
      });

      return () => backHandler.remove();
    }, [activeTab, router])
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
          <DriverLoginForm />
        ) : (
          <DriverSignupForm setActiveTab={setActiveTab} />
        )}
      </View>
      </ScrollView>
      <View style={styles.container2}>
        <CustomerSetUp/>
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
