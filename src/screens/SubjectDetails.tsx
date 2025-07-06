import React, { useEffect, useState } from "react";
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

interface AttendanceWeek {
  weekStart: Date;
  days: AttendanceDay[];
}

const { width } = Dimensions.get("window");
const CELL_SIZE = (width - 80) / 7;

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
  } = useAttendanceStore();

  const subjectSchedule = courseSchedule?.get(subjectId.toString()) || [];
  const lastEntry = subjectSchedule[subjectSchedule.length - 1];
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    lastEntry ? new Date(lastEntry.year, lastEntry.month - 1) : new Date()
  );
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceWeek[]>(
    []
  );
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    percentage: 0,
    streak: 0,
    longestStreak: 0,
  });

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (attendanceData) {
      processAttendanceData();
    }
  }, [attendanceData, subjectId, selectedMonth]);

  const processAttendanceData = () => {
    const subject = attendanceData?.subjects.find(
      (s) => s.subject.id.toString() === subjectId
    );
    if (!subject) return;

    // Generate weeks for the selected month
    const weeks: AttendanceWeek[] = [];
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const today = new Date();

    // Get the first week that contains the first day of the month
    let currentWeekStart = startOfWeek(monthStart);

    // Continue until we've covered all days in the month
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

          const isPresent = subjectSchedule.find(
            (entry) =>
              entry.year === date.getFullYear() &&
              entry.month === date.getMonth() + 1 &&
              entry.day === date.getDate()
          );

          const noOfSessions = isPresent
            ? subjectSchedule.filter(
                (entry) =>
                  entry.year === date.getFullYear() &&
                  entry.month === date.getMonth() + 1 &&
                  entry.day === date.getDate()
              )?.length
            : 0;

          return {
            date: format(date, "yyyy-MM-dd"),
            status: (isPresent
              ? isPresent.attendance.toLowerCase()
              : "none") as "present" | "absent" | "none",
            sessions: noOfSessions,
          };
        }),
      };

      weeks.push(weekData);
      // Move to the next week
      currentWeekStart = new Date(
        currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    }

    setAttendanceHistory(weeks);

    // Calculate stats for the selected month
    const allDays = weeks
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

    setStats({
      totalDays: allDays.length,
      presentDays,
      absentDays,
      percentage: allDays.length > 0 ? (presentDays / allDays.length) * 100 : 0,
      streak: currentStreak,
      longestStreak,
    });
  };

  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedMonth, 1);
    const today = new Date();
    // Don't allow going beyond current month
    if (nextMonth <= today) {
      setSelectedMonth(nextMonth);
    }
  };

  const renderMonthSelector = () => {
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

        <Text style={styles.monthTitle}>
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
  };

  const getCellColor = (date) => {
    const dayDate = date.split("-")[2]; // Extract day from date string
    const year = date.split("-")[0];
    const month = date.split("-")[1];
    const day = subjectSchedule.find(
      (entry) =>
        entry.year === parseInt(year) &&
        entry.month === parseInt(month) &&
        entry.day === parseInt(dayDate)
    );
    switch (day?.attendance.toLowerCase()) {
      case "present":
        return colors.success;
      case "absent":
        return colors.error;
      case "none":
      default:
        return colors.border;
    }
  };

  const getCellIntensity = (sessions: number) => {
    if (sessions === 0) return "20";
    return sessions === 1 ? "60" : "90";
  };

  const renderAttendanceGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {renderMonthSelector()}

        <View style={styles.grid}>
          {/* Day labels header */}
          <View style={styles.dayLabelsRow}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <View key={day} style={styles.dayLabelContainer}>
                  <Text style={styles.dayLabel}>{day}</Text>
                </View>
              )
            )}
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
                  <TouchableOpacity
                    key={dayIndex}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: isCurrentMonth
                          ? getCellColor(day.date) +
                            getCellIntensity(day.sessions)
                          : colors.border + "10",
                        borderColor: isCurrentMonth
                          ? getCellColor(day.date)
                          : colors.border + "30",
                        opacity: isCurrentMonth ? 1 : 0.3,
                      },
                    ]}
                    onPress={() => {
                      if (day.status !== "none" && isCurrentMonth) {
                        // Show day details
                      }
                    }}
                  >
                    <View style={styles.cellContent}>
                      {/* Show day number for current month */}
                      {isCurrentMonth && (
                        <Text
                          style={[
                            styles.dayNumber,
                            {
                              color:
                                day.status === "present"
                                  ? colors.surface
                                  : colors.text,
                            },
                          ]}
                        >
                          {dayDate.getDate()}
                        </Text>
                      )}
                      {/* Show sessions count if present */}
                      {day.sessions > 0 && isCurrentMonth && (
                        <Text style={styles.sessionCount}>{day.sessions}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          <View style={styles.legendCells}>
            <View
              style={[
                styles.legendCell,
                { backgroundColor: colors.border + "40" },
              ]}
            />
            <View
              style={[
                styles.legendCell,
                { backgroundColor: colors.success + "40" },
              ]}
            />
            <View
              style={[
                styles.legendCell,
                { backgroundColor: colors.success + "60" },
              ]}
            />
            <View
              style={[
                styles.legendCell,
                { backgroundColor: colors.success + "80" },
              ]}
            />
            <View
              style={[styles.legendCell, { backgroundColor: colors.success }]}
            />
          </View>
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>
    );
  };

  const renderStats = () => {
    const statCards = [
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
    ];

    return (
      <View style={styles.statsContainer}>
        {statCards.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: stat.color + "20" }]}
            >
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading attendance data...</Text>
      </View>
    );
  }
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.subjectName}>{subjectName}</Text>
          <Text style={styles.subjectCode}>{subjectCode}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance Overview</Text>
            {renderStats()}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance History</Text>
            <Text style={styles.sectionDescription}>
              Your attendance pattern for {format(selectedMonth, "MMMM yyyy")}
            </Text>
            {renderAttendanceGrid()}
          </View>
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
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
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
      color: colors.text,
    },
    subjectCode: {
      fontSize: 14,
      color: colors.textSecondary,
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
      color: colors.text,
      marginBottom: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    statCard: {
      width: "48%",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: "center",
      shadowColor: colors.shadow,
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
      color: colors.text,
      marginBottom: 4,
    },
    statTitle: {
      fontSize: 12,
      color: colors.textSecondary,
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
      backgroundColor: colors.background,
    },
    monthNavButtonDisabled: {
      opacity: 0.5,
    },
    monthTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    gridContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.shadow,
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
      color: colors.textSecondary,
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
      color: colors.surface,
      fontWeight: "bold",
      marginTop: 2,
    },
    legend: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginHorizontal: 8,
    },
    legendCells: {
      flexDirection: "row",
    },
    legendCell: {
      width: 12,
      height: 12,
      borderRadius: 2,
      marginHorizontal: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });
