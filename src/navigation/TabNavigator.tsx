import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { lazyScreen } from "./lazyScreen";
import CustomTabNavigator from "../components/UI/CustomTabNavigator";

// Dashboard is the initial tab screen (eagerly loaded for instant first render)
import { Dashboard } from "../screens/Dashboard";

import {
  NotificationsSkeleton,
  SurveysSkeleton,
  AbsenteeReportSkeleton,
  SettingsSkeleton,
} from "../components/Skeletons/ScreenSkeletons";

// Lazy loaded secondary tab screens with custom skeletons
const NotificationsScreen = lazyScreen(
  () => import("../screens/Notifications"),
  "NotificationsScreen",
  NotificationsSkeleton,
);
const SurveysScreen = lazyScreen(
  () => import("../screens/Surveys"),
  "SurveysScreen",
  SurveysSkeleton,
);
const AbsenteeReportScreen = lazyScreen(
  () => import("../screens/AbsenteeReport"),
  "AbsenteeReportScreen",
  AbsenteeReportSkeleton,
);
const SettingsScreen = lazyScreen(
  () => import("../screens/Settings"),
  "SettingsScreen",
  SettingsSkeleton,
);

export type TabParamList = {
  Dashboard: undefined;
  Notifications: undefined;
  Surveys: undefined;
  Report: undefined;
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
        lazy: true,
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Surveys" component={SurveysScreen} />
      <Tab.Screen name="Report" component={AbsenteeReportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

