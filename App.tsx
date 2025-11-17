import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "./src/state/auth";
import { useTheme } from "./src/hooks/useTheme";
import { LoginScreen } from "./src/screens/Login";
import { RootNavigator } from "./src/navigation/RootNavigator";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { StatusBar, Appearance } from "react-native";
import * as SystemUI from "expo-system-ui";
import * as Update from "expo-updates";
import { useFonts } from "expo-font";
import { usePfpStore } from "./src/state/pfpStore";
import Toast from "./src/components/UI/toast";
//import NewUpdateAlertModal from "./src/components/Modals/NewUpdateAlert";

enableScreens();

if (!__DEV__) {
  SplashScreen.setOptions({
    fade: true,
    duration: 500,
  });
}

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const { initializeTheme, colors, isDark } = useTheme();
  const { isAuthenticated, checkAuthStatus } = useAuthStore();

  const initializePfp = usePfpStore((state) => state.initialize);

  useFonts({
    "Fredoka-Regular": require("./src/assets/fonts/Fredoka-Regular.ttf"),
    Inter: require("./src/assets/fonts/Inter.ttf"),
  });

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

  const initialize = async () => {
    try {
      const appearance = Appearance.getColorScheme() || "light";
      await Promise.all([
        checkForUpdates(),
        initializeTheme(appearance),
        checkAuthStatus(SplashScreen.hideAsync),
      ]);
    } catch (error) {
      console.error("Initialization error:", error);
    }
  };

  useEffect(() => {
    initialize().finally(initializePfp);
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
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaProvider>
        <NavigationContainer>
          {isAuthenticated ? <RootNavigator /> : <LoginScreen />}
        </NavigationContainer>
        <Toast />
        {/* <NewUpdateAlertModal defaultVisible={false}/> */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
