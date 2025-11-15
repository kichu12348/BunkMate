import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ColorValue,
  Modal,
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
import AttendanceDayView from "../components/Modals/AttendanceDayView";
import { LinearGradient } from "expo-linear-gradient";
import { normalizeAttendance } from "../utils/helpers";

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
  presentCount?: number; // Optional, used for stats
  absentCount?: number; // Optional, used for stats
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
  percentage: number;
  streak: number;
  longestStreak: number;
  totalHours: number;
  absentHours: number;
  presentHours: number;
}

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 80) / 7;

// Memoized components
const StatCard = React.memo(
  ({ stat, colors }: { stat: any; colors: any }) =>
    stat.visible && (
      <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}>
          <Ionicons name={stat.icon as any} size={20} color={stat.color} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {stat.value}
        </Text>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>
          {stat.title}
        </Text>
      </View>
    )
);

const AttendanceCell = React.memo(
  ({
    day,
    isCurrentMonth,
    cellColor,
    colors,
    onPress,
  }: {
    day: AttendanceDay;
    isCurrentMonth: boolean;
    cellColor: ColorValue[];
    colors: ThemeColors;
    onPress: () => void;
  }) => {
    const dayDate = new Date(day.date);

    return (
      <TouchableOpacity
        style={[
          styles.cell,
          {
            opacity: isCurrentMonth ? 1 : 0,
          },
        ]}
        onPress={onPress}
        disabled={!isCurrentMonth}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={cellColor as [ColorValue, ColorValue, ...ColorValue[]]}
          style={styles.cellGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
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

  const { subjectId, subjectName, subjectCode, toAttend, canMiss } =
    route.params;

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

  const [selectedDay, setSelectedDay] = useState<{
    day: AttendanceDay;
    entries: AttendanceEntry[];
  } | null>(null);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const handleOpen = () => {
    setIsModalVisible(true);
  };

  const handleClose = () => {
    setIsModalVisible(false);
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
          const isWeekend = date.getDay() === 0; // Sunday
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

          const presentCount = attendanceEntries?.filter(
            (e: any) => e.attendance?.toLowerCase() === "present"
          ).length;

          const absentCount = attendanceEntries?.filter(
            (e: any) => e.attendance?.toLowerCase() === "absent"
          ).length;

          return {
            date: dateKey,
            status: getStatus(attendanceEntries),
            sessions: attendanceEntries ? attendanceEntries.length : 0,
            presentCount: presentCount || 0,
            absentCount: absentCount || 0,
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

    let totalHours = 0;
    let absentHours = 0;
    let presentHours = 0;
    allDays.forEach((day) => {
      totalHours += day.sessions || 0;
      absentHours += day.absentCount || 0;
      presentHours += day.presentCount || 0;
    });

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
      percentage: (presentHours / totalHours) * 100 || 0,
      streak: currentStreak,
      longestStreak,
      totalHours,
      absentHours: absentHours,
      presentHours: presentHours,
    };
  }, [attendanceHistory]);

  // Memoize cell color calculation

  const getCellIntensity = useCallback((sessions: number) => {
    if (sessions === 0) return "30";
    return sessions === 1
      ? "90"
      : sessions.toString(16).slice(-1).padStart(2, "d");
  }, []);

  const getCellColor = useCallback(
    (date: string, sessions: number): ColorValue[] => {
      const colorsList: string[] = [];
      const attendanceEntries = attendanceLookup.get(date);
      const cellOpacity = getCellIntensity(sessions);

      if (!attendanceEntries || attendanceEntries.length === 0) {
        return [
          `${colors.border}${cellOpacity}`,
          `${colors.border}${cellOpacity}`,
        ];
      }

      attendanceEntries.forEach((entry: any) => {
        // --- Start of Fix ---

        // Priority 1: If the record is marked as a conflict, always show the warning color.
        if (entry.is_conflict === 1) {
          colorsList.push(`${colors.warning}${cellOpacity}`);
          return; // Go to the next entry for this day
        }
        const attendanceToUse =
          entry.final_attendance ||
          entry.teacher_attendance ||
          entry.user_attendance;
        const normalizedStatus = normalizeAttendance(attendanceToUse);
        if (normalizedStatus === "present") {
          colorsList.push(`${colors.success}${cellOpacity}`);
        } else if (normalizedStatus === "absent") {
          colorsList.push(`${colors.error}${cellOpacity}`);
        } else {
          // Fallback for any other state (e.g., duty leave, none)
          colorsList.push(`${colors.border}${cellOpacity}`);
        }
        // --- End of Fix ---
      });

      if (colorsList.length === 0) {
        return [
          `${colors.border}${cellOpacity}`,
          `${colors.border}${cellOpacity}`,
        ];
      }
      if (colorsList.length === 1) {
        return [colorsList[0], colorsList[0]];
      }
      return colorsList.sort();
    },
    [attendanceLookup, colors, getCellIntensity]
  );

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
      const isItSunday = new Date(day.date).getDay() === 0; // Sunday
      if (isCurrentMonth && !isItSunday) {
        const entries = attendanceLookup?.get(day.date) || [];
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
        value: stats.totalHours.toString(),
        icon: "calendar-outline",
        color: colors.primary,
        visible: true,
      },
      {
        title: "Present",
        value: stats.presentHours.toString(),
        icon: "checkmark-circle-outline",
        color: colors.success,
        visible: true,
      },
      {
        title: "Absent",
        value: stats.absentHours.toString(),
        icon: "close-circle-outline",
        color: colors.error,
        visible: true,
      },
      {
        title: "Percentage",
        value: `${stats.percentage.toFixed(1)}%`,
        icon: "stats-chart-outline",
        color:
          Math.floor(stats.percentage) > 75 ? colors.success : colors.warning,
        visible: true,
      },
      {
        title: `Bunkable Class${canMiss > 1 ? "es" : ""}`,
        value: canMiss.toString(),
        icon: "bed-outline",
        color: colors.primary,
        visible: canMiss > 0,
      },
      {
        title: "Classes to Attend",
        value: toAttend.toString(),
        icon: "alert-circle-outline",
        color: colors.danger,
        visible: toAttend > 0,
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
                    isCurrentMonth={isCurrentMonth}
                    cellColor={getCellColor(day.date, day.sessions)}
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

          {/*Assignments Screen Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.viewAssignmentsButton, { borderColor: colors.primary }]}
              onPress={() =>
                navigation.navigate("Assignments", {
                  subjectId: subjectId,
                  subjectName: subjectName,
                  subjectCode: subjectCode,
                })
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[styles.viewAssignmentsButtonText, { color: colors.primary }]}
              >
                View Assignments
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.primary}
                style={styles.marginLeftAuto}
              />
            </TouchableOpacity>
          </View>

          {/* Attendance History Section */}
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
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        {selectedDay && (
          <AttendanceDayView
            isVisible={true}
            onClose={handleClose}
            data={selectedDay}
            subjectId={subjectId}
            subjectName={subjectName}
            onUpdate={() => {
              refreshAttendance();
            }}
          />
        )}
      </Modal>
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
    gap: 12,
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: "auto",
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
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cellGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: -1,
    ...StyleSheet.absoluteFillObject,
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
  viewAssignmentsButton: {
    borderRadius: 24,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  viewAssignmentsButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  marginLeftAuto: {
    marginLeft: "auto",
  },
});

const createStyles = (colors: ThemeColors) => ({
  ...styles,
  container: {
    ...styles.container,
    backgroundColor: colors.background,
  },
});
