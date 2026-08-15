import { useThemeTransitionStore } from "../state/themeTransitionStore";

/**
 * Hook providing access to the theme transition trigger and active transition status.
 */
export const useThemeTransition = () => {
  const isTransitioning = useThemeTransitionStore(
    (state) => state.isTransitioning
  );
  const toggleModeWithTransition = useThemeTransitionStore(
    (state) => state.toggleModeWithTransition
  );

  return {
    isTransitioning,
    toggleModeWithTransition,
  };
};
