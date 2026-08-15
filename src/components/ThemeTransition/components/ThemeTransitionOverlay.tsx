import React, { useCallback, useEffect } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import {
  Canvas,
  Image,
  Circle,
  ImageShader,
} from "@shopify/react-native-skia";
import { useThemeTransitionStore } from "../state/themeTransitionStore";
import { useCircularRevealAnimation } from "../hooks/useCircularRevealAnimation";
import { ThemeTransitionOverlayProps } from "../types";

/**
 * Telegram-style circular ripple overlay.
 *
 * Render order:
 *   1. <Image overlay1>            — old theme fills the canvas (base layer)
 *   2. <Circle cx cy r={animated}> — expanding circle clips the new theme
 *        └─ <ImageShader overlay2> — new theme revealed inside the circle
 */
export const ThemeTransitionOverlay: React.FC<ThemeTransitionOverlayProps> = ({
  width: customWidth,
  height: customHeight,
}) => {
  const windowDimensions = useWindowDimensions();
  const width = customWidth ?? windowDimensions.width;
  const height = customHeight ?? windowDimensions.height;

  const overlay1 = useThemeTransitionStore((s) => s.overlay1);
  const overlay2 = useThemeTransitionStore((s) => s.overlay2);
  const circleX = useThemeTransitionStore((s) => s.circleX);
  const circleY = useThemeTransitionStore((s) => s.circleY);
  const circleRadius = useThemeTransitionStore((s) => s.circleRadius);
  const endTransition = useThemeTransitionStore((s) => s.endTransition);

  const handleAnimationEnd = useCallback(() => {
    endTransition();
  }, [endTransition]);

  const { animatedRadius, startTransition, resetTransition } =
    useCircularRevealAnimation({
      duration: 550,
      onAnimationEnd: handleAnimationEnd,
    });

  // Start the Skia animation as soon as both snapshots are ready
  useEffect(() => {
    if (overlay1 && overlay2) {
      startTransition(circleX, circleY, circleRadius);
    } else {
      resetTransition();
    }
  }, [overlay1, overlay2]);

  // Nothing to render when there are no snapshots
  if (!overlay1 || !overlay2) {
    return null;
  }

  return (
    <Canvas
      style={[StyleSheet.absoluteFill, styles.overlay, { width, height }]}
      pointerEvents="none"
    >
      {/* Base layer: old theme snapshot fills the entire canvas */}
      <Image
        image={overlay1}
        x={0}
        y={0}
        width={width}
        height={height}
        fit="cover"
      />

      {/*
       * Expanding circle — in Skia, child paint nodes (like ImageShader)
       * are clipped to the parent shape's bounds, giving us the circular
       * reveal of the new theme.
       */}
      <Circle cx={circleX} cy={circleY} r={animatedRadius}>
        <ImageShader
          image={overlay2}
          x={0}
          y={0}
          width={width}
          height={height}
          fit="cover"
        />
      </Circle>
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
