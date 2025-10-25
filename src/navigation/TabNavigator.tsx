import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// screens
import { Dashboard } from "../screens/Dashboard";
import { NotificationsScreen } from "../screens/Notifications";
import { SettingsScreen } from "../screens/Settings";
import { SurveysScreen } from "../screens/Surveys";
import { AbsenteeReportScreen } from "../screens/AbsenteeReport";
import CustomTabNavigator from "../components/UI/CustomTabNavigator";
import { ForumsScreen } from "../screens/Forums";

export type TabParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Surveys: undefined;
  Report: undefined;
  Forum: undefined;
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
    name: "Report",
    label: "Report",
    icon: "calendar",
    iconOutline: "calendar-outline",
  },
  {
    name: "Forum",
    label: "Forums",
    icon: "chatbubbles",
    iconOutline: "chatbubbles-outline",
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
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Surveys" component={SurveysScreen} />
      <Tab.Screen name="Report" component={AbsenteeReportScreen} />
      <Tab.Screen name="Forum" component={ForumsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
