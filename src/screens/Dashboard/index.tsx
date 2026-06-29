import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../state/auth";
import { useAttendanceStore } from "../../state/attendance";
import { useSettingsStore } from "../../state/settings";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { SubjectAttendance } from "../../types/api";
import {
  calculateEnhancedAttendanceStats,
  getAttendanceStatus,
} from "../../utils/helpers";
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
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useToastStore } from "../../state/toast";
import { TAB_BAR_HEIGHT } from "../../constants/config";
import AnimatedHeart from "../../components/UI/AnimatedHeart";
import { usePfpStore } from "../../state/pfpStore";
import CustomRefreshLoader from "../../components/UI/RefreshLoader";
import { useAssignmentStore } from "../../state/assignments";
import Text from "../../components/UI/Text";

// Components
import { DashboardHeader } from "./components/DashboardHeader";
import { OverallStatsCard } from "./components/OverallStatsCard";
import { DisplayFilterBar } from "./components/DisplayFilterBar";
import { SubjectsList } from "./components/SubjectsList";
import { FilterModal } from "./components/FilterModal";

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;
type DisplayFilter = "all" | "danger" | "warning" | "safe";

export const Dashboard: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const navigation = useNavigation<DashboardNavigationProp>();
  const name = useAuthStore((state) => state.name);
  const showToast = useToastStore((state) => state.showToast);
  const initPfp = usePfpStore((state) => state.initialize);
  const fetchAssignments = useAssignmentStore(
    (state) => state.fetchAssignments,
  );

  useEffect(() => {
    fetchAssignments();
    initPfp();
  }, []);

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

  const [refreshing, setRefreshing] = useState(true);
  const [shouldShowLoader, setShouldShowLoader] = useState(true);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const fetchDebounced = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return async () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        setRefreshing(true);
        fetchAttendance().finally(() => setRefreshing(false));
      }, 500);
    };
  }, []);

  const insets = useSafeAreaInsets();
  const scaleAnim = useSharedValue(0.8);

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const stickyYRef = useRef(0);
  const [activeFilter, setActiveFilter] = useState<"year" | "semester" | null>(
    null,
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
      scrollToTop();
      await fetchDebounced();
    } catch (e: unknown) {
      showToast({
        title: "Error",
        message: e instanceof Error ? e.message : "Failed to update academic year.",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleSemesterChange = async (semester: string) => {
    setFilterModalVisible(false);
    if (semester === selectedSemester) return;
    try {
      await setSemester(semester);
      scrollToTop();
      await fetchDebounced();
    } catch (e: unknown) {
      showToast({
        title: "Error",
        message: e instanceof Error ? e.message : "Failed to update semester.",
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
    return attendanceData.subjects.map((subject: SubjectAttendance) => {
      const userRecords =
        courseSchedule.get(subject.subject.id.toString()) || [];
      const enhancedStats = calculateEnhancedAttendanceStats(
        subject,
        userRecords,
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

  const enhancedOverallStats = useMemo(() => {
    if (enhancedSubjects.length === 0) return null;
    const totalClasses = enhancedSubjects.reduce(
      (sum, subject) => sum + subject.enhanced.totalClasses,
      0,
    );
    const attendedClasses = enhancedSubjects.reduce(
      (sum, subject) => sum + subject.enhanced.attendedClasses,
      0,
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
    initFetchAttendance().finally(() => {
      setRefreshing(false);
    });
    scaleAnim.value = withSpring(1, { damping: 5, stiffness: 100, mass: 0.5 });
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAttendance();
    } catch (error: unknown) {
      showToast({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to refresh data",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubjectPress = (
    subject: SubjectAttendance,
    canMiss: number,
    classesToAttend: number,
  ) => {
    navigation.navigate("SubjectDetails", {
      subjectId: subject.subject.id.toString(),
      subjectName: subject.subject.name,
      subjectCode: subject.subject.code,
      canMiss,
      toAttend: classesToAttend,
    });
  };

  const dangerSubjects = enhancedSubjects.filter(
    (s) => s.enhanced.status === "danger",
  );
  const warningSubjects = enhancedSubjects.filter(
    (s) => s.enhanced.status === "warning",
  );
  const safeSubjects = enhancedSubjects.filter(
    (s) => s.enhanced.status === "safe",
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
    if (filterInfoHeight === 0 || stickyPointY.value === 0) return {};
    const animationRange = 60;
    const scrollPastSticky = scrollY.value - stickyPointY.value;
    const progress = interpolate(
      scrollPastSticky,
      [0, animationRange],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const animatedHeight = interpolate(progress, [0, 1], [filterInfoHeight, 0]);
    const animatedMargin = interpolate(progress, [0, 1], [16, 0]);
    return {
      height: animatedHeight,
      marginTop: animatedMargin,
      overflow: "hidden",
    };
  });

  const selectedYearLabel =
    availableYears.find((y) => y.value === selectedYear)?.label || "All Years";
  const selectedSemesterLabel =
    availableSemesters.find((s) => s.value === selectedSemester)?.label ||
    "All Semesters";

  return (
    <View style={styles.container}>
      <DashboardHeader
        insetsTop={insets.top}
        name={name}
        onNavigateForum={() => navigation.navigate("PublicForum")}
        filterInfoAnimatedStyle={filterInfoAnimatedStyle}
        setFilterInfoHeight={setFilterInfoHeight}
        filterInfoHeight={filterInfoHeight}
        openFilterModal={openFilterModal}
        selectedYearLabel={selectedYearLabel}
        selectedSemesterLabel={selectedSemesterLabel}
      />
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
          ref={scrollViewRef}
        >
          <View>
            <OverallStatsCard
              enhancedOverallStats={enhancedOverallStats}
              animatedStyle={animatedStyle}
              lastUpdated={lastUpdated}
              dangerSubjectsCount={dangerSubjects.length}
              warningSubjectsCount={warningSubjects.length}
              safeSubjectsCount={safeSubjects.length}
              isLoading={isLoading}
            />
          </View>

          <View
            style={styles.stickyHeaderContainer}
            onLayout={(e) => {
              const layoutY = e.nativeEvent.layout.y;
              stickyYRef.current = layoutY;
              stickyPointY.value = layoutY;
            }}
          >
            {(enhancedSubjects.length > 0 || isLoading) && (
              <DisplayFilterBar
                activeDisplayFilter={activeDisplayFilter}
                setActiveDisplayFilter={setActiveDisplayFilter}
                dangerCount={dangerSubjects.length}
                warningCount={warningSubjects.length}
                safeCount={safeSubjects.length}
                isLoading={isLoading}
              />
            )}
          </View>

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

          {(enhancedSubjects.length > 0 || isLoading) && (
            <SubjectsList
              activeDisplayFilter={activeDisplayFilter}
              dangerSubjects={dangerSubjects}
              warningSubjects={warningSubjects}
              safeSubjects={safeSubjects}
              handleSubjectPress={handleSubjectPress}
              isLoading={isLoading}
            />
          )}
          <View style={styles.footer}>
            <AnimatedHeart size={20} />
          </View>
        </Animated.ScrollView>
      </CustomRefreshLoader>

      <FilterModal
        visible={filterModalVisible}
        setVisible={setFilterModalVisible}
        activeFilter={activeFilter}
        options={activeOptions}
        selectedValue={
          activeFilter === "year" ? selectedYear : selectedSemester
        }
        onSelect={
          activeFilter === "year" ? handleYearChange : handleSemesterChange
        }
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    stickyHeaderContainer: { backgroundColor: colors.background },
    errorCard: {
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.danger,
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
    },
    retryButtonText: { color: "white", fontSize: 14, fontWeight: "600" },
    footer: {
      marginTop: 16,
      padding: 16,
      alignItems: "center",
      justifyContent: "center",
    },
  });
