import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { ThemeColors } from "../../types/theme";
import { useThemeStore } from "../../state/themeStore";

type AnimatedHeartProps = {
  size?: number;
  color?: string;
  pulses?: number;
};

export default function AnimatedHeart({
  size = 16,
  color = "red",
  pulses = 3,
}: AnimatedHeartProps) {
  const scale = useSharedValue(1);
  const colors = useThemeStore((state) => state.colors);

  const styles = createStyles(colors);

  const isAnimatingRef = useRef(false);

  const resetAnimation = () => {
    scale.value = withTiming(1, { duration: 120 });
    isAnimatingRef.current = false;
  };

  const handlePress = () => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    const up = withTiming(1.4, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    const down = withTiming(1, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
    scale.value = withSequence(
      withRepeat(withSequence(up, down), pulses, false),
      withTiming(
        1,
        { duration: 200, easing: Easing.in(Easing.ease) },
        (finished) => {
          if (finished) runOnJS(resetAnimation)();
        }
      )
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={1}
      style={styles.container}
    >
      <Text style={styles.heartText}>Made Wid</Text>
      <Animated.View style={animatedStyle}>
        <Ionicons name="heart" size={size} color={color} />
      </Animated.View>
      <Text style={styles.heartText}>by Kichu</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    heartText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      fontFamily: "Fredoka-Regular",
    },
    container: {
      flexDirection: "row",
      flexWrap: "nowrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
  });
