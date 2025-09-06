import React, { useMemo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ColorValue,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { TAB_BAR_HEIGHT, TIMING_CONFIG } from "../../constants/config";

// --- Types ---
interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

interface CustomTabNavigatorProps extends BottomTabBarProps {
  tabs: TabItem[];
}

interface TextRevealTabProps {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
}

// --- Style Factory ---
const getStyles = (insets: { bottom: number }) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: TAB_BAR_HEIGHT + insets.bottom,
    },
    gradient: {
      flex: 1,
      paddingBottom: insets.bottom,
    },
    tabBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
    },
    tabContainer: {
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      height: 45,
      borderRadius: 26,
      paddingHorizontal: 14,
      borderStyle: "dashed",
    },
    animatedLabelContainer: {
      overflow: "hidden",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
    },
  });

// --- Child Component for Individual Tabs ---
const TextRevealTab: React.FC<TextRevealTabProps> = React.memo(
  ({ tab, isActive, onPress }) => {
    const theme = useTheme();
    const styles = useMemo(() => getStyles({ bottom: 0 }), [theme]);

    // Animate the background color of the tab container
    const animatedContainerStyle = useAnimatedStyle(() => {
      return {
        borderColor: withTiming(
          isActive ? theme.colors.primary : "transparent",
          TIMING_CONFIG
        ),
        borderWidth: withTiming(isActive ? 1.5 : 0, TIMING_CONFIG),
        backgroundColor: withTiming(
          isActive ? `${theme.colors.background}55` : "transparent",
          TIMING_CONFIG
        ),
      };
    });
    const animatedLabelContainerStyle = useAnimatedStyle(() => {
      return {
        maxWidth: withTiming(isActive ? 80 : 0, TIMING_CONFIG),
        marginLeft: withTiming(isActive ? 8 : 0, TIMING_CONFIG),
        opacity: withTiming(isActive ? 1 : 0, TIMING_CONFIG),
      };
    });

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Animated.View style={[styles.tabContainer, animatedContainerStyle]}>
          <Ionicons
            name={isActive ? tab.icon : tab.iconOutline}
            size={24}
            color={isActive ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Animated.View
            style={[styles.animatedLabelContainer, animatedLabelContainerStyle]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive
                    ? theme.colors.primary
                    : "transparent",
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    );
  }
);

const CustomTabNavigator: React.FC<CustomTabNavigatorProps> = ({
  state,
  descriptors,
  navigation,
  tabs,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(insets), [insets]);

  const gradientColors = useMemo(
    () => [
      `${theme.colors.background}00`,
      `${theme.colors.background}66`,
      `${theme.colors.background}77`,
      `${theme.colors.background}88`,
      `${theme.colors.background}AA`,
      `${theme.colors.background}FF`,
    ],
    [theme.colors.background]
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      <LinearGradient
        colors={gradientColors as [ColorValue, ColorValue, ColorValue]}
        style={styles.gradient}
        pointerEvents="auto"
      >
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            // Find the corresponding tab config
            const tabConfig = tabs.find((tab) => tab.name === route.name);
            if (!tabConfig) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <TextRevealTab
                key={route.key}
                tab={tabConfig}
                isActive={isFocused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
};

export default React.memo(CustomTabNavigator);
