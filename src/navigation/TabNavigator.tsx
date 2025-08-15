import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// screens
import { Dashboard } from "../screens/Dashboard";
import { NotificationsScreen } from "../screens/Notifications";
import { SettingsScreen } from "../screens/Settings";
import { SurveysScreen } from "../screens/Surveys";
import CustomTabNavigator from "../components/UI/CustomTabNavigator";


export type TabParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Surveys: undefined;
  Settings: undefined;
};

interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

const Tab = createBottomTabNavigator<TabParamList>();

const tabs: TabItem[] = [
  {
    name: "Dashboard",
    label: "Home",
    icon: "home",
    iconOutline: "home-outline",
  },
  {
    name: "Notifications",
    label: "Alerts",
    icon: "notifications",
    iconOutline: "notifications-outline",
  },
  {
    name: "Surveys",
    label: "Surveys",
    icon: "document-text",
    iconOutline: "document-text-outline",
  },
  {
    name: "Settings",
    label: "Settings",
    icon: "cog",
    iconOutline: "cog-outline",
  },
];

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      id={undefined}
      tabBar={(props) => <CustomTabNavigator {...props} tabs={tabs} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Surveys" component={SurveysScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};