import Animated, {
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { runOnJS } from "react-native-worklets";

export default function Modal({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1);
      translateY.value = withTiming(0);
    } else {
      opacity.value = withTiming(0);
      translateY.value = withTiming(-100, {}, (fin) => {
        if (fin) runOnJS(setIsVisible)(false);
      });
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.modal, style]}>{children}</Animated.View>
  );
}

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
  },
});
