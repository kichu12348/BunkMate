import { useThemeTransitionStore } from "../state/themeTransitionStore";

/**
 * Hook providing access to the theme transition trigger, active transition
 * status, and the deferred status bar style (flips only after animation ends).
 */
export const useThemeTransition = () => {
  const isTransitioning = useThemeTransitionStore(
    (state) => state.isTransitioning
  );
  const toggleModeWithTransition = useThemeTransitionStore(
    (state) => state.toggleModeWithTransition
  );
  const statusBarStyle = useThemeTransitionStore(
    (state) => state.statusBarStyle
  );

  return {
    isTransitioning,
    toggleModeWithTransition,
    statusBarStyle,
  };
};
