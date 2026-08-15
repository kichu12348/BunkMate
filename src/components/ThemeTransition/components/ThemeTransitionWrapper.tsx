import React, { useEffect, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useThemeTransitionStore } from "../state/themeTransitionStore";
import { ThemeTransitionOverlay } from "./ThemeTransitionOverlay";
import { ThemeTransitionWrapperProps } from "../types";

export const ThemeTransitionWrapper: React.FC<ThemeTransitionWrapperProps> = ({
  children,
  style,
}) => {
  const rootViewRef = useRef<View>(null);
  const setRootViewRef = useThemeTransitionStore(
    (state) => state.setRootViewRef,
  );

  useEffect(() => {
    setRootViewRef(rootViewRef);
    return () => setRootViewRef(null);
  }, [setRootViewRef]);

  return (
    <View style={[styles.container, style]}>
      {/* Wrap only the children in the ref so the snapshot ignores the overlay */}
      <View ref={rootViewRef} collapsable={false} style={styles.container}>
        {children}
      </View>
      <ThemeTransitionOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

