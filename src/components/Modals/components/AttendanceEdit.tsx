import { ThemeColors } from "../../../types/theme";
import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import { useAttendanceStore } from "../../../state/attendance";

import type { EditModalDataProps } from "../../utils/types";

const { width, height } = Dimensions.get("window");

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
  const [isConflictModalVisible, setIsConflictModalVisible] = useState(false);
  const timeOutRef = React.useRef<NodeJS.Timeout | null>(null);

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
      const conflictExists = await checkForConflicts({
        hour: data.hour,
        day: data.day,
        month: data.month,
        year: data.year,
      });
      if (conflictExists) {
        setIsLoading(false);
        if (timeOutRef.current) {
          clearTimeout(timeOutRef.current);
        }
        setIsConflictModalVisible(true);
        timeOutRef.current = setTimeout(() => {
          setIsConflictModalVisible(false);
        }, 5000);
        return;
      }
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
        await resolveConflict(
          {
            subject_id: subjectId,
            year: data.year,
            month: data.month,
            day: data.day,
            hour: data.hour,
          },
          resolution
        );
        onStatusUpdate?.();
        close();
        closeThis?.();
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
      <Modal
        transparent
        visible={isConflictModalVisible}
        statusBarTranslucent
        onRequestClose={() => {
          setIsConflictModalVisible(false);
          if (timeOutRef.current) clearTimeout(timeOutRef.current);
        }}
        animationType="fade"
        hardwareAccelerated
      >
        <View
          style={[
            styles.conflictModalContainer,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              backgroundColor: colors.background + "dd",
            },
          ]}
        >
          <View
            style={[
              styles.conflictModalContent,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <View style={styles.conflictModalHeader}>
              <Ionicons name="warning" size={32} color={colors.warning} />
              <Text style={[styles.conflictModalTitle, { color: colors.text }]}>
                Conflict Detected
              </Text>
              <Text
                style={[
                  styles.conflictModalSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Another record exists for this time slot
              </Text>
            </View>

            <View style={styles.conflictModalBody}>
              <View style={styles.conflictModalActions}>
                <TouchableOpacity
                  style={[
                    styles.conflictModalButton,
                    { borderColor: colors.warning },
                  ]}
                  onPress={() => {
                    setIsConflictModalVisible(false);
                    if (timeOutRef.current) clearTimeout(timeOutRef.current);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.conflictModalButtonText,
                      {
                        color: colors.warning,
                      },
                    ]}
                  >
                    Got it
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceEditModal;

const styles = StyleSheet.create({
  conflictModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  conflictModalContent: {
    width: "100%",
    maxWidth: 350,
    borderRadius: 20,
    overflow: "hidden",
  },
  conflictModalHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  conflictModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  conflictModalSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    opacity: 0.8,
  },
  conflictModalBody: {
    padding: 20,
    paddingTop: 16,
  },
  conflictModalActions: {
    alignItems: "center",
  },
  conflictModalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
    borderWidth: 1,
  },
  conflictModalButtonText: {
    fontSize: 16,
    fontWeight: "600",
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
});
