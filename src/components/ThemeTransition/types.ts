import { View, StyleProp, ViewStyle } from "react-native";
import { SkImage } from "@shopify/react-native-skia";

export interface TransitionOrigin {
  x: number;
  y: number;
}

export interface ThemeTransitionStoreState {
  isTransitioning: boolean;
  snapshot: SkImage | null;
  origin: TransitionOrigin | null;
  rootViewRef: React.RefObject<View | null> | null;
  setRootViewRef: (ref: React.RefObject<View | null> | null) => void;
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
