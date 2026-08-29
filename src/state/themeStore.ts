import { create } from "zustand";
import { ThemeMode, ThemeState } from "../types/theme";
import { lightTheme, darkTheme } from "../constants/colors";
import { kvHelper } from "../kv/kvStore";

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "dark",
  colors: darkTheme,
  isTransitioning: false,
  previousBackground: null,
  statusBarStyle: "light-content",

  setMode: (mode: ThemeMode) => {
    const colors = mode === "light" ? lightTheme : darkTheme;
    const statusBarStyle = mode === "dark" ? "light-content" : "dark-content";

    set({ mode, colors, statusBarStyle });

    try {
      kvHelper.setThemeMode(mode);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  },

  toggleMode: () => {
    const { mode, colors, isTransitioning } = get();
    if (isTransitioning) return;

    const newMode: ThemeMode = mode === "light" ? "dark" : "light";
    const newColors = newMode === "light" ? lightTheme : darkTheme;

    set({
      mode: newMode,
      colors: newColors,
      isTransitioning: true,
      previousBackground: colors.background,
    });

    try {
      kvHelper.setThemeMode(newMode);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  },

  endTransition: () => {
    const currentMode = get().mode;
    set({
      isTransitioning: false,
      previousBackground: null,
      statusBarStyle: currentMode === "dark" ? "light-content" : "dark-content",
    });
  },

  initializeTheme: async (appearance: "light" | "dark") => {
    try {
      const savedMode = kvHelper.getThemeMode();
      if (savedMode === "light" || savedMode === "dark") {
        set({
          mode: savedMode,
          colors: savedMode === "light" ? lightTheme : darkTheme,
          statusBarStyle:
            savedMode === "dark" ? "light-content" : "dark-content",
        });
      } else {
        const initialMode = appearance === "light" ? "light" : "dark";
        get().setMode(initialMode);
      }
    } catch (error) {
      console.error("Error initializing theme:", error);
    }
  },
}));
