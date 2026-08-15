import { View, StyleProp, ViewStyle } from "react-native";
import { SkImage } from "@shopify/react-native-skia";

export interface TransitionOrigin {
  x: number;
  y: number;
}

export interface ThemeTransitionStoreState {
  // Animation state
  active: boolean;
  overlay1: SkImage | null;
  overlay2: SkImage | null;
  circleX: number;
  circleY: number;
  circleRadius: number;
  statusBarStyle: "light-content" | "dark-content";

  // Root view ref for makeImageFromView
  rootViewRef: React.RefObject<View | null> | null;
  setRootViewRef: (ref: React.RefObject<View | null> | null) => void;

  // Public API
  isTransitioning: boolean;
  toggleModeWithTransition: (origin?: TransitionOrigin) => Promise<void>;
  endTransition: () => void;
}

export interface ThemeTransitionOverlayProps {
  width?: number;
  height?: number;
}

export interface ThemeTransitionWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}
