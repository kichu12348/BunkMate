import React, { JSX, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../hooks/useTheme";
import { useAttendanceStore } from "../state/attendance";
import { AttendanceDatabase } from "../utils/attendanceDatabase";
import { CourseSchedule } from "../types/api";
import { ThemeColors } from "../types/theme";
import { normalizeAttendance } from "../utils/helpers";

const { width, height } = Dimensions.get("screen");

// Type definitions
interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "none";
  sessions: number;
}

interface AttendanceEntry {
  attendance: string;
  hour: number;
  is_entered_by_professor?: number;
  is_entered_by_student?: number;
  final_attendance?: string;
  teacher_attendance?: string;
  user_attendance?: string;
  is_conflict?: number;
}

interface Data {
  day: AttendanceDay;
  entries: AttendanceEntry[];
}

interface AttendanceDayViewProps {
  data?: Data | null;
  isVisible: boolean;
  onClose: () => void;
  subjectId?: string;
  subjectName?: string;
  onUpdate?: () => void;
}

interface EditModalDataProps {
  attendance: string;
  hour: number;
  is_entered_by_professor?: number;
  is_entered_by_student?: number;
  month?: number;
  day?: number;
  year?: number;
  is_conflict?: number;
  teacher_attendance?: string;
  user_attendance?: string;
  final_attendance?: string;
}

// Edit Modal Component
const AttendanceEditModal: React.FC<{
  data: EditModalDataProps | null;
  close: () => void;
  colors: ThemeColors;
  isVisible: boolean;
  subjectId?: string;
  subjectName?: string;
  onUpdate?: () => void;
  onStatusUpdate?: () => void;
  closeThis?: () => void;
  checkForConflicts: (params: {
    hour: number;
    day: number;
    month: number;
    year: number;
  }) => Promise<boolean>;
}> = ({
  data,
  close,
  colors,
  isVisible,
  subjectId,
  onStatusUpdate,
  checkForConflicts,
  closeThis,
}) => {
  const insets = useSafeAreaInsets();
  const {
    markManualAttendance,
    deleteManualAttendance,
    resolveConflict,
    courseSchedule,
  } = useAttendanceStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!isVisible || !data) return null;
  // State calculations
  const isEnteredByProfessor = data.is_entered_by_professor === 1;
  const isEnteredByStudent = data.is_entered_by_student === 1;
  const isConflict = data.is_conflict === 1;
  const attendanceStatus =
    data.final_attendance ||
    data.attendance ||
    data.teacher_attendance ||
    data.user_attendance;
  const hasRecord = !!data.attendance;

  const handleAttendanceChange = async (attendance: "Present" | "Absent") => {
    if (!subjectId || !data) return;

    setIsLoading(true);
    try {
      // The component just calls the store action. That's it.
      await markManualAttendance({
        subjectId,
        year: data.year,
        month: data.month,
        day: data.day,
        hour: data.hour,
        attendance: attendance.toLowerCase() as "present" | "absent",
      });
      onStatusUpdate?.(); // Refresh the parent view
      close(); // Close the modal on success
    } catch (error: any) {
      // The store threw an error (e.g., conflict), so we just show it.
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!subjectId || !data) return;

    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteManualAttendance({
                subjectId,
                year: data.year,
                month: data.month,
                day: data.day,
                hour: data.hour,
              });
              onStatusUpdate?.();
              close();
              closeThis?.();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleResolveConflict = async (
    resolution: "accept_teacher" | "keep_user"
  ) => {
    if (!subjectId || !data || !data.is_conflict) return;

    setIsLoading(true);
    try {
      // Find the full conflict record from the schedule
      const conflictRecord = courseSchedule
        .get(subjectId)
        ?.find((rec) => rec.hour === data.hour);
      if (conflictRecord) {
        await resolveConflict(conflictRecord, resolution);
        onStatusUpdate?.();
        close();
      } else {
        throw new Error("Could not find the conflict record to resolve.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderConflictResolution = () => (
    <View style={styles.editContent}>
      <Ionicons name="warning" size={48} color={colors.warning} />
      <Text style={[styles.editTitle, { color: colors.text }]}>
        Attendance Conflict
      </Text>
      <Text style={[styles.editMessage, { color: colors.textSecondary }]}>
        Your record differs from your professor's record for Hour {data.hour}
      </Text>

      <View style={styles.conflictInfo}>
        <Text style={[styles.conflictLabel, { color: colors.textSecondary }]}>
          Professor marked:{" "}
          {data.teacher_attendance?.toLowerCase() === "p" ||
          data.teacher_attendance?.toLowerCase() === "present"
            ? "Present"
            : "Absent"}
        </Text>
        <Text style={[styles.conflictLabel, { color: colors.textSecondary }]}>
          You marked:{" "}
          {data.user_attendance?.toLowerCase() === "p" ||
          data.user_attendance?.toLowerCase() === "present"
            ? "Present"
            : "Absent"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.primary }]}
          onPress={() => handleResolveConflict("accept_teacher")}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Accept Professor's Record
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfessorOnlyView = () => (
    <View style={styles.editContent}>
      <Ionicons name="school" size={48} color={colors.primary} />
      <Text style={[styles.editTitle, { color: colors.text }]}>
        Professor Record
      </Text>
      <Text style={[styles.editMessage, { color: colors.textSecondary }]}>
        This hour's attendance was marked by your professor. You cannot edit it.
      </Text>
      <Text style={[styles.editAttendance, { color: colors.text }]}>
        Hour {data.hour}: {attendanceStatus}
      </Text>
    </View>
  );

  const renderEditForm = () => (
    <View style={styles.editContent}>
      <Ionicons name="create" size={48} color={colors.primary} />
      <Text style={[styles.editTitle, { color: colors.text }]}>
        {hasRecord ? "Edit" : "Mark"} Attendance
      </Text>
      <Text style={[styles.editMessage, { color: colors.textSecondary }]}>
        {hasRecord ? "Update your attendance for" : "Mark your attendance for"}{" "}
        Hour {data.hour}
      </Text>
      <Text style={[styles.editAttendance, { color: colors.text }]}>
        Current Status: {attendanceStatus}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.success }]}
          onPress={() => handleAttendanceChange("Present")}
          disabled={isLoading}
        >
          <Feather name="user-check" size={20} color={colors.success} />
          <Text style={[styles.buttonText, { color: colors.success }]}>
            Present
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { borderColor: colors.error }]}
          onPress={() => handleAttendanceChange("Absent")}
          disabled={isLoading}
        >
          <Feather name="user-minus" size={20} color={colors.error} />
          <Text style={[styles.buttonText, { color: colors.error }]}>
            Absent
          </Text>
        </TouchableOpacity>
      </View>

      {isEnteredByStudent && !isConflict && (
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: colors.error }]}
          onPress={handleDeleteRecord}
          disabled={isLoading}
        >
          <Ionicons name="trash" size={16} color={colors.error} />
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>
            Delete Record
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    if (isConflict) return renderConflictResolution();
    if (isEnteredByProfessor && !isEnteredByStudent)
      return renderProfessorOnlyView();
    return renderEditForm();
  };

  return (
    <View
      style={[
        styles.editContainer,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom,
          backgroundColor: `${colors.background}dd`,
        },
      ]}
    >
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={close} disabled={isLoading}>
          <Ionicons name="close" size={34} color={colors.text} />
        </TouchableOpacity>
      </View>
      {renderContent()}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View
            style={[
              styles.loadingContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Updating...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Main Component
const AttendanceDayView: React.FC<AttendanceDayViewProps> = ({
  isVisible,
  onClose,
  subjectId,
  subjectName,
  onUpdate,
  data,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<EditModalDataProps | null>(null);
  const [hourlyStatus, setHourlyStatus] = useState<Map<number, string>>(
    new Map()
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // Animation values
  const translateY = useSharedValue(height);
  const scale = useSharedValue(0);

  // Store subscriptions
  const checkForConflicts = useAttendanceStore(
    (state) => state.checkForConflicts
  );
  const courseSchedule = useAttendanceStore((state) => state.courseSchedule);

  // Callbacks
  const forceRefreshStatus = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // useEffect(() => {
  //   AttendanceDatabase.saveAttendanceRecord("64188", 2025, 7, 10, 1, {
  //     created_at: 1752864646035,
  //     day: 10,
  //     final_attendance: "present",
  //     hour: 1,
  //     id: 0,
  //     is_conflict: 0,
  //     is_entered_by_professor: 0,
  //     is_entered_by_student: 1,
  //     is_user_override: 1,
  //     last_user_update: 1752864646035,
  //     month: 7,
  //     subject_id: "64188",
  //     teacher_attendance: null,
  //     updated_at: 1752864646035,
  //     user_attendance: "present",
  //     year: 2025,
  //   });
  // }, []);

  // Effects
  useEffect(() => {
    if (isVisible) {
      forceRefreshStatus();
    }
  }, [isVisible, forceRefreshStatus]);

  useEffect(() => {
    const calculateHourlyStatus = () => {
      const status = new Map<number, string>();

      for (let hour = 1; hour <= 6; hour++) {
        status.set(hour, "none"); // Initialize all hours
      }

      if (!data?.day?.date || !subjectId) return status;

      const currentDate = new Date(data.day.date);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();

      const subjectData = courseSchedule?.get(subjectId) || [];
      console.log("[UI] Calculating hourly status for subject:", subjectData.filter(r=>r.day===10 && r.hour===1));
      const manualRecords = new Map<number, CourseSchedule>();

      subjectData.forEach((record) => {
        if (
          record.year === year &&
          record.month === month &&
          record.day === day
        ) {
          manualRecords.set(record.hour, record);
        }
      });

      // This is the refactored loop
      for (let hour = 1; hour <= 6; hour++) {
        const manualRecord = manualRecords.get(hour);
        const originalEntry = data?.entries?.find((e) => e.hour === hour);
        const recordToUse = manualRecord || originalEntry;

        if (recordToUse) {
          const displayStatus = (() => {
            if (recordToUse.is_conflict === 1) return "conflict";

            const prioritized = [
              recordToUse.final_attendance,
              recordToUse.user_attendance,
              recordToUse.teacher_attendance,
              recordToUse.attendance,
            ];

            for (const s of prioritized) {
              const normalizedStatus = normalizeAttendance(s);
              if (normalizedStatus !== "none") {
                return normalizedStatus;
              }
            }

            return "none";
          })();

          status.set(hour, displayStatus);
        }
      }

      return status;
    };

    const newStatus = calculateHourlyStatus();
    setHourlyStatus(newStatus);
  }, [data, courseSchedule, subjectId, refreshKey]);

  // Handlers
  const handleOpenEditModal = async (hour: number) => {
    if (showEditModal) return;

    const currentDate = data?.day?.date ? new Date(data.day.date) : new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Get manual record
    let manualRecord: CourseSchedule | null = null;
    if (subjectId && courseSchedule) {
      const subjectData = courseSchedule.get(subjectId) || [];
      manualRecord =
        subjectData.find(
          (record) =>
            record.year === year &&
            record.month === month &&
            record.day === day &&
            record.hour === hour
        ) || null;
    }

    // Get database record
    let databaseRecord: CourseSchedule | null = null;
    if (subjectId && !manualRecord) {
      databaseRecord = await AttendanceDatabase.getAttendanceRecord(
        subjectId,
        year,
        month,
        day,
        hour
      );
    }

    const attendanceRecord =
      manualRecord ||
      databaseRecord ||
      data?.entries?.find((e) => e.hour === hour) ||
      null;
    const dataEntry = data?.entries?.find((e) => e.hour === hour);

    const editModalData: EditModalDataProps = {
      attendance:
        attendanceRecord?.final_attendance ||
        attendanceRecord?.user_attendance ||
        dataEntry?.attendance ||
        "",
      hour: hour,
      is_entered_by_professor:
        attendanceRecord?.is_entered_by_professor ||
        dataEntry?.is_entered_by_professor ||
        0,
      is_entered_by_student:
        attendanceRecord?.is_entered_by_student ||
        dataEntry?.is_entered_by_student ||
        0,
      is_conflict: attendanceRecord?.is_conflict || dataEntry?.is_conflict || 0,
      teacher_attendance:
        attendanceRecord?.teacher_attendance ||
        dataEntry?.teacher_attendance ||
        undefined,
      user_attendance:
        attendanceRecord?.user_attendance ||
        dataEntry?.user_attendance ||
        undefined,
      final_attendance:
        attendanceRecord?.final_attendance ||
        dataEntry?.final_attendance ||
        undefined,
      year,
      month,
      day,
    };

    setEditData(editModalData);
    setShowEditModal(true);

    // Animate modal
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    scale.value = withTiming(1, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const handleCloseEditModal = () => {
    if (!showEditModal) return;

    translateY.value = withTiming(height, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
    scale.value = withTiming(0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });

    setTimeout(() => {
      setShowEditModal(false);
      setEditData(null);
    }, 300);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderHourCell = (hour: number) => {
    const status = hourlyStatus.get(hour);
    const isPresent = status === "present";
    const isAbsent = status === "absent";
    const isConflict = status === "conflict";
    const statusColor = isPresent
      ? colors.success
      : isAbsent
      ? colors.error
      : isConflict
      ? colors.warning
      : colors.textSecondary;

    const entry = data?.entries?.find((e) => e.hour === hour);

    // Check manual entry
    let manualEntry: CourseSchedule | null = null;
    if (courseSchedule && subjectId) {
      const currentDate = data?.day?.date
        ? new Date(data.day.date)
        : new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      const subjectData = courseSchedule.get(subjectId) || [];
      manualEntry =
        subjectData.find(
          (record) =>
            record.year === year &&
            record.month === month &&
            record.day === day &&
            record.hour === hour
        ) || null;
    }

    return (
      <TouchableOpacity
        style={[
          styles.hourCell,
          { borderColor: statusColor },
          (isPresent || isAbsent) && {
            backgroundColor: statusColor + "15",
          },
        ]}
        key={hour}
        activeOpacity={0.8}
        onPress={() => handleOpenEditModal(hour)}
      >
        <Text style={[styles.hourText, { color: statusColor }]}>
          Hour {hour}
        </Text>
        {status && status !== "none" && (
          <View style={styles.sourceIndicator}>
            {isConflict ? (
              <Ionicons name="warning" size={12} color={colors.warning} />
            ) : (
              <>
                {(entry?.is_entered_by_professor === 1 ||
                  manualEntry?.is_entered_by_professor === 1) && (
                  <Ionicons name="school" size={12} color={colors.primary} />
                )}
                {(entry?.is_entered_by_student === 1 ||
                  manualEntry?.is_entered_by_student === 1) && (
                  <Ionicons name="person" size={12} color={colors.secondary} />
                )}
              </>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const modalAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ] as any,
    };
  });

  if (!isVisible) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.blurContainer,
          { backgroundColor: colors.background + "c0" },
        ]}
      />
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Daily Attendance
          </Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {formatDate(data?.day?.date || "")}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.success + "15" },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={[styles.statLabel, { color: colors.success }]}>
              Present
            </Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {
                Array.from(hourlyStatus.values()).filter((s) => s === "present")
                  .length
              }
            </Text>
          </View>
          <View
            style={[styles.statCard, { backgroundColor: colors.error + "15" }]}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={[styles.statLabel, { color: colors.error }]}>
              Absent
            </Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {
                Array.from(hourlyStatus.values()).filter((s) => s === "absent")
                  .length
              }
            </Text>
          </View>
        </View>

        <View style={styles.sessionsContainer}>
          <View style={styles.hoursRow}>{[1, 2, 3].map(renderHourCell)}</View>
          <View style={styles.hoursRow}>{[4, 5, 6].map(renderHourCell)}</View>
        </View>
      </View>

      {showEditModal && (
        <Animated.View style={[styles.editModalContainer, modalAnimStyle]}>
          <AttendanceEditModal
            close={handleCloseEditModal}
            data={editData}
            colors={colors}
            isVisible={showEditModal}
            subjectId={subjectId}
            subjectName={subjectName}
            onUpdate={onUpdate}
            onStatusUpdate={forceRefreshStatus}
            checkForConflicts={checkForConflicts}
            closeThis={onClose}
          />
        </Animated.View>
      )}
    </View>
  );
};

export default AttendanceDayView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.92,
    maxHeight: height * 0.9,
    maxWidth: 400,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 12,
    zIndex: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  sessionsContainer: {
    width: "100%",
    marginTop: 8,
    gap: 8,
  },
  hourText: {
    fontSize: 16,
    fontWeight: "600",
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    top: 0,
    left: 0,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
  },
  hourCell: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    minHeight: 50,
    borderWidth: 1,
    borderColor: "transparent",
    justifyContent: "center",
  },
  sourceIndicator: {
    flexDirection: "row",
    marginTop: 4,
    gap: 2,
  },
  editModalContainer: {
    width: width,
    height: height,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  editContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  editHeader: {
    width: "100%",
    padding: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  editContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  editTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  editMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  editAttendance: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 16,
  },
  conflictInfo: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: "100%",
  },
  conflictLabel: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 6,
    minWidth: 200,
  },
  conflictButton: {
    justifyContent: "center",
    borderWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    gap: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  loadingContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
