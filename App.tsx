import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "./src/state/auth";
import { useSettingsStore } from "./src/state/settings";
import { useTheme } from "./src/hooks/useTheme";
import { LoginScreen } from "./src/screens/Login";
import { RootNavigator } from "./src/navigation/RootNavigator";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { StatusBar } from "react-native";
import * as SystemUI from 'expo-system-ui';
import * as Update from "expo-updates";
enableScreens();

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { initializeTheme, colors } = useTheme();
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const initializeSettings = useSettingsStore(
    (state) => state.initializeSettings
  );

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeTheme();
        await initializeSettings();
        await checkAuthStatus();
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (!isLoading) SplashScreen.hideAsync();
      }
    };

    initialize();
  }, []);

  // Handle updates
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        if (__DEV__) return; // Skip update check in development mode
        const update = await Update.checkForUpdateAsync();
        if (update.isAvailable) {
          await Update.fetchUpdateAsync();
          await Update.reloadAsync();
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };
    checkForUpdates();
  }, []);


  // Set navigation bar color
  useEffect(() => {
    const setNavigationBarColor = async () => {
      try {
        SystemUI.setBackgroundColorAsync(colors.background);
      } catch (error) {
        console.error("Error setting navigation bar color:", error);
      }
    };
    setNavigationBarColor();
  }, [colors.background]);

  return (
    <GestureHandlerRootView>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaProvider>
        <NavigationContainer>
          {isAuthenticated ? <RootNavigator /> : <LoginScreen />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
