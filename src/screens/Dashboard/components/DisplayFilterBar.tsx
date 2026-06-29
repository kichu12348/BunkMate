import React, { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useThemedStyles } from "../../../hooks/useTheme";
import { useThemeStore } from "../../../state/themeStore";
import { ThemeColors } from "../../../types/theme";
import Text from "../../../components/UI/Text";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";

type DisplayFilter = "all" | "danger" | "warning" | "safe";

interface DisplayFilterBarProps {
  activeDisplayFilter: DisplayFilter;
  setActiveDisplayFilter: (filter: DisplayFilter) => void;
  dangerCount: number;
  warningCount: number;
  safeCount: number;
  isLoading?: boolean;
}

export const DisplayFilterBar: React.FC<DisplayFilterBarProps> = ({
  activeDisplayFilter,
  setActiveDisplayFilter,
  dangerCount,
  warningCount,
  safeCount,
  isLoading = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  const opacityOffset = useSharedValue(0.4);

  useEffect(() => {
    if (!isLoading) {
      opacityOffset.value = 1;
      return;
    }

    opacityOffset.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [isLoading, opacityOffset]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: opacityOffset.value,
  }));

  if (isLoading) {
    return (
      <Animated.View style={[styles.displayFilterContainer, shimmerStyle]}>
        {[1, 2, 3, 4].map((_, index) => (
          <View
            key={index}
            style={[styles.displayFilterButton, styles.skeletonButton]}
          >
            <Text
              style={[
                styles.displayFilterText,
                {
                  color: "transparent",
                },
              ]}
            >
              .
            </Text>
          </View>
        ))}
      </Animated.View>
    );
  }

  return (
    <View style={styles.displayFilterContainer}>
      <TouchableOpacity
        style={[
          styles.displayFilterButton,
          activeDisplayFilter === "all" && styles.displayFilterButtonActive,
        ]}
        onPress={() => setActiveDisplayFilter("all")}
      >
        <Text
          style={[
            styles.displayFilterText,
            activeDisplayFilter === "all" && { color: colors.primary },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.displayFilterButton,
          activeDisplayFilter === "danger" && [
            styles.displayFilterButtonActive,
            { borderColor: colors.danger },
          ],
        ]}
        onPress={() => setActiveDisplayFilter("danger")}
      >
        <Text
          style={[
            styles.displayFilterText,
            activeDisplayFilter === "danger" && { color: colors.danger },
          ]}
        >
          {dangerCount} Critical
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.displayFilterButton,
          activeDisplayFilter === "warning" && [
            styles.displayFilterButtonActive,
            { borderColor: colors.warning },
          ],
        ]}
        onPress={() => setActiveDisplayFilter("warning")}
      >
        <Text
          style={[
            styles.displayFilterText,
            activeDisplayFilter === "warning" && { color: colors.warning },
          ]}
        >
          {warningCount} Warning
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.displayFilterButton,
          activeDisplayFilter === "safe" && [
            styles.displayFilterButtonActive,
            { borderColor: colors.success },
          ],
        ]}
        onPress={() => setActiveDisplayFilter("safe")}
      >
        <Text
          style={[
            styles.displayFilterText,
            activeDisplayFilter === "safe" && { color: colors.success },
          ]}
        >
          {safeCount} Safe
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    displayFilterContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 16,
      marginTop: 4,
      marginBottom: 12,
      gap: 8,
    },
    displayFilterButton: {
      flex: 1,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
    displayFilterButtonActive: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      backgroundColor: "transparent",
    },
    displayFilterText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    skeletonButton: {
      backgroundColor: colors.border,
      borderWidth: 0,
    },
  });
