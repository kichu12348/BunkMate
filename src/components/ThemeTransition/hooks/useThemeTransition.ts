import { useThemeStore } from "../../../state/themeStore";

/**
 * Hook providing access to the theme transition trigger, active transition
 * status, and the deferred status bar style (flips only after animation ends).
 */
export const useThemeTransition = () => {
  const isTransitioning = useThemeStore((state) => state.isTransitioning);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const statusBarStyle = useThemeStore((state) => state.statusBarStyle);

  return {
    isTransitioning,
    toggleModeWithTransition: toggleMode,
    toggleMode,
    statusBarStyle,
  };
};

