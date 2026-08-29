import { useThemeStore } from '../state/themeStore';
import { ThemeColors } from '../types/theme';

export const useTheme = () => {
  const mode = useThemeStore((state) => state.mode);
  const colors = useThemeStore((state) => state.colors);
  const setMode = useThemeStore((state) => state.setMode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const isTransitioning = useThemeStore((state) => state.isTransitioning);
  const statusBarStyle = useThemeStore((state) => state.statusBarStyle);

  return {
    mode,
    colors,
    setMode,
    toggleMode,
    toggleModeWithTransition: toggleMode,
    initializeTheme,
    isTransitioning,
    statusBarStyle,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };
};

export const useThemedStyles = <T extends Record<string, any>>(
  styleFactory: (colors: ThemeColors) => T
): T => {
  const { colors } = useTheme();
  return styleFactory(colors);
};
