import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { Dashboard } from "../screens/Dashboard";
import { NotificationsScreen } from "../screens/Notifications";
import { SettingsScreen } from "../screens/Settings";
import { SurveysScreen } from "../screens/Surveys";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

export type TabParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Surveys: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

const CustomTabBarIcon: React.FC<{
  focused: boolean;
  color: string;
  size: number;
  iconName: keyof typeof Ionicons.glyphMap;
}> = ({ focused, color, size, iconName }) => {
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconWrapper,
          { backgroundColor: focused ? `${color}20` : "transparent" },
        ]}
      >
        <Ionicons
          name={iconName}
          size={size}
          color={focused ? color : color + "80"}
        />
      </View>
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case "Dashboard":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Notifications":
              iconName = focused ? "notifications" : "notifications-outline";
              break;
            case "Surveys":
              iconName = focused ? "document-text" : "document-text-outline";
              break;
            case "Settings":
              iconName = focused ? "settings" : "settings-outline";
              break;
            default:
              iconName = "help-outline";
          }

          return (
            <CustomTabBarIcon
              focused={focused}
              color={color}
              size={size}
              iconName={iconName}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + 10,
          left: 20,
          right: 20,
          height: 70,
          backgroundColor:"transparent",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: colors.shadow,
          shadowOffset: {
            width: 0,
            height: 10,
          },
          shadowOpacity: 0.25,
          shadowRadius: 15,
          paddingBottom: 1,
          paddingTop: 10,
          paddingHorizontal: 20,
        },
        tabBarBackground: () => (
          <View style={styles.tabBar}>
            <BlurView
              intensity={20}
              experimentalBlurMethod="dimezisBlurView"
              blurReductionFactor={12}
              tint={isDark ? "dark" : "light"}
              style={styles.blurContainer}
            />
          </View>
        ),
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 8,
          paddingVertical: 4,
        },
        tabBarShowLabel: false, // Hide labels for cleaner look
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: "Dashboard",
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: "Notifications",
        }}
      />
      <Tab.Screen
        name="Surveys"
        component={SurveysScreen}
        options={{
          tabBarLabel: "Surveys",
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    width: width * 0.95,
    height: 70,
    position: "relative",
    alignSelf: "center",
    borderRadius: 30,
    overflow: "hidden",
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
