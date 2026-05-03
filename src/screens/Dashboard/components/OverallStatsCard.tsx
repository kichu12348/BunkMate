import React from "react";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useThemedStyles } from "../../../hooks/useTheme";
import { useThemeStore } from "../../../state/themeStore";
import { ThemeColors } from "../../../types/theme";
import Text from "../../../components/UI/Text";
import { formatPercentage, getTimeAgo } from "../../../utils/helpers";
import { ATTENDANCE_THRESHOLDS } from "../../../constants/config";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/RootNavigator";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

interface OverallStatsCardProps {
  enhancedOverallStats: {
    percentage: number;
    totalSubjects: number;
  };
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  lastUpdated?: Date | null;
  dangerSubjectsCount: number;
  warningSubjectsCount: number;
  safeSubjectsCount: number;
}

export const OverallStatsCard: React.FC<OverallStatsCardProps> = ({
  enhancedOverallStats,
  animatedStyle,
  lastUpdated,
  dangerSubjectsCount,
  warningSubjectsCount,
  safeSubjectsCount,
}) => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);
  const navigation = useNavigation<DashboardNavigationProp>();

  const getOverallStatus = () => {
    if (!enhancedOverallStats) return "unknown";
    const percentage = enhancedOverallStats.percentage;
    if (percentage < ATTENDANCE_THRESHOLDS.DANGER) return "danger";
    if (percentage < ATTENDANCE_THRESHOLDS.WARNING) return "warning";
    return "safe";
  };

  const getOverallStatusColor = () => {
    const status = getOverallStatus();
    switch (status) {
      case "safe":
        return styles.safeColor;
      case "warning":
        return styles.warningColor;
      case "danger":
        return styles.dangerColor;
      default:
        return styles.textSecondary;
    }
  };

  const getOverallStatusIcon = () => {
    const status = getOverallStatus();
    switch (status) {
      case "safe":
        return "checkmark-circle";
      case "warning":
        return "warning";
      case "danger":
        return "alert-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <Animated.View style={[styles.statsCardContainer, animatedStyle]}>
      <View style={styles.statsGradientBanner}>
        <Text style={styles.statsTitle}>Overall Attendance</Text>
        <Ionicons
          name={getOverallStatusIcon()}
          size={24}
          color={styles.textSecondary.color}
        />
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statsContent}>
          <Text style={[styles.overallPercentage, getOverallStatusColor()]}>
            {formatPercentage(enhancedOverallStats.percentage)}
          </Text>
          <Text style={styles.totalSubjects}>
            {enhancedOverallStats.totalSubjects} subjects
          </Text>

          {lastUpdated && (
            <Text style={styles.lastUpdated}>
              Last updated: {getTimeAgo(lastUpdated)}
            </Text>
          )}
        </View>

        <View style={styles.statusCounts}>
          <View style={styles.statusCountItem}>
            <Text style={[styles.statusCount, styles.dangerText]}>
              {dangerSubjectsCount}
            </Text>
            <Text style={styles.statusLabel}>Critical</Text>
          </View>

          <View style={styles.statusCountItem}>
            <Text style={[styles.statusCount, styles.warningText]}>
              {warningSubjectsCount}
            </Text>
            <Text style={styles.statusLabel}>Warning</Text>
          </View>

          <View style={styles.statusCountItem}>
            <Text style={[styles.statusCount, styles.safeText]}>
              {safeSubjectsCount}
            </Text>
            <Text style={styles.statusLabel}>Safe</Text>
          </View>
        </View>
      </View>

      {/* KTU Grade Card shortcut */}
      <Animated.View style={styles.ktuButtonWrapper}>
        <TouchableOpacity
          style={styles.ktuButton}
          onPress={() => navigation.navigate("KtuGradeCard")}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialCommunityIcons
              name="school-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.ktuButtonText}>KTU Results</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    statsCardContainer: {
      margin: 16,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },
    statsGradientBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingVertical: 12,
    },
    statsCard: {
      padding: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      fontFamily: "Inter",
    },
    statsContent: {
      alignItems: "center",
      marginBottom: 20,
    },
    overallPercentage: {
      fontSize: 42,
      fontWeight: "bold",
      marginBottom: 4,
    },
    totalSubjects: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    lastUpdated: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statusCounts: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    statusCountItem: {
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      minWidth: width / 4,
    },
    statusCount: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
      color: colors.text,
    },
    statusLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    ktuButtonWrapper: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    ktuButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    ktuButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    dangerText: { color: colors.danger },
    warningText: { color: colors.warning },
    safeText: { color: colors.success },
    safeColor: { color: colors.success },
    warningColor: { color: colors.warning },
    dangerColor: { color: colors.danger },
    textSecondary: { color: colors.textSecondary },
  });
