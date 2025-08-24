import { useRef, useEffect } from "react";
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

  const prevThumbColorRef = useRef(thumbColor || "#ffffff");
  const prevTrackColorRef = useRef(trackColor || "#888888");

  const thumbColorFrom = useSharedValue(prevThumbColorRef.current);
  const thumbColorTo = useSharedValue(thumbColor || prevThumbColorRef.current);
  const thumbColorProgress = useSharedValue(1);

  const trackColorFrom = useSharedValue(prevTrackColorRef.current);
  const trackColorTo = useSharedValue(trackColor || prevTrackColorRef.current);
  const trackColorProgress = useSharedValue(1);

  // Animate translation when value prop changes externally
  useEffect(() => {
    const target = value ? rightPosition : trackPadding;
    translateX.value = withTiming(target, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [value, rightPosition, trackPadding, translateX]);

  // Animate thumb color when thumbColor prop changes
  useEffect(() => {
    if (!thumbColor) return;
    if (thumbColorTo.value === thumbColor) return; // no change
    thumbColorFrom.value = thumbColorTo.value; // previous target becomes new start
    prevThumbColorRef.current = thumbColorFrom.value;
    thumbColorTo.value = thumbColor; // new target
    thumbColorProgress.value = 0;
    thumbColorProgress.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [thumbColor, thumbColorFrom, thumbColorTo, thumbColorProgress]);

  // Animate track color when trackColor prop changes
  useEffect(() => {
    if (!trackColor) return;
    if (trackColorTo.value === trackColor) return;
    trackColorFrom.value = trackColorTo.value;
    prevTrackColorRef.current = trackColorFrom.value;
    trackColorTo.value = trackColor;
    trackColorProgress.value = 0;
    trackColorProgress.value = withTiming(1, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [trackColor, trackColorFrom, trackColorTo, trackColorProgress]);

  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    backgroundColor: interpolateColor(
      thumbColorProgress.value,
      [0, 1],
      [thumbColorFrom.value, thumbColorTo.value]
    ),
  }));

  const animatedTrackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      trackColorProgress.value,
      [0, 1],
      [trackColorFrom.value, trackColorTo.value]
    ),
  }));

  const handlePress = () => {
    onValueChange(!value); // parent drives value; translation animates in effect
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
