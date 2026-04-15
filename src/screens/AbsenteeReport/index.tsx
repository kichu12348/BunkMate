import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { useAttendanceStore } from "../../state/attendance";
import { ThemeColors } from "../../types/theme";
import { normalizeAttendance } from "../../utils/helpers";
import { Subject } from "../../types/api";
import { TAB_BAR_HEIGHT } from "../../constants/config";
import { RootStackParamList } from "../../navigation/RootNavigator";
import Text from "../../components/UI/Text";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DateReport, AbsentSubject, openPdf } from "../../utils/absentee";

const { width, height } = Dimensions.get("window");
const CELL_SIZE = Math.floor((width * 0.9 - 40) / 7);

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

type ReportNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

const ToPdfBtn = ({
  selectedDates,
  reportData,
  styles,
  onPress,
}: {
  selectedDates: Date[];
  reportData: DateReport[];
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isVisible = selectedDates.length > 0 && reportData.length > 0;

  const borderWidth = useSharedValue(0);
  const iconOpacity = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => {
    return {
      borderWidth: borderWidth.value,
    };
  }, []);

  const iconAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: iconOpacity.value,
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      iconOpacity.value = withTiming(1, {
        duration: 500,
        easing: Easing.in(Easing.ease),
      });
      borderWidth.value = withTiming(1.5, {
        duration: 500,
        easing: Easing.in(Easing.ease),
      });
    } else {
      iconOpacity.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
      borderWidth.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.ease),
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;
  return (
    <AnimatedTouchableOpacity
      style={[
        styles.toPdfBtn,
        animStyle,
        {
          bottom: TAB_BAR_HEIGHT + 50,
          right: insets.right + 10,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AnimatedIonicons
        name="document-text-outline"
        size={24}
        color={colors.primary}
        style={iconAnimStyle}
      />
    </AnimatedTouchableOpacity>
  );
};

export const AbsenteeReportScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ReportNavigationProp>();

  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [reportData, setReportData] = useState<DateReport[]>([]);
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

    const reports: DateReport[] = [];

    // Sort selected dates chronologically
    const sortedDates = [...selectedDates].sort(
      (a, b) => a.getTime() - b.getTime(),
    );

    for (const selectedDate of sortedDates) {
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
                entry.teacher_attendance,
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

      reports.push({
        date: selectedDate,
        dateKey: format(selectedDate, "yyyy-MM-dd"),
        subjects: Array.from(absenteeMap.values()),
      });
    }

    setReportData(reports);
  }, [selectedDates, courseSchedule, subjectMap]);

  const onDateSelect = useCallback((date: Date) => {
    setSelectedDates((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      if (exists) {
        const filtered = prev.filter((d) => !isSameDay(d, date));
        return filtered.length > 0 ? filtered : prev;
      }
      return [...prev, date];
    });
  }, []);

  const removeDate = useCallback((date: Date) => {
    setSelectedDates((prev) => {
      const filtered = prev.filter((d) => !isSameDay(d, date));
      return filtered;
    });
  }, []);

  const handleGeneratePdf = async () => {
    await openPdf(reportData);
  };

  const renderDateSection = ({ item }: { item: DateReport }) => (
    <View style={styles.dateSectionContainer}>
      <View style={styles.dateSectionHeader}>
        <View style={styles.dateSectionDot} />
        <Text style={styles.dateSectionTitle}>
          {format(item.date, "EEEE, do MMMM yyyy")}
        </Text>
      </View>
      {item.subjects.length > 0 ? (
        item.subjects.map((subject) => (
          <View key={subject.subjectId} style={styles.reportItemCard}>
            <View style={styles.reportItemHeader}>
              <View style={styles.subjectTextContainer}>
                <Text style={styles.subjectName}>{subject.subjectName}</Text>
                <Text style={styles.subjectCode}>{subject.subjectCode}</Text>
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
                <Text style={styles.hoursLabel}>
                  Missed period{subject.absentHours.length > 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.hoursListContainer}>
                {subject.absentHours.map((hour, index) => (
                  <View key={index} style={styles.hourBubble}>
                    <Text style={styles.hourBubbleText}>{hour}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.dateEmptyCard}>
          <Ionicons
            name="checkmark-circle-outline"
            size={28}
            color={colors.success}
          />
          <Text style={styles.dateEmptyText}>No absences on this date</Text>
        </View>
      )}
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
        No absences recorded for the selected dates.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Absentee Report</Text>
      </View>

      <TouchableOpacity
        style={styles.dutyLeaveButton}
        onPress={() => navigation.navigate("DutyLeave")}
        activeOpacity={0.8}
      >
        <View style={styles.dutyLeaveButtonIcon}>
          <Ionicons
            name="document-attach-outline"
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.dutyLeaveButtonContent}>
          <Text style={styles.dutyLeaveButtonTitle}>Duty Leaves</Text>
          <Text style={styles.dutyLeaveButtonSubtitle}>
            Manage your duty leave requests
          </Text>
        </View>
        <View style={styles.dutyLeaveButtonAction}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </View>
      </TouchableOpacity>

      <View style={styles.dateSelector}>
        <Text style={styles.dateSelectorLabel}>Showing report for:</Text>
        <TouchableOpacity
          style={styles.dateSelectorButton}
          onPress={() => setCalendarVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateSelectorText}>
            {selectedDates.length === 1
              ? format(selectedDates[0], "dd/MM/yyyy")
              : `${selectedDates.length} dates selected`}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.primary} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.selectedDatesScroll}
          contentContainerStyle={styles.selectedDatesContainer}
        >
          {[...selectedDates]
            .sort((a, b) => a.getTime() - b.getTime())
            .map((date) => (
              <View key={date.toISOString()} style={styles.selectedDateChip}>
                <Text style={styles.selectedDateChipText}>
                  {format(date, "dd MMM")}
                </Text>
                <TouchableOpacity
                  onPress={() => removeDate(date)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>
      </View>

      <FlatList
        data={reportData}
        renderItem={renderDateSection}
        keyExtractor={(item) => item.dateKey}
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
        selectedDates={selectedDates}
      />
      <ToPdfBtn
        onPress={handleGeneratePdf}
        styles={styles}
        reportData={reportData}
        selectedDates={selectedDates}
      />
    </View>
  );
};

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDates: Date[];
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  onDateSelect,
  selectedDates,
}) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [displayMonth, setDisplayMonth] = useState(
    selectedDates.length > 0
      ? selectedDates[selectedDates.length - 1]
      : new Date(),
  );

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const weeks: (Date | null)[][] = [];
    let currentWeekStart = startOfWeek(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = endOfWeek(currentWeekStart);
      const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
      weeks.push(
        days.map((day) => (day >= monthStart && day <= monthEnd ? day : null)),
      );
      currentWeekStart = new Date(
        currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000,
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
    const isSelected = selectedDates.some((d) => isSameDay(d, day));
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
                ),
              )}
            </View>
            {calendarWeeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.weekRow}>
                {week.map((day, dayIndex) =>
                  renderDay(day, weekIndex, dayIndex),
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
      position: "relative",
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
    dutyLeaveButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.primary + "20",
    },
    dutyLeaveButtonIcon: {
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    dutyLeaveButtonContent: {
      flex: 1,
    },
    dutyLeaveButtonTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    dutyLeaveButtonSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    dutyLeaveButtonAction: {
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
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
      color: colors.text,
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
    selectedDatesScroll: {
      marginTop: 10,
      maxHeight: 40,
      minHeight: 30,
    },
    selectedDatesContainer: {
      flexDirection: "row",
      gap: 8,
      paddingVertical: 2,
    },
    selectedDateChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.primary + "18",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    selectedDateChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    dateSectionContainer: {
      marginBottom: 20,
    },
    dateSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      paddingVertical: 4,
    },
    dateSectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    dateSectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.2,
    },
    dateEmptyCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border + "40",
    },
    dateEmptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
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
      shadowColor: colors.shadow,
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
      color: colors.text,
      fontWeight: "bold",
    },
    toPdfBtn: {
      position: "absolute",
      width: 60,
      height: 60,
      borderRadius: 30,
      borderStyle: "dashed",
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
