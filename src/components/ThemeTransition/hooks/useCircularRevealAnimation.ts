import { useCallback } from "react";
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Skia } from "@shopify/react-native-skia";

interface UseCircularRevealAnimationOptions {
  duration?: number;
  onAnimationEnd: () => void;
}

export const useCircularRevealAnimation = ({
  duration = 550,
  onAnimationEnd,
}: UseCircularRevealAnimationOptions) => {
  // 0 → 1 progress value that drives the expanding circle
  const transition = useSharedValue(0);

  // Circle centre and target radius (UI-thread shared values)
  const circleX = useSharedValue(0);
  const circleY = useSharedValue(0);
  const maxRadius = useSharedValue(0);

  // Derived Skia Path for circular cutout clipping
  const clipPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const r = Math.max(0, transition.value * maxRadius.value);
    path.addCircle(circleX.value, circleY.value, r);
    return path;
  });

  /**
   * Start the circular reveal animation.
   */
  const startTransition = useCallback(
    (cx: number, cy: number, radius: number) => {
      circleX.value = typeof cx === "number" && !isNaN(cx) ? cx : 0;
      circleY.value = typeof cy === "number" && !isNaN(cy) ? cy : 0;
      maxRadius.value = typeof radius === "number" && !isNaN(radius) ? radius : 0;
      transition.value = 0;

      transition.value = withTiming(
        1,
        {
          duration,
          easing: Easing.bezier(0.2, 0, 0, 1),
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

  /** Immediately reset the animation */
  const resetTransition = useCallback(() => {
    transition.value = 0;
  }, []);

  return {
    clipPath,
    startTransition,
    resetTransition,
  };
};

