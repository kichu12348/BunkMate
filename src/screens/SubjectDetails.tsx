import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import { useAttendanceStore } from "../state/attendance";
import { ThemeColors } from "../types/theme";
import { RootStackParamList } from "../navigation/RootNavigator";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AttendanceDayView from "../components/AttendanceDayView";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

type SubjectDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  "SubjectDetails"
>;
type SubjectDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SubjectDetails"
>;

interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "none";
  sessions: number;
}

interface AttendanceEntry {
  attendance: string;
  hour: number;
  is_entered_by_professor?: number; // 0 or 1
  is_entered_by_student?: number; // 0 or 1
  is_conflict?: number; // 0 or 1
  user_attendance?: string;
  teacher_attendance?: string;
  final_attendance?: string;
  // Add any other fields from CourseSchedule that might be needed
}

interface AttendanceWeek {
  weekStart: Date;
  days: AttendanceDay[];
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  percentage: number;
  streak: number;
  longestStreak: number;
}

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 80) / 7;

// Memoized components
const StatCard = React.memo(({ stat, colors }: { stat: any; colors: any }) => (
  <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
    <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
      <Ionicons name={stat.icon as any} size={20} color={stat.color} />
    </View>
    <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
    <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
      {stat.title}
    </Text>
  </View>
));

const AttendanceCell = React.memo(
  ({
    day,
    dayIndex,
    isCurrentMonth,
    cellColor,
    cellIntensity,
    colors,
    onPress,
  }: {
    day: AttendanceDay;
    dayIndex: number;
    isCurrentMonth: boolean;
    cellColor: string;
    cellIntensity: string;
    colors: ThemeColors;
    onPress: () => void;
  }) => {
    const dayDate = new Date(day.date);

    return (
      <TouchableOpacity
        style={[
          styles.cell,
          {
            backgroundColor: isCurrentMonth
              ? cellColor + cellIntensity
              : colors.border + "10",
            borderColor: isCurrentMonth ? cellColor : colors.border + "30",
            opacity: isCurrentMonth ? 1 : 0.3,
          },
        ]}
        onPress={onPress}
      >
        <View style={styles.cellContent}>
          {isCurrentMonth && (
            <Text
              style={[
                styles.dayNumber,
                {
                  color:
                    day.status === "present" ? colors.surface : colors.text,
                },
              ]}
            >
              {dayDate.getDate()}
            </Text>
          )}
          {day.sessions > 0 && isCurrentMonth && (
            <Text style={styles.sessionCount}>{day.sessions}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

export const SubjectDetailsScreen: React.FC = () => {
  const route = useRoute<SubjectDetailsScreenRouteProp>();
  const navigation = useNavigation<SubjectDetailsScreenNavigationProp>();
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const { subjectId, subjectName, subjectCode } = route.params;
  const {
    data: attendanceData,
    isLoading,
    courseSchedule,
    refreshAttendance,
  } = useAttendanceStore();

  const subjectSchedule = useMemo(
    () => courseSchedule?.get(subjectId.toString()) || [],
    [courseSchedule, subjectId]
  );

  const lastEntry = useMemo(
    () => subjectSchedule[subjectSchedule.length - 1],
    [subjectSchedule]
  );

  const [selectedMonth, setSelectedMonth] = useState<Date>(() =>
    lastEntry ? new Date(lastEntry.year, lastEntry.month - 1) : new Date()
  );

  const [isDayViewVisible, setIsDayViewVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{
    day: AttendanceDay;
    entries: AttendanceEntry[];
  } | null>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleOpen = () => {
    if (isModalVisible) return;
    setIsModalVisible(true);
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    scale.value = withTiming(1, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const handleClose = () => {
    console.log("Closing modal");
    if (!isModalVisible) return;
    console.log("Modal is visible, proceeding to close");
    opacity.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    scale.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    setTimeout(() => {
      setIsModalVisible(false);
    }, 300);
  };

  const insets = useSafeAreaInsets();

  // Memoize subject data to prevent unnecessary recalculations
  const subjectData = useMemo(() => {
    return attendanceData?.subjects.find(
      (s) => s.subject.id.toString() === subjectId
    );
  }, [attendanceData, subjectId]);

  const attendanceLookup = useMemo(() => {
    if (!subjectSchedule.length) return new Map();

    // Get the date range for current month +/- 1 month for better performance
    const currentMonth = selectedMonth;
    const startMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    const endMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 2,
      0
    ); // Last day of next month

    const lookup = new Map<string, AttendanceEntry[]>();

    // Filter entries to only those in the relevant date range
    const relevantEntries = subjectSchedule.filter((entry) => {
      const entryDate = new Date(entry.year, entry.month - 1, entry.day);
      return entryDate >= startMonth && entryDate <= endMonth;
    });

    relevantEntries.forEach((entry) => {
      const key = `${entry.year}-${entry.month
        .toString()
        .padStart(2, "0")}-${entry.day.toString().padStart(2, "0")}`;

      // Map CourseSchedule to AttendanceEntry with all the required fields
      const attendanceEntry: AttendanceEntry = {
        attendance: entry.final_attendance || entry.teacher_attendance || "A",
        hour: entry.hour,
        is_entered_by_professor: entry.is_entered_by_professor,
        is_entered_by_student: entry.is_entered_by_student,
        is_conflict: entry.is_conflict,
        user_attendance: entry.user_attendance || undefined,
        teacher_attendance: entry.teacher_attendance || undefined,
        final_attendance: entry.final_attendance || undefined,
      };

      const existingEntries = lookup.get(key) || [];
      lookup.set(key, [...existingEntries, attendanceEntry]);
    });

    return lookup;
  }, [subjectSchedule, selectedMonth]);

  // Memoize attendance history calculation
  const attendanceHistory = useMemo(() => {
    if (!subjectData) return [];

    const weeks: AttendanceWeek[] = [];
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const today = new Date();

    let currentWeekStart = startOfWeek(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = endOfWeek(currentWeekStart);
      const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

      const weekData: AttendanceWeek = {
        weekStart: currentWeekStart,
        days: days.map((date) => {
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const isFuture = date > today;
          const isOutsideMonth = date < monthStart || date > monthEnd;

          if (isWeekend || isFuture || isOutsideMonth) {
            return {
              date: format(date, "yyyy-MM-dd"),
              status: "none",
              sessions: 0,
            };
          }

          const dateKey = format(date, "yyyy-MM-dd");
          const attendanceEntries = attendanceLookup.get(dateKey); // This is now an array

          const getStatus = (entries: any[] | undefined) => {
            if (!entries || entries?.length === 0) return "none";
            if (entries?.some((e) => e.attendance?.toLowerCase() === "present"))
              return "present";
            return "absent";
          };

          return {
            date: dateKey,
            status: getStatus(attendanceEntries),
            sessions: attendanceEntries ? attendanceEntries.length : 0,
          };
        }),
      };

      weeks.push(weekData);
      currentWeekStart = new Date(
        currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    }
    return weeks;
  }, [subjectData, selectedMonth, attendanceLookup]);

  // Memoize stats calculation
  const stats = useMemo((): AttendanceStats => {
    const allDays = attendanceHistory
      .flatMap((week) => week.days)
      .filter((day) => day.status !== "none");

    const presentDays = allDays.filter(
      (day) => day.status === "present"
    ).length;
    const absentDays = allDays.filter((day) => day.status === "absent").length;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = allDays.length - 1; i >= 0; i--) {
      if (allDays[i].status === "present") {
        tempStreak++;
        if (i === allDays.length - 1) currentStreak = tempStreak;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalDays: allDays.length,
      presentDays,
      absentDays,
      percentage: allDays.length > 0 ? (presentDays / allDays.length) * 100 : 0,
      streak: currentStreak,
      longestStreak,
    };
  }, [attendanceHistory]);

  // Memoize cell color calculation
  const getCellColor = useCallback(
    (date: string) => {
      const attendanceEntries = attendanceLookup.get(date);
      if (!attendanceEntries || attendanceEntries.length === 0) {
        return colors.border;
      }
      if (
        attendanceEntries.some((e) => e.attendance?.toLowerCase() === "present")
      ) {
        return colors.success;
      }
      return colors.error;
    },
    [attendanceLookup, colors]
  );

  const getCellIntensity = useCallback((sessions: number) => {
    if (sessions === 0) return "20";
    return sessions === 1 ? "60" : "90";
  }, []);

  // Memoize navigation handlers
  const handlePreviousMonth = useCallback(() => {
    setSelectedMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    const nextMonth = addMonths(selectedMonth, 1);
    const today = new Date();
    if (nextMonth <= today) {
      setSelectedMonth(nextMonth);
    }
  }, [selectedMonth]);

  const handleCellPress = useCallback(
    (day: AttendanceDay, isCurrentMonth: boolean) => {
      if (day.status !== "none" && isCurrentMonth) {
        const entries = attendanceLookup?.get(day.date) || [];
        console.log("Selected Day:", day, "Entries:", entries);
        setSelectedDay({ day, entries });
        handleOpen();
      }
    },
    [attendanceLookup]
  );

  // Memoize stat cards data
  const statCards = useMemo(
    () => [
      {
        title: "Total Classes",
        value: stats.totalDays.toString(),
        icon: "calendar-outline",
        color: colors.primary,
      },
      {
        title: "Present",
        value: stats.presentDays.toString(),
        icon: "checkmark-circle-outline",
        color: colors.success,
      },
      {
        title: "Absent",
        value: stats.absentDays.toString(),
        icon: "close-circle-outline",
        color: colors.error,
      },
      {
        title: "Percentage",
        value: `${stats.percentage.toFixed(1)}%`,
        icon: "stats-chart-outline",
        color: stats.percentage >= 75 ? colors.success : colors.warning,
      },
      {
        title: "Current Streak",
        value: stats.streak.toString(),
        icon: "flame-outline",
        color: colors.warning,
      },
      {
        title: "Best Streak",
        value: stats.longestStreak.toString(),
        icon: "trophy-outline",
        color: colors.accent,
      },
    ],
    [stats, colors]
  );

  // Memoized render functions
  const renderMonthSelector = useCallback(() => {
    const today = new Date();
    const isCurrentMonth =
      format(selectedMonth, "yyyy-MM") === format(today, "yyyy-MM");

    return (
      <View style={styles.monthSelector}>
        <TouchableOpacity
          style={styles.monthNavButton}
          onPress={handlePreviousMonth}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {format(selectedMonth, "MMMM yyyy")}
        </Text>

        <TouchableOpacity
          style={[
            styles.monthNavButton,
            isCurrentMonth && styles.monthNavButtonDisabled,
          ]}
          onPress={handleNextMonth}
          disabled={isCurrentMonth}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isCurrentMonth ? colors.textSecondary : colors.text}
          />
        </TouchableOpacity>
      </View>
    );
  }, [selectedMonth, colors, handlePreviousMonth, handleNextMonth]);

  const renderStats = useCallback(
    () => (
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <StatCard key={index} stat={stat} colors={colors} />
        ))}
      </View>
    ),
    [statCards, colors]
  );

  const renderAttendanceGrid = useCallback(
    () => (
      <View style={[styles.gridContainer, { backgroundColor: colors.surface }]}>
        {renderMonthSelector()}

        <View style={styles.grid}>
          {/* Day labels header */}
          <View style={styles.dayLabelsRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} style={styles.dayLabelContainer}>
                <Text
                  style={[styles.dayLabel, { color: colors.textSecondary }]}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {attendanceHistory.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.days.map((day, dayIndex) => {
                const dayDate = new Date(day.date);
                const isCurrentMonth =
                  dayDate >= startOfMonth(selectedMonth) &&
                  dayDate <= endOfMonth(selectedMonth);

                return (
                  <AttendanceCell
                    key={dayIndex}
                    day={day}
                    dayIndex={dayIndex}
                    isCurrentMonth={isCurrentMonth}
                    cellColor={getCellColor(day.date)}
                    cellIntensity={getCellIntensity(day.sessions)}
                    colors={colors}
                    onPress={() => handleCellPress(day, isCurrentMonth)}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    ),
    [
      attendanceHistory,
      selectedMonth,
      colors,
      getCellColor,
      getCellIntensity,
      handleCellPress,
      renderMonthSelector,
    ]
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading attendance data...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.subjectName, { color: colors.text }]}>
            {subjectName}
          </Text>
          <Text style={[styles.subjectCode, { color: colors.textSecondary }]}>
            {subjectCode}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendance Overview
            </Text>
            {renderStats()}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Attendance History
            </Text>
            <Text
              style={[
                styles.sectionDescription,
                { color: colors.textSecondary },
              ]}
            >
              Your attendance pattern for {format(selectedMonth, "MMMM yyyy")}
            </Text>
            {renderAttendanceGrid()}
          </View>
        </View>
      </ScrollView>

      {selectedDay && (
        <AttendanceDayView
          isVisible={isModalVisible}
          onClose={handleClose}
          data={selectedDay}
          animatedStyle={animatedStyle}
          subjectId={subjectId}
          subjectName={subjectName}
          onUpdate={() => {
            refreshAttendance();
          }}
        />
      )}
    </View>
  );
};

// Move styles outside component to prevent recreation
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  subjectName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subjectCode: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: "center",
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthNavButton: {
    padding: 8,
    borderRadius: 20,
  },
  monthNavButtonDisabled: {
    opacity: 0.5,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  gridContainer: {
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  grid: {
    alignItems: "center",
  },
  dayLabelsRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 8,
  },
  dayLabelContainer: {
    width: CELL_SIZE,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  weekRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 2,
  },
  cell: {
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
    borderRadius: 4,
    margin: 1,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cellContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: "600",
  },
  sessionCount: {
    fontSize: 6,
    fontWeight: "bold",
    marginTop: 2,
  },
});

const createStyles = (colors: ThemeColors) => ({
  ...styles,
  container: {
    ...styles.container,
    backgroundColor: colors.background,
  },
});
