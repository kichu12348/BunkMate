import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SubjectAttendance } from "../types/api";
import { useThemedStyles } from "../hooks/useTheme";
import {
  formatPercentage,
  getStatusColor,
  calculateEnhancedAttendanceStats,
  calculateEnhancedClassesToAttend,
  calculateEnhancedClassesCanMiss,
  getAttendanceStatus,
} from "../utils/helpers";
import { ThemeColors } from "../types/theme";
import { useAttendanceStore } from "../state/attendance";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Text from "./UI/Text";

interface AttendanceCardProps {
  subject: SubjectAttendance;
  onPress?: (classesCanMiss: number, classesToAttend: number) => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  subject,
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const courseSchedule = useAttendanceStore((state) => state.courseSchedule);

  // Get user-marked records for this subject
  const userRecords = courseSchedule?.get(subject.subject.id.toString()) || [];

  // Calculate enhanced stats using user-marked data
  const enhancedStats = calculateEnhancedAttendanceStats(subject, userRecords);

  // Use enhanced stats for calculations
  const actualStats = {
    totalClasses: enhancedStats.totalClasses,
    attendedClasses: enhancedStats.attendedClasses,
    percentage: enhancedStats.percentage,
  };

  // Recalculate status based on enhanced percentage
  const actualStatus = getAttendanceStatus(actualStats.percentage);
  const statusColor = getStatusColor(actualStatus);

  const classesToAttend = calculateEnhancedClassesToAttend(actualStats);
  const classesCanMiss = calculateEnhancedClassesCanMiss(actualStats);

  const getStatusIcon = () => {
    switch (actualStatus) {
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

  const getStatusMessage = () => {
    const userMarkedCount = enhancedStats.userMarkedCount;
    const conflictCount = enhancedStats.conflictCount;

    let baseMessage = "";
    switch (actualStatus) {
      case "safe":
        baseMessage =
          classesCanMiss > 0
            ? `Can miss ${classesCanMiss} more class${
                classesCanMiss > 1 ? "es" : ""
              }`
            : "Perfect attendance!";
        break;
      case "warning":
        baseMessage =
          classesToAttend > 0
            ? `Attend ${classesToAttend} more class${
                classesToAttend > 1 ? "es" : ""
              } to be safe`
            : "Close to minimum requirement";
        break;
      case "danger":
        baseMessage =
          classesToAttend > 0
            ? `Must attend ${classesToAttend} class${
                classesToAttend > 1 ? "es" : ""
              } to reach 75%`
            : "Below minimum requirement!";
        break;
      default:
        baseMessage = "Status unknown";
    }

    // Add indicators for user data
    if (conflictCount > 0) {
      baseMessage += ` • ${conflictCount} conflict${
        conflictCount > 1 ? "s" : ""
      } ⚠️`;
    } else if (userMarkedCount > 0) {
      baseMessage += ` • ${userMarkedCount} self-marked`;
    }

    return baseMessage;
  };

  const handlePress = () => {
    onPress?.(classesCanMiss, classesToAttend);
  };

  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(Math.min(actualStats.percentage, 100), {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });
  }, [actualStats.percentage]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value}%`,
    };
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject.subject.name}
          </Text>
          <Text style={styles.subjectCode}>{subject.subject.code}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Ionicons name={getStatusIcon()} size={16} color="white" />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Attendance</Text>
          <Text style={[styles.statValue, { color: statusColor }]}>
            {formatPercentage(actualStats.percentage)}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Classes</Text>
          <Text style={styles.statValue}>
            {actualStats.attendedClasses}/{actualStats.totalClasses}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: statusColor,
              },
              animatedStyle,
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {formatPercentage(actualStats.percentage)}
        </Text>
      </View>

      <Text
        style={[styles.statusMessage, { color: statusColor }]}
        numberOfLines={2}
      >
        {getStatusMessage()}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 6,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
      marginRight: 12,
    },
    subjectName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    subjectCode: {
      fontSize: 12,
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statusBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    statItem: {
      alignItems: "center",
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    progressContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    progressBar: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginRight: 8,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      minWidth: 40,
      textAlign: "right",
    },
    statusMessage: {
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
    },
  });
