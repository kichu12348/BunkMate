import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  endOfWeek,
  startOfWeek,
  isSameMonth,
} from "date-fns";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import { useAttendanceStore } from "../state/attendance";
import { ThemeColors } from "../types/theme";
import { normalizeAttendance } from "../utils/helpers";
import { Subject } from "../types/api";
import { TAB_BAR_HEIGHT } from "../constants/config";

const { width } = Dimensions.get("window");
const CELL_SIZE = Math.floor((width * 0.9 - 40) / 7);

interface AbsentSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  absentHours: number[];
}

export const AbsenteeReportScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportData, setReportData] = useState<AbsentSubject[]>([]);
  const [isCalendarVisible, setCalendarVisible] = useState(false);

  const { courseSchedule, data: attendanceData } = useAttendanceStore();

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    if (attendanceData?.subjects) {
      for (const subject of attendanceData.subjects) {
        map.set(subject.subject.id.toString(), subject.subject);
      }
    }
    return map;
  }, [attendanceData]);

  useEffect(() => {
    if (!courseSchedule || subjectMap.size === 0) {
      setReportData([]);
      return;
    }

    const absenteeMap = new Map<string, AbsentSubject>();

    courseSchedule.forEach((scheduleEntries, subjectId) => {
      const subjectDetails = subjectMap.get(subjectId);
      if (!subjectDetails) return;

      const absentHours: number[] = [];

      scheduleEntries.forEach((entry) => {
        const entryDate = new Date(entry.year, entry.month - 1, entry.day);
        if (isSameDay(selectedDate, entryDate)) {
          const status = normalizeAttendance(
            entry.final_attendance ||
              entry.user_attendance ||
              entry.teacher_attendance
          );

          if (status === "absent") {
            absentHours.push(entry.hour);
          }
        }
      });

      if (absentHours.length > 0) {
        absenteeMap.set(subjectId, {
          subjectId,
          subjectName: subjectDetails.name,
          subjectCode: subjectDetails.code,
          absentHours: absentHours.sort((a, b) => a - b),
        });
      }
    });

    setReportData(Array.from(absenteeMap.values()));
  }, [selectedDate, courseSchedule, subjectMap]);

  const onDateSelect = (date: Date) => {
    setSelectedDate(date);
    setCalendarVisible(false);
  };

  const renderReportItem = ({ item }: { item: AbsentSubject }) => (
    <View style={styles.reportItemCard}>
      <View style={styles.reportItemHeader}>
        <View style={styles.subjectTextContainer}>
          <Text style={styles.subjectName}>{item.subjectName}</Text>
          <Text style={styles.subjectCode}>{item.subjectCode}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.hoursContainer}>
        <View style={styles.hoursLabelContainer}>
          <Ionicons
            name="time-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.hoursLabel}>Missed periods</Text>
        </View>
        <View style={styles.hoursListContainer}>
          {item.absentHours.map((hour, index) => (
            <View key={index} style={styles.hourBubble}>
              <Text style={styles.hourBubbleText}>{hour}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="checkmark-circle-outline"
        size={64}
        color={colors.success}
      />
      <Text style={styles.emptyTitle}>All Clear!</Text>
      <Text style={styles.emptyMessage}>
        No absences recorded for {format(selectedDate, "do MMMM yyyy")}.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Absentee Report</Text>
      </View>

      <View style={styles.dateSelector}>
        <Text style={styles.dateSelectorLabel}>Showing report for:</Text>
        <TouchableOpacity
          style={styles.dateSelectorButton}
          onPress={() => setCalendarVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateSelectorText}>
            {format(selectedDate, "dd/MM/yyyy")}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reportData}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.subjectId}
        contentContainerStyle={{
          paddingBottom: insets.bottom + TAB_BAR_HEIGHT,
          paddingHorizontal: 16,
        }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <CalendarModal
        visible={isCalendarVisible}
        onClose={() => setCalendarVisible(false)}
        onDateSelect={onDateSelect}
        currentDate={selectedDate}
      />
    </View>
  );
};

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  currentDate: Date;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  onDateSelect,
  currentDate,
}) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [displayMonth, setDisplayMonth] = useState(currentDate);

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const weeks: (Date | null)[][] = [];
    let currentWeekStart = startOfWeek(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = endOfWeek(currentWeekStart);
      const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
      weeks.push(
        days.map((day) => (day >= monthStart && day <= monthEnd ? day : null))
      );
      currentWeekStart = new Date(
        currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
      );
    }
    return weeks;
  }, [displayMonth]);

  const renderDay = (day: Date | null, weekIndex: number, dayIndex: number) => {
    if (!day) {
      return (
        <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.cell} />
      );
    }
    const isSelected = isSameDay(day, currentDate);
    const isTodayDate = isToday(day);

    return (
      <TouchableOpacity
        key={day.toISOString()}
        style={[
          styles.cell,
          styles.monthDay,
          isTodayDate && !isSelected && styles.todayMarker,
          isSelected && styles.selectedDay,
        ]}
        onPress={() => onDateSelect(day)}
        activeOpacity={0.7}
      >
        <View style={styles.cellContent}>
          <Text
            style={[styles.dayNumber, isSelected && styles.selectedDayText]}
          >
            {format(day, "d")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      hardwareAccelerated
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setDisplayMonth(subMonths(displayMonth, 1))}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {format(displayMonth, "MMMM yyyy")}
            </Text>
            <TouchableOpacity
              onPress={() => setDisplayMonth(addMonths(displayMonth, 1))}
              disabled={isSameMonth(displayMonth, new Date())}
              style={[
                isSameMonth(displayMonth, new Date()) && { opacity: 0.5 },
              ]}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            <View style={styles.dayLabelsRow}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day, index) => (
                  <View key={index} style={styles.dayLabelContainer}>
                    <Text
                      style={[styles.dayLabel, { color: colors.textSecondary }]}
                    >
                      {day.charAt(0)}
                    </Text>
                  </View>
                )
              )}
            </View>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) =>
                  renderDay(day, weekIndex, dayIndex)
                )}
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
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
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    dateSelector: {
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    dateSelectorLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    dateSelectorButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      padding: 12,
      gap: 0,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary,
    },
    dateSelectorText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
      textAlign: "center",
    },
    reportItemCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border + "40",
    },
    reportItemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    subjectTextContainer: {
      flex: 1,
      paddingRight: 12,
    },
    subjectName: {
      fontSize: 17,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    subjectCode: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    countBadge: {
      backgroundColor: colors.error,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 3,
    },
    countBadgeText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    divider: {
      height: 1,
      backgroundColor: colors.border + "50",
      marginBottom: 12,
    },
    hoursContainer: {
      gap: 8,
    },
    hoursLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    hoursLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    hoursListContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    hourBubble: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.error,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    hourBubbleText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.error,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 80,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptyMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background + "80",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "90%",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
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
      justifyContent: "space-between",
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
    cellContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    dayNumber: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.text,
    },
    todayMarker: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    monthDay: {
      backgroundColor: colors.border,
    },
    selectedDay: {
      backgroundColor: colors.primary,
    },
    selectedDayText: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },
  });
