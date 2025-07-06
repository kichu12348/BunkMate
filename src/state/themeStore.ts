import { create } from 'zustand';
import { ThemeMode, ThemeState } from '../types/theme';
import { lightTheme, darkTheme } from '../constants/colors';
import { kvHelper } from '../kv/kvStore';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light',
  colors: lightTheme,

  setMode: async (mode: ThemeMode) => {
    const colors = mode === 'light' ? lightTheme : darkTheme;
    
    set({ mode, colors });
    
    // Persist theme preference
    try {
      await kvHelper.setThemeMode(mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  },

  toggleMode: async () => {
    const currentMode = get().mode;
    const newMode = currentMode === 'light' ? 'dark' : 'light';
    await get().setMode(newMode);
  },
  initializeTheme: async () => {

    try {
      const savedMode = await kvHelper.getThemeMode();
      if (savedMode) {
        set({ mode: savedMode, colors: savedMode === "light" ? lightTheme : darkTheme });
      }
    } catch (error) {
      console.error("Error initializing theme:", error);
    }
  },
}));

