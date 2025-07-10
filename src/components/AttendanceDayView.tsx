import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { JSX, useState } from "react";
import Animated, {
  Easing,
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeColors } from "../types/theme";
import { userAttendanceService } from "../db/userAttendanceService";
import { Alert } from "react-native";

const { width, height } = Dimensions.get("screen");

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
  final_attendance?: string;
  teacher_attendance?: string;
  user_attendance?: string;
  is_conflict?: number; // 0 or 1
}

interface Data {
  day: AttendanceDay;
  entries: AttendanceEntry[];
}

interface AttendanceDayViewProps {
  data?: Data | null;
  isVisible: boolean;
  animatedStyle: any;
  onClose: () => void;
  subjectId?: string;
  subjectName?: string;
  onUpdate?: () => void;
}

interface EditModalDataProps {
  attendance: string;
  hour: number;
  is_entered_by_professor?: number; // 0 or 1
  is_entered_by_student?: number; // 0 or 1
  month?: number;
  day?: number;
  year?: number;
  is_conflict?: number; // 0 or 1
  teacher_attendance?: string;
  user_attendance?: string;
  final_attendance?: string;
}

// Helper function to check for time conflicts
const checkTimeConflict = (
  subjectId: string,
  year: number,
  month: number,
  day: number,
  hour: number
): boolean => {
  try {
    return userAttendanceService.checkTimeConflict(
      subjectId,
      year,
      month,
      day,
      hour
    );
  } catch (error) {
    console.error("Error checking time conflict:", error);
    return false;
  }
};

function AttendanceEditModal({
  data,
  close,
  colors,
  isVisible,
  subjectId,
  subjectName,
  onUpdate,
}: {
  data: EditModalDataProps | null;
  close: () => void;
  colors: ThemeColors;
  isVisible: boolean;
  subjectId?: string;
  subjectName?: string;
  onUpdate?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  // Get the current date for database lookup
  const currentDate = new Date();
  const year = data?.year || currentDate.getFullYear();
  const month = data?.month || currentDate.getMonth() + 1;
  const day = data?.day || currentDate.getDate();

  // Get the latest attendance record from database to ensure fresh data
  const attendanceRecord = data;

  // Use database record if available, otherwise use passed data
  const isEnteredByProfessor = data?.is_entered_by_professor === 1;
  const isEnteredByStudent = attendanceRecord?.is_entered_by_student === 1;
  const isConflict = attendanceRecord?.is_conflict === 1 || false;
  const attendanceStatus =
    attendanceRecord?.final_attendance ||
    attendanceRecord?.attendance ||
    attendanceRecord?.teacher_attendance ||
    attendanceRecord?.user_attendance;
  const hasRecord = !!attendanceRecord;

  // Don't allow editing if only professor has entered data (unless there's a conflict to resolve)

  const handleAttendanceChange = async (attendance: "Present" | "Absent") => {
    if (!subjectId) return;

    try {
      setIsLoading(true);

      // Check if any other subject has a record for this hour/day
      // Use the service method to check for conflicts
      const hasConflict = checkTimeConflict(
        subjectId,
        year,
        month,
        day,
        data.hour
      );

      if (hasConflict) {
        Alert.alert(
          "Time Conflict",
          `You already have attendance recorded for Hour ${data.hour} on this day for another subject. You cannot be in two classes at the same time.`,
          [{ text: "OK", style: "default" }]
        );
        setIsLoading(false);
        return;
      }

      // Convert UI format to database format
      const dbAttendance = attendance === "Present" ? "P" : "A";

      await userAttendanceService.setUserAttendance(
        subjectId,
        year,
        month,
        day,
        data.hour,
        dbAttendance
      );

      onUpdate?.();
      close();
    } catch (error) {
      Alert.alert("Error", "Failed to update attendance");
      console.error("Error updating attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!subjectId || !isEnteredByStudent) return;

    Alert.alert(
      "Delete Record",
      "Are you sure you want to delete your attendance record for this hour?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await userAttendanceService.deleteUserOverride(
                subjectId,
                year,
                month,
                day,
                data.hour
              );

              // Update parent state and close modal
              onUpdate?.();
              close();
            } catch (error) {
              Alert.alert("Error", "Failed to delete attendance record");
              console.error("Error deleting record:", error);
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
    if (!subjectId || !isConflict) return;

    try {
      setIsLoading(true);
      await userAttendanceService.resolveConflict(
        subjectId,
        year,
        month,
        day,
        data.hour,
        resolution
      );

      onUpdate?.();
      close();
    } catch (error) {
      Alert.alert("Error", "Failed to resolve conflict");
      console.error("Error resolving conflict:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isConflict) {
      // Show conflict resolution options
      return (
        <View style={styles.editContent}>
          <Ionicons name="warning" size={48} color={colors.warning} />
          <Text style={[styles.editTitle, { color: colors.text }]}>
            Attendance Conflict
          </Text>
          <Text style={[styles.editMessage, { color: colors.textSecondary }]}>
            Your record differs from your professor's record for Hour{" "}
            {data.hour}
          </Text>

          <View style={styles.conflictInfo}>
            <Text
              style={[styles.conflictLabel, { color: colors.textSecondary }]}
            >
              Professor marked:{" "}
              {attendanceRecord?.teacher_attendance === "P"
                ? "Present"
                : "Absent"}
            </Text>
            <Text
              style={[styles.conflictLabel, { color: colors.textSecondary }]}
            >
              You marked:{" "}
              {attendanceRecord?.user_attendance === "P" ? "Present" : "Absent"}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.acceptButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => handleResolveConflict("accept_teacher")}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                Accept Professor's Record
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.keepButton,
                { backgroundColor: colors.secondary },
              ]}
              onPress={() => handleResolveConflict("keep_user")}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                Keep My Record
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.editContent}>
        <Ionicons name="create" size={48} color={colors.primary} />
        <Text style={[styles.editTitle, { color: colors.text }]}>
          {hasRecord ? "Edit" : "Mark"} Attendance
        </Text>
        <Text style={[styles.editMessage, { color: colors.textSecondary }]}>
          {hasRecord
            ? "Update your attendance for"
            : "Mark your attendance for"}{" "}
          Hour {data.hour}
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.presentButton,
              { backgroundColor: colors.success },
            ]}
            onPress={() => handleAttendanceChange("Present")}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={20} color={colors.surface} />
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              Present
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.absentButton,
              { backgroundColor: colors.error },
            ]}
            onPress={() => handleAttendanceChange("Absent")}
            disabled={isLoading}
          >
            <Ionicons name="close" size={20} color={colors.surface} />
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              Absent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Show delete option if user created the record and it's not in conflict */}
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
  };

  if (!isVisible || !data) return null;
  if (isEnteredByProfessor && !isEnteredByStudent && !isConflict) {
    return (
      <View
        style={[
          styles.editContainer,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            backgroundColor: `${colors.background}dd`,
          },
        ]}
      >
        <View style={styles.editHeader}>
          <TouchableOpacity onPress={close}>
            <Ionicons name="close" size={34} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.editContent}>
          <Ionicons name="school" size={48} color={colors.primary} />
          <Text style={[styles.editTitle, { color: colors.text }]}>
            Professor Record
          </Text>
          <Text style={[styles.editMessage, { color: colors.textSecondary }]}>
            This hour's attendance was marked by your professor. You cannot edit
            it.
          </Text>
          <Text style={[styles.editAttendance, { color: colors.text }]}>
            Hour {data.hour}:{"  "}
            {attendanceStatus}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.editContainer,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: `${colors.background}aa`,
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
}

const AttendanceDayView = ({
  isVisible,
  onClose,
  animatedStyle,
  subjectId,
  subjectName,
  onUpdate,
  data,
}: AttendanceDayViewProps): JSX.Element => {
  const { colors } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<EditModalDataProps | null>(null);
  const [hourlyStatus, setHourlyStatus] = React.useState<Map<number, string>>(
    new Map<number, string>()
  );

  React.useEffect(() => {
    const status = new Map<number, string>();
    data.entries?.forEach((entry) => {
      // Determine display status based on attendance
      const displayStatus = (() => {
        const finalAtt = entry.final_attendance?.[0]?.toUpperCase();
        const teacherAtt = entry.teacher_attendance?.[0]?.toUpperCase();
        const userAtt = entry.user_attendance?.[0]?.toUpperCase();

        // Check for conflict first
        if (entry.is_conflict === 1) {
          return "conflict";
        }

        // Check for present status
        if (
          finalAtt === "P" ||
          teacherAtt === "P" ||
          (entry.is_entered_by_student === 1 && userAtt === "P")
        ) {
          return "present";
        }

        // Check for absent status
        if (
          finalAtt === "A" ||
          teacherAtt === "A" ||
          (entry.is_entered_by_student === 1 && userAtt === "A")
        ) {
          return "absent";
        }

        // Default case
        return "none";
      })();
      console.log(`Hour ${entry.hour}: ${displayStatus}`);
      status.set(entry.hour, displayStatus);
    });
    setHourlyStatus(status);
  }, [data]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const translateY = useSharedValue(height);
  const scale = useSharedValue(0);

  const handleOpenEditModal = async (hour: number) => {
    if (showEditModal) return;

    // Get current date for database lookup
    const currentDate = data?.day?.date ? new Date(data.day.date) : new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // Get the latest attendance record from database to ensure fresh data
    const attendanceRecord = data.entries?.find((e) => e.hour === hour) || null;

    // Find entry from original data as fallback
    const dataEntry = data.entries?.find((e) => e.hour === hour);

    const editData: EditModalDataProps = {
      attendance:
        attendanceRecord?.final_attendance || dataEntry?.attendance || "",
      hour: hour,
      is_entered_by_professor:
        attendanceRecord?.is_entered_by_professor ||
        dataEntry?.is_entered_by_professor ||
        0,
      is_entered_by_student:
        attendanceRecord?.is_entered_by_student ||
        dataEntry?.is_entered_by_student ||
        0,
      is_conflict: attendanceRecord?.is_conflict || 0,
      teacher_attendance: attendanceRecord?.teacher_attendance || undefined,
      user_attendance: attendanceRecord?.user_attendance || undefined,
      final_attendance: attendanceRecord?.final_attendance || undefined,
      year,
      month,
      day,
    };

    setEditData(editData);
    setShowEditModal(true);

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
      setEditData(null); // Clear edit data when closing
    }, 300);
  };

  const modalAnimStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ] as any,
    };
  });

  const insets = useSafeAreaInsets();

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View
        style={[
          styles.blurContainer,
          {
            backgroundColor: colors.background + "c0",
          },
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
          <View style={styles.hoursRow}>
            {[1, 2, 3].map((hour) => {
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
                  disabled={true}
                  onPress={() => {
                    handleOpenEditModal(hour);
                  }}
                >
                  <Text style={[styles.hourText, { color: statusColor }]}>
                    Hour {hour}
                  </Text>
                  {/* Show indicator for data source */}
                  {status && (
                    <View style={styles.sourceIndicator}>
                      {entry?.is_entered_by_professor === 1 && (
                        <Ionicons
                          name="school"
                          size={12}
                          color={colors.primary}
                        />
                      )}
                      {entry?.is_entered_by_student === 1 && (
                        <Ionicons
                          name="person"
                          size={12}
                          color={colors.secondary}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.hoursRow}>
            {[4, 5, 6].map((hour) => {
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
                  disabled={true}
                  activeOpacity={0.8}
                  onPress={() => {
                    handleOpenEditModal(hour);
                  }}
                >
                  <Text style={[styles.hourText, { color: statusColor }]}>
                    Hour {hour}
                  </Text>
                  {/* Show indicator for data source */}
                  {status && (
                    <View style={styles.sourceIndicator}>
                      {entry?.is_entered_by_professor === 1 && (
                        <Ionicons
                          name="school"
                          size={12}
                          color={colors.primary}
                        />
                      )}
                      {entry?.is_entered_by_student === 1 && (
                        <Ionicons
                          name="person"
                          size={12}
                          color={colors.secondary}
                        />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      <Animated.View style={[styles.editModalContainer, modalAnimStyle]}>
        <AttendanceEditModal
          close={handleCloseEditModal}
          data={editData}
          colors={colors}
          isVisible={showEditModal}
          subjectId={subjectId}
          subjectName={subjectName}
          onUpdate={onUpdate}
        />
      </Animated.View>
    </Animated.View>
  );
};

export default AttendanceDayView;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width: width,
    height: height,
    ...StyleSheet.absoluteFillObject,
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
    zIndex: 1,
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
    marginTop: 16,
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
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    // Additional styles for accept button
  },
  keepButton: {
    // Additional styles for keep button
  },
  presentButton: {
    // Additional styles for present button
  },
  absentButton: {
    // Additional styles for absent button
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
