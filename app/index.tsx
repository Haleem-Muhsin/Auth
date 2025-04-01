import { Platform, SafeAreaView, View } from "react-native";
import { StyleSheet } from "react-native";
import { useState } from "react";
import SwitchTabs from "./components/SwitchTabs";
import LoginForm from "./components/Customer/LoginForm";
import SignupForm from "./components/Customer/SignupForm";
import DriverSetUp from "./components/Driver/DriverSetUp";

export default function Index() {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const handleTabChange = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container1}>
        <SwitchTabs onTabChange={handleTabChange} />
        {activeTab === 'signin' ? (
          <LoginForm />
        ) : (
          <SignupForm setActiveTab={setActiveTab} />
        )}
      </View>
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
    flex: 0.25,
    alignItems: "center",
    marginHorizontal: 25,
    borderRadius: 20,
    backgroundColor: "#DBE7C9",
    maxHeight: 150,
    marginBottom: Platform.OS === "android" ? 30 : 0,
  },
});
