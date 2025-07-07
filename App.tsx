import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
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
import * as Updated from "expo-updates";
enableScreens();

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { colors, isDark, initializeTheme } = useTheme();
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
        if(__DEV__) return; // Skip update check in development mode
        const update = await Updated.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updated.fetchUpdateAsync();
          await Updated.reloadAsync();
        }
      } catch (error) {
        console.error("Error checking for updates:", error);
      }
    };
    checkForUpdates();
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={isDark ? "light" : "dark"} translucent />

          {isAuthenticated ? <RootNavigator /> : <LoginScreen />}
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
