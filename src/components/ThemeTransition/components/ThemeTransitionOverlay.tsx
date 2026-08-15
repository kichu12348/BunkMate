import React, { useCallback } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Group, Image, Circle } from "@shopify/react-native-skia";
import { useThemeTransitionStore } from "../state/themeTransitionStore";
import { useCircularRevealAnimation } from "../hooks/useCircularRevealAnimation";
import { ThemeTransitionOverlayProps } from "../types";

export const ThemeTransitionOverlay: React.FC<ThemeTransitionOverlayProps> = ({
  width: customWidth,
  height: customHeight,
}) => {
  const windowDimensions = useWindowDimensions();
  const width = customWidth || windowDimensions.width;
  const height = customHeight || windowDimensions.height;

  const snapshot = useThemeTransitionStore((state) => state.snapshot);
  const origin = useThemeTransitionStore((state) => state.origin);
  const endTransition = useThemeTransitionStore((state) => state.endTransition);

  const handleAnimationEnd = useCallback(() => {
    endTransition();
  }, [endTransition]);

  const { clipPath, radius, circleX, circleY } = useCircularRevealAnimation({
    active: !!snapshot,
    origin,
    width,
    height,
    duration: 750,
    onAnimationEnd: handleAnimationEnd,
  });

  if (!snapshot) {
    return null;
  }

  return (
    <Canvas
      style={[StyleSheet.absoluteFill, styles.overlay, { width, height }]}
      pointerEvents="none"
    >
      <Group clip={clipPath} invertClip={true}>
        <Image
          image={snapshot}
          x={0}
          y={0}
          width={width}
          height={height}
          fit="cover"
        />
      </Group>
      <Circle
        cx={circleX}
        cy={circleY}
        r={radius}
        color="rgba(150, 150, 150, 0.2)"
        style="stroke"
        strokeWidth={1.5}
      />
    </Canvas>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
  },
});
