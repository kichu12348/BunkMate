import { useEffect } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  size?: number;
  thumbEnabledColor?: string;
  thumbDisabledColor?: string;
  trackEnabledColor?: string;
  trackDisabledColor?: string;
}

export default function Switch({
  value,
  onValueChange,
  size = 50,
  thumbEnabledColor = "#ffffff",
  thumbDisabledColor = "#f0f0f0",
  trackEnabledColor = "#4caf50",
  trackDisabledColor = "#888888",
}: SwitchProps) {
  const switchWidth = size * 2;
  const switchHeight = size;
  const thumbSize = size - 10;
  const trackPadding = 5;

  const rightPosition = switchWidth - thumbSize - trackPadding;

  const translateX = useSharedValue(value ? rightPosition : trackPadding);
  const progress = useSharedValue(value ? 1 : 0); // 0 = disabled, 1 = enabled

  // Animate when value changes
  useEffect(() => {
    const targetX = value ? rightPosition : trackPadding;
    translateX.value = withTiming(targetX, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    progress.value = withTiming(value ? 1 : 0, {
      duration: 220,
      easing: Easing.inOut(Easing.ease),
    });
  }, [value, rightPosition, trackPadding, translateX, progress]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [thumbDisabledColor, thumbEnabledColor]
    ),
  }));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [trackDisabledColor, trackEnabledColor]
    ),
  }));

  const handlePress = () => {
    onValueChange(!value);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.switch,
          animatedTrackStyle,
          { width: switchWidth, height: switchHeight },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              top: trackPadding,
              borderRadius: thumbSize / 2,
            },
            animatedThumbStyle,
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  switch: {
    borderRadius: 50,
    padding: 2,
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    position: "absolute",
    left: 0,
  },
});
