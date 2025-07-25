import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
} from "react-native";
import logo_dark from "../assets/bonk_icon_dark.png";
import logo_light from "../assets/bonk_icon_light.png";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../state/auth";
import { useAttendanceStore } from "../state/attendance";
import { useSettingsStore } from "../state/settings";
import { useThemedStyles } from "../hooks/useTheme";
import { AttendanceCard } from "../components/AttendanceCard";
import { ThemeColors } from "../types/theme";
import {
  formatPercentage,
  getTimeAgo,
  calculateEnhancedAttendanceStats,
  getAttendanceStatus,
} from "../utils/helpers";
import { ATTENDANCE_THRESHOLDS } from "../constants/config";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useThemeStore } from "../state/themeStore";
import { useToastStore } from "../state/toast";

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

const { width } = Dimensions.get("window");

export const Dashboard: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);
  const mode = useThemeStore((state) => state.mode);
  const navigation = useNavigation<DashboardNavigationProp>();
  const name = useAuthStore((state) => state.name);
  const showToast = useToastStore((state) => state.showToast);
  const {
    data: attendanceData,
    isLoading,
    error,
    lastUpdated,
    refreshAttendance,
    courseSchedule,
    initFetchAttendance,
  } = useAttendanceStore();

  const { selectedYear, selectedSemester, availableYears, availableSemesters } =
    useSettingsStore();

  const insets = useSafeAreaInsets();
  const bottomBarHeight = useBottomTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);
  const scaleAnim = useSharedValue(0.8);

  // Calculate enhanced statistics using user-marked data
  const enhancedSubjects = useMemo(() => {
    if (!attendanceData || !courseSchedule) return [];

    return attendanceData.subjects.map((subject) => {
      const userRecords =
        courseSchedule.get(subject.subject.id.toString()) || [];
      const enhancedStats = calculateEnhancedAttendanceStats(
        subject,
        userRecords
      );

      return {
        ...subject,
        enhanced: {
          totalClasses: enhancedStats.totalClasses,
          attendedClasses: enhancedStats.attendedClasses,
          percentage: enhancedStats.percentage,
          status: getAttendanceStatus(enhancedStats.percentage),
          userMarkedCount: enhancedStats.userMarkedCount,
          conflictCount: enhancedStats.conflictCount,
        },
      };
    });
  }, [attendanceData, courseSchedule]);

  // Calculate enhanced overall statistics
  const enhancedOverallStats = useMemo(() => {
    if (enhancedSubjects.length === 0) {
      return {
        totalClasses: 0,
        attendedClasses: 0,
        percentage: 0,
        totalSubjects: 0,
      };
    }

    const totalClasses = enhancedSubjects.reduce(
      (sum, subject) => sum + subject.enhanced.totalClasses,
      0
    );
    const attendedClasses = enhancedSubjects.reduce(
      (sum, subject) => sum + subject.enhanced.attendedClasses,
      0
    );
    const percentage =
      totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    return {
      totalClasses,
      attendedClasses,
      percentage: Math.round(percentage * 100) / 100,
      totalSubjects: enhancedSubjects.length,
    };
  }, [enhancedSubjects]);

  useEffect(() => {
    initFetchAttendance();

    // Animate card on load
    scaleAnim.value = withSpring(1, {
      damping: 5,
      stiffness: 100,
      mass: 0.5,
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAttendance();
    } catch (error: any) {
      showToast({
        title: "Error",
        message: error.message || "Failed to refresh attendance data",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubjectPress = (
    subject: any,
    canMiss: number,
    classesToAttend: number
  ) => {
    navigation.navigate("SubjectDetails", {
      subjectId: subject.subject.id.toString(),
      subjectName: subject.subject.name,
      subjectCode: subject.subject.code,
      canMiss,
      toAttend: classesToAttend,
    });
  };

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

  // Categorize subjects based on enhanced status
  const dangerSubjects = enhancedSubjects.filter(
    (s) => s.enhanced.status === "danger"
  );
  const warningSubjects = enhancedSubjects.filter(
    (s) => s.enhanced.status === "warning"
  );
  const safeSubjects = enhancedSubjects.filter(
    (s) => s.enhanced.status === "safe"
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 25 }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {name || "Student"}!</Text>
            <Text style={styles.subGreeting}>
              Track your attendance progress
            </Text>
          </View>

          {/* Header Icon Badge */}
          <View style={styles.headerIconBadge}>
            <Image
              source={mode === "dark" ? logo_dark : logo_light}
              style={styles.logoImage}
            />
          </View>
        </View>

        {/* Filter Info - moved inside header */}
        <View style={styles.filterInfo}>
          <View style={styles.filterItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={styles.textSecondary.color}
            />
            <Text style={styles.filterText}>
              {availableYears.find((y) => y.value === selectedYear)?.label ||
                "All Years"}
            </Text>
          </View>
          <View style={styles.filterItem}>
            <Ionicons
              name="school-outline"
              size={16}
              color={styles.textSecondary.color}
            />
            <Text style={styles.filterText}>
              {availableSemesters.find((s) => s.value === selectedSemester)
                ?.label || "All Semesters"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: bottomBarHeight + 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.textSecondary}
            progressBackgroundColor={colors.background}
          />
        }
      >
        {/* Overall Stats */}
        {enhancedOverallStats && (
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
                <Text
                  style={[styles.overallPercentage, getOverallStatusColor()]}
                >
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
                    {dangerSubjects.length}
                  </Text>
                  <Text style={styles.statusLabel}>Critical</Text>
                </View>

                <View style={styles.statusCountItem}>
                  <Text style={[styles.statusCount, styles.warningText]}>
                    {warningSubjects.length}
                  </Text>
                  <Text style={styles.statusLabel}>Warning</Text>
                </View>

                <View style={styles.statusCountItem}>
                  <Text style={[styles.statusCount, styles.safeText]}>
                    {safeSubjects.length}
                  </Text>
                  <Text style={styles.statusLabel}>Safe</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={24}
              color={styles.errorText.color}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading State */}
        {isLoading && enhancedSubjects.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading attendance data...</Text>
          </View>
        )}

        {/* Subjects List */}
        {enhancedSubjects.length > 0 && (
          <View style={styles.subjectsContainer}>
            {/* Critical Subjects */}
            {dangerSubjects.length > 0 && (
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

            {/* Warning Subjects */}
            {warningSubjects.length > 0 && (
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

            {/* Safe Subjects */}
            {safeSubjects.length > 0 && (
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
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made Wid <Ionicons name="heart" size={16} color={"red"} /> by Kichu
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
    },
    headerLeft: {
      flex: 1,
    },
    headerIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    greeting: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.3,
    },
    subGreeting: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    scrollView: {
      flex: 1,
    },
    statsCardContainer: {
      margin: 16,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: colors.surface,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 5,
    },
    statsGradientBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingVertical: 12,
    },
    statsCard: {
      backgroundColor: colors.surface,
      padding: 20,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
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
    statusDanger: {
      backgroundColor: `${colors.danger}`,
    },
    statusWarning: {
      backgroundColor: `${colors.warning}`,
    },
    statusSafe: {
      backgroundColor: `${colors.success}`,
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
    errorCard: {
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.danger,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      textAlign: "center",
      marginVertical: 8,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      marginTop: 10,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    retryButtonText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
    },
    loadingContainer: {
      padding: 32,
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
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
    dangerText: {
      color: colors.danger,
    },
    warningText: {
      color: colors.warning,
    },
    safeText: {
      color: colors.success,
    },
    // Color utilities
    primary: {
      color: colors.primary,
    },
    primaryLight: {
      color: colors.primary || "#5c9ce6",
    },
    safeColor: {
      color: colors.success,
    },
    safeGradientStart: {
      color: colors.success,
    },
    safeGradientEnd: {
      color: "#2a965a",
    },
    warningColor: {
      color: colors.warning,
    },
    warningGradientStart: {
      color: colors.warning,
    },
    warningGradientEnd: {
      color: "#e09400",
    },
    dangerColor: {
      color: colors.danger,
    },
    dangerGradientStart: {
      color: colors.danger,
    },
    dangerGradientEnd: {
      color: "#c41c1c",
    },
    textSecondary: {
      color: colors.textSecondary,
    },
    filterInfo: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginTop: 16,
      gap: 12,
    },
    filterItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    filterIcon: {
      color: colors.textSecondary,
      marginRight: 8,
    },
    filterText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    footer: {
      marginTop: 16,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    footerText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
    logoImage: {
      width: 30,
      height: 30,
    },
  });
