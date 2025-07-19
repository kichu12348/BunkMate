import { useRef } from "react";
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
  thumbColor?: string;
  trackColor?: string;
}

export default function Switch({
  value,
  onValueChange,
  size = 50,
  thumbColor,
  trackColor,
}: SwitchProps) {
  const switchWidth = size * 2;
  const switchHeight = size;
  const thumbSize = size - 10;
  const trackPadding = 5;

  const rightPosition = switchWidth - thumbSize - trackPadding;
  const translateX = useSharedValue(value ? rightPosition : trackPadding);
  const thumbColorRef = useRef(thumbColor);
  const trackColorRef = useRef(trackColor);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: interpolateColor(
      translateX.value,
      [0, 1],
      [thumbColorRef.current, thumbColor]
    ),
  }));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [0, 1],
      [trackColorRef.current, trackColor]
    ),
  }));

  const handlePress = () => {
    const newValue = !value;
    if (newValue) {
      // Move right
      translateX.value = withTiming(rightPosition, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      // Move left
      translateX.value = withTiming(trackPadding, {
        duration: 200,
        easing: Easing.inOut(Easing.ease),
      });
    }
    onValueChange(newValue);
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
            animatedThumbStyle,
            {
              width: thumbSize,
              height: thumbSize,
              backgroundColor: thumbColor,
              top: trackPadding,
              borderRadius: thumbSize / 2,
            },
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
