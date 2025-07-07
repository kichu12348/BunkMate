import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { JSX, useState } from "react";
import Animated from "react-native-reanimated";
import { useTheme } from "../hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { AttendanceEditModal } from "./AttendanceEditModal";

const { width, height } = Dimensions.get("window");

interface AttendanceDay {
  date: string;
  status: "present" | "absent" | "none";
  sessions: number;
}

interface AttendanceEntry {
  attendance: string;
  hour: number;
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

const AttendanceDayView = ({
  data,
  isVisible,
  onClose,
  animatedStyle,
  subjectId,
  subjectName,
  onUpdate,
}: AttendanceDayViewProps): JSX.Element => {
  const { colors } = useTheme();
  const [showEditModal, setShowEditModal] = useState(false);

  const hourlyStatus = React.useMemo(() => {
    const status = new Map<number, string>();
    data?.entries?.forEach((entry) => {
      status.set(entry.hour, entry.attendance.toLowerCase());
    });
    return status;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "checkmark-circle";
      case "absent":
        return "close-circle";
      default:
        return "help-circle-outline";
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView
        intensity={80}
        style={[
          styles.blurContainer,
          { backgroundColor: `${colors.background}20` },
        ]}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        blurReductionFactor={4}
      />
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}
      >
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
          {/* {subjectId && subjectName && (
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create-outline" size={16} color={colors.surface} />
              <Text style={[styles.editButtonText, { color: colors.surface }]}>
                Edit Attendance
              </Text>
            </TouchableOpacity>
          )} */}
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
                Array.from(hourlyStatus.values()).filter(
                  (s) => s === "present"
                ).length
              }
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.error + "15" },
            ]}
          >
            <Ionicons name="close-circle" size={20} color={colors.error} />
            <Text style={[styles.statLabel, { color: colors.error }]}>
              Absent
            </Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {
                Array.from(hourlyStatus.values()).filter(
                  (s) => s === "absent"
                ).length
              }
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => i + 1).map((hour) => {
            const status = hourlyStatus.get(hour);
            const isPresent = status === "present";
            const isAbsent = status === "absent";
            const cellStyle = [
              styles.hourCell,
              {
                backgroundColor: isPresent
                  ? colors.success + "10"
                  : isAbsent
                  ? colors.error + "10"
                  : colors.border + "05",
                borderColor: isPresent
                  ? colors.success
                  : isAbsent
                  ? colors.error
                  : colors.border,
                shadowColor: isPresent
                  ? colors.success
                  : isAbsent
                  ? colors.error
                  : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: isPresent || isAbsent ? 2 : 0,
              },
            ];
            return (
              <View key={hour} style={cellStyle}>
                <View style={styles.hourHeader}>
                  <Text style={[styles.hourText, { color: colors.text }]}>
                    Hour {hour}
                  </Text>
                  <Ionicons
                    name={getStatusIcon(status || "")}
                    size={18}
                    color={
                      isPresent
                        ? colors.success
                        : isAbsent
                        ? colors.error
                        : colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isPresent
                        ? colors.success
                        : isAbsent
                        ? colors.error
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {status
                    ? status.charAt(0).toUpperCase() + status.slice(1)
                    : "Not Available"}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Edit Modal */}
      {subjectId && subjectName && data?.day?.date && (
        <AttendanceEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          subjectId={subjectId}
          subjectName={subjectName}
          year={new Date(data.day.date).getFullYear()}
          month={new Date(data.day.date).getMonth() + 1}
          day={new Date(data.day.date).getDate()}
          onUpdate={() => {
            onUpdate?.();
            setShowEditModal(false);
          }}
        />
      )}
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
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  hourCell: {
    width: "48%",
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  hourHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  hourText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.9,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    position: "absolute",
    top: 0,
    left: 0,
  },
});
