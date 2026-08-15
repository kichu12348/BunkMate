import { useThemeStore } from '../state/themeStore';
import { useThemeTransitionStore } from '../components/ThemeTransition/state/themeTransitionStore';
import { ThemeColors } from '../types/theme';

export const useTheme = () => {
  const { mode, colors, setMode, toggleMode, initializeTheme } = useThemeStore();
  const toggleModeWithTransition = useThemeTransitionStore(
    (state) => state.toggleModeWithTransition
  );
  const isTransitioning = useThemeTransitionStore(
    (state) => state.isTransitioning
  );
  const statusBarStyle = useThemeTransitionStore(
    (state) => state.statusBarStyle
  );

  return {
    mode,
    colors,
    setMode,
    toggleMode,
    toggleModeWithTransition,
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
