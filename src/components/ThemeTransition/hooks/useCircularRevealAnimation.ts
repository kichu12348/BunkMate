import { useCallback } from "react";
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface UseCircularRevealAnimationOptions {
  duration?: number;
  onAnimationEnd: () => void;
}

export const useCircularRevealAnimation = ({
  duration = 550,
  onAnimationEnd,
}: UseCircularRevealAnimationOptions) => {
  // 0 → 1 progress value that drives the radius
  const transition = useSharedValue(0);

  // Circle centre and target radius — set before starting the animation
  const circleX = useSharedValue(0);
  const circleY = useSharedValue(0);
  const maxRadius = useSharedValue(0);

  // Derived animated radius: linearly interpolates 0 → maxRadius
  // mix(t, 0, max) === t * max — avoids the removed `mix` export in Reanimated v4
  const animatedRadius = useDerivedValue(
    () => transition.value * maxRadius.value
  );

  /**
   * Call this once both overlay1 and overlay2 are ready.
   * Sets the circle origin / max radius, resets progress, then animates.
   */
  const startTransition = useCallback(
    (cx: number, cy: number, radius: number) => {
      circleX.value = cx;
      circleY.value = cy;
      maxRadius.value = radius;
      transition.value = 0;

      transition.value = withTiming(
        1,
        {
          duration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationEnd)();
          }
        }
      );
    },
    [duration, onAnimationEnd]
  );

  /** Immediately reset the animation (e.g. on unmount) */
  const resetTransition = useCallback(() => {
    transition.value = 0;
  }, []);

  return {
    animatedRadius,
    circleX,
    circleY,
    startTransition,
    resetTransition,
  };
};
