import React, { useCallback, useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Image, Group } from "@shopify/react-native-skia";
import { useThemeTransitionStore } from "../state/themeTransitionStore";
import { useCircularRevealAnimation } from "../hooks/useCircularRevealAnimation";
import { ThemeTransitionOverlayProps } from "../types";

export const ThemeTransitionOverlay: React.FC<ThemeTransitionOverlayProps> = ({
  width: customWidth,
  height: customHeight,
}) => {
  const windowDimensions = useWindowDimensions();
  const width = customWidth ?? windowDimensions.width;
  const height = customHeight ?? windowDimensions.height;

  const overlay1 = useThemeTransitionStore((s) => s.overlay1);
  const circleX = useThemeTransitionStore((s) => s.circleX);
  const circleY = useThemeTransitionStore((s) => s.circleY);
  const circleRadius = useThemeTransitionStore((s) => s.circleRadius);
  const endTransition = useThemeTransitionStore((s) => s.endTransition);

  const handleAnimationEnd = useCallback(() => {
    endTransition();
  }, [endTransition]);

  const { clipPath, startTransition, resetTransition } =
    useCircularRevealAnimation({
      duration: 750,
      onAnimationEnd: handleAnimationEnd,
    });

  useEffect(() => {
    if (overlay1) {
      startTransition(circleX, circleY, circleRadius);
    } else {
      resetTransition();
    }
  }, [
    overlay1,
    circleX,
    circleY,
    circleRadius,
    startTransition,
    resetTransition,
  ]);

  // Keep overlay mounted only while transition snapshot is active
  if (!overlay1) {
    return null;
  }

  return (
    <Canvas
      style={[StyleSheet.absoluteFill, styles.overlay, { width, height }]}
      pointerEvents="none"
    >
      <Group clip={clipPath} invertClip={true}>
        <Image
          image={overlay1}
          x={0}
          y={0}
          width={width}
          height={height}
          fit="cover"
        />
      </Group>
    </Canvas>
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
