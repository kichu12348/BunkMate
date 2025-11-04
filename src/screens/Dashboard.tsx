import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
} from "react-native";
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
  useAnimatedScrollHandler,
  Extrapolation,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useThemeStore } from "../state/themeStore";
import { useToastStore } from "../state/toast";
import { TAB_BAR_HEIGHT } from "../constants/config";
import AnimatedHeart from "../components/UI/AnimatedHeart";
import { usePfpStore } from "../state/pfpStore";
import CustomRefreshLoader from "../components/UI/RefreshLoader";

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

// ADDED: Define a type for our new display filter state
type DisplayFilter = "all" | "danger" | "warning" | "safe";

const { width } = Dimensions.get("window");

export const Dashboard: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);
  const navigation = useNavigation<DashboardNavigationProp>();
  const name = useAuthStore((state) => state.name);
  const showToast = useToastStore((state) => state.showToast);
  const pfp = usePfpStore((state) => state.uri);

  const [_, setPfpUri] = useState<string | null>(pfp);

  useEffect(() => {
    setPfpUri(pfp);
  }, [pfp]);

  const {
    data: attendanceData,
    isLoading,
    error,
    lastUpdated,
    refreshAttendance,
    fetchAttendance,
    courseSchedule,
    initFetchAttendance,
  } = useAttendanceStore();
  const {
    selectedYear,
    selectedSemester,
    availableYears,
    availableSemesters,
    setAcademicYear,
    setSemester,
  } = useSettingsStore();

  const fetchDebounced = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return async () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setRefreshing(true);
        fetchAttendance()
          .then(() => {
            setRefreshing(false);
          })
          .catch(() => {
            setRefreshing(false);
          });
      }, 500);
    };
  }, []);

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(true);
  const [isHeartActive, setIsHeartActive] = useState(false);
  const [shouldShowLoader, setShouldShowLoader] = useState(true);
  const scaleAnim = useSharedValue(0.8);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const stickyYRef = React.useRef(0);
  const [activeFilter, setActiveFilter] = useState<"year" | "semester" | null>(
    null
  );
  const [activeDisplayFilter, setActiveDisplayFilter] =
    useState<DisplayFilter>("all");

  const [filterInfoHeight, setFilterInfoHeight] = useState(0);
  const scrollY = useSharedValue(0);
  const stickyPointY = useSharedValue(0);

  const handleYearChange = async (year: string) => {
    setFilterModalVisible(false);
    if (year === selectedYear) return;
    try {
      await setAcademicYear(year);
      await fetchDebounced();
    } catch (e: any) {
      showToast({
        title: "Error",
        message: e.message || "Failed to update academic year.",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleSemesterChange = async (semester: string) => {
    setFilterModalVisible(false);
    if (semester === selectedSemester) return;
    try {
      await setSemester(semester);
      await fetchDebounced();
    } catch (e: any) {
      showToast({
        title: "Error",
        message: e.message || "Failed to update semester.",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const openFilterModal = (filter: "year" | "semester") => {
    setActiveFilter(filter);
    setFilterModalVisible(true);
  };

  const activeOptions = useMemo(() => {
    if (activeFilter === "year") return availableYears;
    if (activeFilter === "semester") return availableSemesters;
    return [];
  }, [activeFilter, availableYears, availableSemesters]);

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
    initFetchAttendance().finally(() => setRefreshing(false));

    // Animate card on load
    scaleAnim.value = withSpring(1, {
      damping: 5,
      stiffness: 100,
      mass: 0.5,
    });
  }, []);
  const handleRefresh = async () => {
    if (refreshing) return;
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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const atTop = event.contentOffset.y <= 0;
      if (atTop !== shouldShowLoader && !refreshing) {
        runOnJS(setShouldShowLoader)(atTop);
      }
    },
  });

  const filterInfoAnimatedStyle = useAnimatedStyle(() => {
    if (filterInfoHeight === 0 || stickyPointY.value === 0) {
      return {};
    }
    const animationRange = 60;
    const scrollPastSticky = scrollY.value - stickyPointY.value;
    const progress = interpolate(
      scrollPastSticky,
      [0, animationRange],
      [0, 1],
      Extrapolation.CLAMP
    );
    const animatedHeight = interpolate(progress, [0, 1], [filterInfoHeight, 0]);
    const animatedMargin = interpolate(progress, [0, 1], [16, 0]);

    return {
      height: animatedHeight,
      marginTop: animatedMargin,
      overflow: "hidden",
    };
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hello, {name || "Student"}!</Text>
            <Text style={styles.subGreeting}>
              Track your attendance progress
            </Text>
          </View>
          <View style={styles.headerIconBadge}>
            <TouchableOpacity
              onPress={() => navigation.navigate("PublicForum")}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chatbubbles"
                size={28}
                color={styles.textSecondary.color}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Animated.View
          style={[styles.filterInfo, filterInfoAnimatedStyle]}
          onLayout={(event) => {
            if (filterInfoHeight === 0) {
              setFilterInfoHeight(event.nativeEvent.layout.height);
            }
          }}
        >
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => openFilterModal("year")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={styles.textSecondary.color}
            />
            <Text style={styles.filterText}>
              {availableYears.find((y) => y.value === selectedYear)?.label ||
                "All Years"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterItem}
            onPress={() => openFilterModal("semester")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="school-outline"
              size={16}
              color={styles.textSecondary.color}
            />
            <Text style={styles.filterText}>
              {availableSemesters.find((s) => s.value === selectedSemester)
                ?.label || "All Semesters"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      <CustomRefreshLoader
        isRefreshing={refreshing}
        onRefresh={handleRefresh}
        shouldShowLoader={shouldShowLoader}
        size={1.5}
      >
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT + 24 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[1]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
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
          <View
            style={styles.stickyHeaderContainer}
            onLayout={(e) => {
              const layoutY = e.nativeEvent.layout.y;
              stickyYRef.current = layoutY;
              stickyPointY.value = layoutY;
            }}
          >
            {enhancedSubjects.length > 0 && (
              <View style={styles.displayFilterContainer}>
                <TouchableOpacity
                  style={[
                    styles.displayFilterButton,
                    activeDisplayFilter === "all" &&
                      styles.displayFilterButtonActive,
                  ]}
                  onPress={() => setActiveDisplayFilter("all")}
                >
                  <Text
                    style={[
                      styles.displayFilterText,
                      activeDisplayFilter === "all" && {
                        color: colors.primary,
                      },
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
                      activeDisplayFilter === "danger" && {
                        color: colors.danger,
                      },
                    ]}
                  >
                    {dangerSubjects.length} Critical
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
                      activeDisplayFilter === "warning" && {
                        color: colors.warning,
                      },
                    ]}
                  >
                    {warningSubjects.length} Warning
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
                      activeDisplayFilter === "safe" && {
                        color: colors.success,
                      },
                    ]}
                  >
                    {safeSubjects.length} Safe
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
              {(activeDisplayFilter === "all" ||
                activeDisplayFilter === "danger") &&
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

              {/* Warning Subjects */}
              {/* MODIFIED: Conditionally render based on activeDisplayFilter */}
              {(activeDisplayFilter === "all" ||
                activeDisplayFilter === "warning") &&
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

              {/* Safe Subjects */}
              {/* MODIFIED: Conditionally render based on activeDisplayFilter */}
              {(activeDisplayFilter === "all" ||
                activeDisplayFilter === "safe") &&
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
          )}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => setIsHeartActive(true)}
              disabled={isHeartActive}
              activeOpacity={1}
            >
              <Text style={styles.footerText}>
                Made Wid{" "}
                <AnimatedHeart
                  isActive={isHeartActive}
                  setIsActive={setIsHeartActive}
                  size={20}
                />{" "}
                by Kichu
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </CustomRefreshLoader>
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
        hardwareAccelerated
        statusBarTranslucent
        navigationBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeFilter === "year" ? "Academic Year" : "Semester"}
              </Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={activeOptions}
              keyExtractor={(item) => item.value}
              contentContainerStyle={{ paddingVertical: 8 }}
              renderItem={({ item, index }) => {
                const isSelected =
                  activeFilter === "year"
                    ? item.value === selectedYear
                    : item.value === selectedSemester;
                const isLast = index === activeOptions.length - 1;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      isSelected && styles.selectedOption,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    onPress={() =>
                      activeFilter === "year"
                        ? handleYearChange(item.value)
                        : handleSemesterChange(item.value)
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
      fontFamily: "Chewy-Regular",
      color: colors.text,
      letterSpacing: 1,
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
      shadowOpacity: 0.3,
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
    stickyHeaderContainer: {
      backgroundColor: colors.background,
    },
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
      fontFamily: "Chewy-Regular",
      letterSpacing: 1,
    },
    logoImage: {
      width: 30,
      height: 30,
    },
    pfpImage: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background + "80",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      maxHeight: "60%",
      width: "80%",
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "40",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.3,
      flex: 1,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginHorizontal: 8,
    },
    selectedOption: {
      backgroundColor: colors.primary + "15",
      borderRadius: 12,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
      fontWeight: "500",
      letterSpacing: 0.2,
    },
    selectedOptionText: {
      color: colors.primary,
      fontWeight: "600",
    },
    checkmarkContainer: {
      marginLeft: 12,
    },
  });
