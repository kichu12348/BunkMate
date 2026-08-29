import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useThemeStore } from "../../../state/themeStore";
import { ThemeTransitionOverlayProps } from "../types";

export const ThemeTransitionOverlay: React.FC<ThemeTransitionOverlayProps> = ({
  duration = 250,
}) => {
  const isTransitioning = useThemeStore((s) => s.isTransitioning);
  const previousBackground = useThemeStore((s) => s.previousBackground);
  const endTransition = useThemeStore((s) => s.endTransition);

  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (isTransitioning && previousBackground) {
      opacity.value = 1;
      opacity.value = withTiming(
        0,
        {
          duration,
          easing: Easing.out(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(endTransition)();
          }
        }
      );
    }
  }, [isTransitioning, previousBackground, duration, endTransition, opacity]);

  if (!isTransitioning || !previousBackground) {
    return null;
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.overlay,
        { backgroundColor: previousBackground },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 999999,
    elevation: 999999,
  },
});
