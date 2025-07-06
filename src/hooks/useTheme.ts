import { useThemeStore } from '../state/themeStore';
import { ThemeColors } from '../types/theme';

export const useTheme = () => {
  const { mode, colors, setMode, toggleMode, initializeTheme } = useThemeStore();

  return {
    mode,
    colors,
    setMode,
    toggleMode,
    initializeTheme,
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
