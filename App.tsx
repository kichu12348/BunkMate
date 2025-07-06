import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
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

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { colors, isDark, initializeTheme } = useTheme();
  const { isAuthenticated, isLoading, checkAuthStatus } = useAuthStore();
  const initializeSettings  = useSettingsStore(state => state.initializeSettings);

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

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <NavigationContainer>
          <View
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <StatusBar
              style={isDark ? "light" : "dark"}
              backgroundColor={colors.background}
              translucent
            />

            {isAuthenticated ? <RootNavigator /> : <LoginScreen />}
          </View>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
