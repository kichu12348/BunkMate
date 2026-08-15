import React from "react";
import { View } from "react-native";
import { makeImageFromView, SkImage } from "@shopify/react-native-skia";

/**
 * Safely captures a Skia SkImage snapshot from a React Native View ref.
 * Returns null if the ref is invalid, unmounted, or if snapshot generation fails.
 */
export const captureViewSnapshot = async (
  viewRef: React.RefObject<View | null> | null
): Promise<SkImage | null> => {
  if (!viewRef || !viewRef.current) {
    return null;
  }

  try {
    const snapshot = await makeImageFromView(viewRef as React.RefObject<View>);
    return snapshot;
  } catch (error) {
    console.warn("[ThemeTransition] Failed to capture view snapshot:", error);
    return null;
  }
};
