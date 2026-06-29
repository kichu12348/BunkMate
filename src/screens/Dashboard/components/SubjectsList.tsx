import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../../hooks/useTheme";
import { ThemeColors } from "../../../types/theme";
import { SubjectAttendance } from "../../../types/api";
import Text from "../../../components/UI/Text";
import { AttendanceCard } from "../../../components/AttendanceCard";
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedStyle,
} from "react-native-reanimated";

type DisplayFilter = "all" | "danger" | "warning" | "safe";

interface SubjectsListProps {
  activeDisplayFilter: DisplayFilter;
  dangerSubjects: SubjectAttendance[];
  warningSubjects: SubjectAttendance[];
  safeSubjects: SubjectAttendance[];
  handleSubjectPress: (
    subject: SubjectAttendance,
    canMiss: number,
    classesToAttend: number,
  ) => void;
  isLoading?: boolean;
}

export const SubjectsList: React.FC<SubjectsListProps> = ({
  activeDisplayFilter,
  dangerSubjects,
  warningSubjects,
  safeSubjects,
  handleSubjectPress,
  isLoading = false,
}) => {
  const styles = useThemedStyles(createStyles);

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
      <Animated.View style={[styles.subjectsContainer, shimmerStyle]}>
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.skeletonSectionIcon} />
            <View style={styles.skeletonSectionTitle} />
          </View>
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonTitleContainer}>
                  <View style={styles.skeletonSubjectName} />
                  <View style={styles.skeletonSubjectCode} />
                </View>
                <View style={styles.skeletonStatusBadge} />
              </View>

              <View style={styles.skeletonStatsContainer}>
                <View style={styles.skeletonStatItem}>
                  <View style={styles.skeletonStatLabel} />
                  <View style={styles.skeletonStatValue} />
                </View>
                <View style={styles.skeletonStatItem}>
                  <View style={styles.skeletonStatLabel} />
                  <View style={styles.skeletonStatValue} />
                </View>
              </View>

              <View style={styles.skeletonProgressContainer}>
                <View style={styles.skeletonProgressBar} />
                <View style={styles.skeletonProgressText} />
              </View>

              <View style={styles.skeletonStatusMessage} />
            </View>
          ))}
        </View>
      </Animated.View>
    );
  }

  return (
    <View style={styles.subjectsContainer}>
      {(activeDisplayFilter === "all" || activeDisplayFilter === "danger") &&
        dangerSubjects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={styles.dangerColor.color}
              />
              <Text style={[styles.sectionTitle, styles.dangerText]}>
                Critical Attention Required
              </Text>
            </View>
            {dangerSubjects.map((subject, index) => (
              <AttendanceCard
                key={`danger-${index}`}
                subject={subject}
                onPress={(canMiss, classesToAttend) =>
                  handleSubjectPress(subject, canMiss, classesToAttend)
                }
              />
            ))}
          </View>
        )}

      {(activeDisplayFilter === "all" || activeDisplayFilter === "warning") &&
        warningSubjects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="warning"
                size={18}
                color={styles.warningColor.color}
              />
              <Text style={[styles.sectionTitle, styles.warningText]}>
                Needs Attention
              </Text>
            </View>
            {warningSubjects.map((subject, index) => (
              <AttendanceCard
                key={`warning-${index}`}
                subject={subject}
                onPress={(canMiss, classesToAttend) =>
                  handleSubjectPress(subject, canMiss, classesToAttend)
                }
              />
            ))}
          </View>
        )}

      {(activeDisplayFilter === "all" || activeDisplayFilter === "safe") &&
        safeSubjects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={styles.safeColor.color}
              />
              <Text style={[styles.sectionTitle, styles.safeText]}>
                Good Standing
              </Text>
            </View>
            {safeSubjects.map((subject, index) => (
              <AttendanceCard
                key={`safe-${index}`}
                subject={subject}
                onPress={(canMiss, classesToAttend) =>
                  handleSubjectPress(subject, canMiss, classesToAttend)
                }
              />
            ))}
          </View>
        )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    subjectsContainer: {
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    dangerText: { color: colors.danger },
    warningText: { color: colors.warning },
    safeText: { color: colors.success },
    safeColor: { color: colors.success },
    warningColor: { color: colors.warning },
    dangerColor: { color: colors.danger },
    
    // Skeleton Styles
    skeletonSectionIcon: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.border,
    },
    skeletonSectionTitle: {
      width: 180,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginLeft: 8,
    },
    skeletonCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    skeletonHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    skeletonTitleContainer: {
      flex: 1,
      marginRight: 12,
    },
    skeletonSubjectName: {
      width: "70%",
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 8,
      marginBottom: 6,
    },
    skeletonSubjectCode: {
      width: "30%",
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
    },
    skeletonStatusBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.border,
    },
    skeletonStatsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    skeletonStatItem: {
      alignItems: "center",
      width: 60,
    },
    skeletonStatLabel: {
      width: 50,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      marginBottom: 6,
    },
    skeletonStatValue: {
      width: 40,
      height: 16,
      backgroundColor: colors.border,
      borderRadius: 8,
    },
    skeletonProgressContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    skeletonProgressBar: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginRight: 8,
    },
    skeletonProgressText: {
      width: 30,
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
    },
    skeletonStatusMessage: {
      width: "60%",
      height: 12,
      backgroundColor: colors.border,
      borderRadius: 6,
      alignSelf: "center",
    },
  });
