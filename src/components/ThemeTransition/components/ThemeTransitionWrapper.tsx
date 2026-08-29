import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemeTransitionOverlay } from "./ThemeTransitionOverlay";
import { ThemeTransitionWrapperProps } from "../types";

export const ThemeTransitionWrapper: React.FC<ThemeTransitionWrapperProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {children}
      <ThemeTransitionOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

