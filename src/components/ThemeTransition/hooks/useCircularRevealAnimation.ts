import { useEffect } from "react";
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Skia } from "@shopify/react-native-skia";
import { TransitionOrigin } from "../types";
import { calculateMaxRadius, resolveOrigin } from "../utils/transitionMath";

interface UseCircularRevealAnimationOptions {
  active: boolean;
  origin: TransitionOrigin | null;
  width: number;
  height: number;
  duration?: number;
  onAnimationEnd: () => void;
}

export const useCircularRevealAnimation = ({
  active,
  origin,
  width,
  height,
  duration = 5000,
  onAnimationEnd,
}: UseCircularRevealAnimationOptions) => {
  const radius = useSharedValue(0);
  const circleX = useSharedValue(0);
  const circleY = useSharedValue(0);

  useEffect(() => {
    if (active && width > 0 && height > 0) {
      const resolved = resolveOrigin(origin, width, height);
      circleX.value = resolved.x;
      circleY.value = resolved.y;
      radius.value = 0;

      const maxRadius = calculateMaxRadius(resolved, width, height);

      radius.value = withTiming(
        maxRadius,
        {
          duration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationEnd)();
          }
        },
      );
    } else {
      radius.value = 0;
    }
  }, [active, origin, width, height, duration, onAnimationEnd]);

  const clipPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    path.addCircle(circleX.value, circleY.value, radius.value);
    return path;
  });

  return { clipPath, radius, circleX, circleY };
};
