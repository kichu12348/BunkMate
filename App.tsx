import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuthStore } from "./src/state/auth";
import { useTheme } from "./src/hooks/useTheme";
import AuthNavigator from "./src/screens/Login";
import { RootNavigator } from "./src/navigation/RootNavigator";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableScreens } from "react-native-screens";
import { StatusBar, Appearance } from "react-native"; // Import View
import * as SystemUI from "expo-system-ui";
import * as Update from "expo-updates";
import { useFonts } from "expo-font";
import Toast from "./src/components/UI/toast";
//import NewUpdateAlertModal from "./src/components/Modals/NewUpdateAlert";

enableScreens();

SplashScreen.preventAutoHideAsync();

let isSplashScreenHidden = false;

const hideSplashScreen = () => {
  if (!isSplashScreenHidden) {
    SplashScreen.hide();
    isSplashScreenHidden = true;
  }
};

export default function App() {
  const { initializeTheme, colors, isDark } = useTheme();
  const { isAuthenticated, checkAuthStatus } = useAuthStore();

  const [appIsReady, setAppIsReady] = useState(false);

  const [fontsLoaded, error] = useFonts({
    "Fredoka-Regular": require("./src/assets/fonts/Fredoka-Regular.ttf"),
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

  useEffect(() => {
    const initialize = async () => {
      if (appIsReady) return;
      try {
        await Promise.all([
          checkForUpdates(),
          initializeTheme(Appearance.getColorScheme() || "light"),
          checkAuthStatus(),
        ]);
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (fontsLoaded || error) {
          setAppIsReady(true);
        }
      }
    };

    initialize();
  }, [fontsLoaded, error]);

  useEffect(() => {
    if (colors.background) {
      const setNavigationBarColor = async () => {
        try {
          SystemUI.setBackgroundColorAsync(colors.background);
        } catch (error) {
          console.error("Error setting navigation bar color:", error);
        }
      };
      setNavigationBarColor();
    }
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
        <NavigationContainer onReady={hideSplashScreen}>
          {appIsReady &&
            (isAuthenticated ? <RootNavigator /> : <AuthNavigator />)}
        </NavigationContainer>
        <Toast />
        {/* <NewUpdateAlertModal defaultVisible={false}/> */}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
