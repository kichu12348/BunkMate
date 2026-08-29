import { StyleProp, ViewStyle } from "react-native";

export interface ThemeTransitionOverlayProps {
  duration?: number;
}

export interface ThemeTransitionWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

