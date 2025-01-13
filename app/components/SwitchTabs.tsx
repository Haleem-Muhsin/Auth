import { View, Text, Pressable, Animated } from "react-native";
import { StyleSheet } from "react-native";
import { useState, useRef } from "react";

type SwitchTabsProps = {
  onTabChange?: (tab: "signin" | "signup") => void;
};

export default function SwitchTabs({ onTabChange }: SwitchTabsProps) {
  const [activeTab, setActiveTab] = useState("signin");
  const slideAnimation = useRef(new Animated.Value(0)).current;

  const handleTabPress = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    onTabChange?.(tab);
    Animated.spring(slideAnimation, {
      toValue: tab === "signin" ? 0 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  return (
    <View style={styles.switch}>
      <View style={styles.tabContainer}>
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [
                {
                  translateX: slideAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 130],
                  }),
                },
              ],
            },
          ]}
        />
        <Pressable style={styles.tab} onPress={() => handleTabPress("signin")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "signin" && styles.activeTabText,
            ]}
          >
            Log In
          </Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => handleTabPress("signup")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "signup" && styles.activeTabText,
            ]}
          >
            Sign Up
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  switch: {
    marginTop: 15,
    marginHorizontal: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 4,
    width: "80%",
  },
  tabContainer: {
    flexDirection: "row",
    position: "relative",
    height: 35,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 16,
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  slider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "50%",
    height: "100%",
    backgroundColor: "#294B29",
    borderRadius: 16,
  },
});
