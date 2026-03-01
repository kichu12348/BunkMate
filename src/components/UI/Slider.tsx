import { StyleSheet, View } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { useThemeStore } from "../../state/themeStore";

interface SliderProps {
  setValue?: (value: number) => void;
  handleValueChange?: (value: number) => void;
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  height?: number;
  width?: number;
  thumbSize?: number;
}

const Slider = ({
  setValue,
  handleValueChange,
  value = 0,
  minimumValue = 0,
  maximumValue = 100,
  height = 8,
  width = 300,
  thumbSize = 24,
}: SliderProps) => {
  const colors = useThemeStore((s) => s.colors);
  const thumbColor = colors.primary;
  const trackColor = colors.border;
  const minimumTrackTintColor = colors.primary;
  const range = maximumValue - minimumValue;
  const sliderWidth = width - thumbSize;

  const initialPercentage = Math.max(
    0,
    Math.min((value - minimumValue) / range, 1),
  );
  const initialTranslateX = initialPercentage * sliderWidth;

  const isInteracting = useSharedValue(false);
  const translateX = useSharedValue(initialTranslateX);
  const contextX = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      isInteracting.value = true;
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      let newTranslation = contextX.value + e.translationX;
      newTranslation = Math.max(0, Math.min(newTranslation, sliderWidth));
      translateX.value = newTranslation;
      const newValue = minimumValue + (translateX.value / sliderWidth) * range;
      if (handleValueChange) {
        runOnJS(handleValueChange)(Math.floor(newValue));
      }
    })
    .onEnd((e) => {
      const newValue = minimumValue + (translateX.value / sliderWidth) * range;
      if (setValue) {
        runOnJS(setValue)(Math.floor(newValue));
      }
      isInteracting.value = false;
    });

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      width: translateX.value + thumbSize / 2,
    };
  });

  return (
    <View
      style={[styles.container, { width, height: Math.max(height, thumbSize) }]}
    >
      <View
        style={[
          styles.track,
          {
            width,
            height,
            backgroundColor: trackColor,
            top: (Math.max(height, thumbSize) - height) / 2,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.activeTrack,
          {
            height,
            backgroundColor: minimumTrackTintColor,
            top: (Math.max(height, thumbSize) - height) / 2,
          },
          animatedTrackStyle,
        ]}
      />

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              backgroundColor: thumbColor,
              top: (Math.max(height, thumbSize) - thumbSize) / 2,
            },
            animatedThumbStyle,
          ]}
        >
          <View
            style={[styles.thumbInner, { backgroundColor: colors.surface }]}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    borderRadius: 100,
  },
  activeTrack: {
    position: "absolute",
    borderRadius: 100,
  },
  thumb: {
    position: "absolute",
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbInner: {
    width: "70%",
    height: "70%",
    borderRadius: 100,
  },
});

export default Slider;
