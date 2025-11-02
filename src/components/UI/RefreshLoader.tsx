import React from "react";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  useSharedValue,
  SharedValue,
  interpolate,
  Extrapolation,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { useThemeStore } from "../../state/themeStore";

const REFRESH_THRESHOLD = 80;
const MAX_PULL = 120;
const OPEN_DURATION = 300;
const CLOSE_DURATION = 220;
const OPEN_EASING = Easing.out(Easing.cubic);
const CLOSE_EASING = Easing.out(Easing.cubic);
const CustomLoader = ({
  pullProgress,
  size = 1,
}: {
  pullProgress: SharedValue<number>;
  size?: number;
}) => {
  const autoT = useSharedValue(0);
  const colors = useThemeStore((state) => state.colors);

  React.useEffect(() => {
    autoT.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const makeDotStyle = (phase: number) =>
    useAnimatedStyle(() => {
      const rawT =
        pullProgress.value >= 1 ? autoT.value : pullProgress.value * 2;
      const t = rawT % 1;
      const progress = (t + phase) % 1;

      const a = 14 * size;
      const u = progress * 2 * Math.PI;
      const x = a * Math.sin(u);
      const y = (a / 2) * Math.sin(2 * u);

      const color = interpolateColor(
        progress,
        [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1],
        [
          colors.loaderColors[0],
          colors.loaderColors[1],
          colors.loaderColors[2],
          colors.loaderColors[3],
          colors.loaderColors[4],
          colors.loaderColors[5],
          colors.loaderColors[6],
          colors.loaderColors[7],
        ]
      );

      const opacity = interpolate(
        progress,
        [0, 0.1, 0.9, 1],
        [0.3, 1, 1, 0.3],
        Extrapolation.CLAMP
      );

      const scale = interpolate(
        progress,
        [0, 0.5, 1],
        [0.6, 1, 0.6],
        Extrapolation.CLAMP
      );

      return {
        opacity,
        backgroundColor: color,
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: scale * size },
        ] as any,
      };
    });

  const dots = Array.from({ length: 8 }, (_, i) => i / 8).map((phase, idx) => (
    <Animated.View
      key={idx}
      style={[styles.infinityDot, makeDotStyle(phase)]}
    />
  ));

  return <Animated.View style={styles.loaderContainer}>{dots}</Animated.View>;
};

const CustomRefreshLoader = ({
  isRefreshing,
  onRefresh,
  children,
  scrollGesture,
  size = 1,
  shouldShowLoader = true, // new prop
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
  children?: React.ReactNode;
  scrollGesture?: any;
  size?: number;
  shouldShowLoader?: boolean;
}) => {
  const translationY = useSharedValue(0);
  const pullProgress = useSharedValue(0);

  React.useEffect(() => {
    if (isRefreshing) {
      translationY.value = withTiming(REFRESH_THRESHOLD, {
        duration: OPEN_DURATION,
        easing: OPEN_EASING,
      });
      pullProgress.value = 1; // trigger continuous loop
    } else {
      translationY.value = withTiming(0, {
        duration: CLOSE_DURATION,
        easing: CLOSE_EASING,
      });
      pullProgress.value = 0;
    }
  }, [isRefreshing]);

  const dragGesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetY(-10)
    .simultaneousWithExternalGesture(scrollGesture)
    .onUpdate((e) => {
      // Only allow pull when shouldShowLoader is true
      if (e.translationY > 0 && !isRefreshing && shouldShowLoader) {
        const dampenedTranslation = Math.min(e.translationY * 0.5, MAX_PULL);
        translationY.value = dampenedTranslation;
        pullProgress.value = interpolate(
          dampenedTranslation,
          [0, REFRESH_THRESHOLD],
          [0, 1],
          Extrapolation.CLAMP
        );
      }
    })
    .onEnd(() => {
      if (
        !isRefreshing &&
        translationY.value > REFRESH_THRESHOLD &&
        shouldShowLoader
      ) {
        runOnJS(onRefresh)();
      } else if (!isRefreshing) {
        translationY.value = withTiming(0, {
          duration: CLOSE_DURATION,
          easing: CLOSE_EASING,
        });
        pullProgress.value = withTiming(0, {
          duration: CLOSE_DURATION,
          easing: CLOSE_EASING,
        });
      }
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translationY.value }],
  }));

  const indicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translationY.value,
      [0, REFRESH_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translationY.value,
      [0, REFRESH_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={styles.container}>
        {shouldShowLoader && (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicator, indicatorStyle]}
          >
            <CustomLoader pullProgress={pullProgress} size={size} />
          </Animated.View>
        )}

        <Animated.View style={[styles.content, containerStyle]}>
          {children}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
    alignSelf: "stretch",
  },
  indicator: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    zIndex: 10,
  },
  loaderContainer: {
    width: 50,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  infinityDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

export default CustomRefreshLoader;
