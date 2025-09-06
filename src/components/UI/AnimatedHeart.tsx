import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";

type AnimatedHeartProps = {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  size?: number;
  color?: string;
  pulses?: number;
};

export default function AnimatedHeart({
  isActive,
  setIsActive,
  size = 16,
  color = "red",
  pulses = 3,
}: AnimatedHeartProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
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
            if (finished) runOnJS(setIsActive)(false);
          }
        )
      );
    } else {
      scale.value = withTiming(1, { duration: 120 });
    }
  }, [isActive, scale, setIsActive, pulses]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name="heart"
        size={size}
        color={color}
        style={{ verticalAlign: "middle" }}
      />
    </Animated.View>
  );
}



// interface FilterBarProps {
//   activeFilter: SubjectFilter;
//   onFilterChange: (filter: SubjectFilter) => void;
// }

// const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
//   const styles = useThemedStyles(createStyles);
//   const filters: { label: string; value: SubjectFilter }[] = [
//     { label: "All", value: "all" },
//     { label: "Critical", value: "danger" },
//     { label: "Warning", value: "warning" },
//     { label: "Safe", value: "safe" },
//   ];

//   return (
//     <View style={styles.filterBarContainer}>
//       {filters.map((filter) => (
//         <TouchableOpacity
//           key={filter.value}
//           style={[
//             styles.filterButton,
//             activeFilter === filter.value && styles.filterButtonActive,
//           ]}
//           onPress={() => onFilterChange(filter.value)}
//         >
//           <Text
//             style={[
//               styles.filterButtonText,
//               activeFilter === filter.value && styles.filterButtonTextActive,
//             ]}
//           >
//             {filter.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// };