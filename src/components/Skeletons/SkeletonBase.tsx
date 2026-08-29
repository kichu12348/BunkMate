import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  DimensionValue,
  TextStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";

interface SkeletonProps {
  style?: StyleProp<ViewStyle & TextStyle>;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
}

export const SkeletonShimmerProvider: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.shimmerContainer, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
};

export const SkeletonBox: React.FC<SkeletonProps> = ({
  style,
  width = "100%",
  height = 16,
  borderRadius = 8,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
        },
        style,
      ]}
    />
  );
};

export const SkeletonText: React.FC<SkeletonProps> = ({
  style,
  width = "80%",
  height = 14,
  borderRadius = 6,
}) => {
  return (
    <SkeletonBox
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

export const SkeletonCircle: React.FC<{
  size?: number;
  style?: StyleProp<ViewStyle>;
}> = ({ size = 40, style }) => {
  return (
    <SkeletonBox
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});
