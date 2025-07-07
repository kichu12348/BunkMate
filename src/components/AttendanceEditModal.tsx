import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import {
  userAttendanceService,
  AttendanceOverride,
} from "../db/userAttendanceService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";

interface AttendanceEditModalProps {
  visible: boolean;
  onClose: () => void;
  subjectId: string;
  subjectName: string;
  year: number;
  month: number;
  day: number;
  onUpdate?: () => void;
}

interface HourAttendance {
  hour: number;
  data: AttendanceOverride | null;
}

const { width, height } = Dimensions.get("window");

export const AttendanceEditModal: React.FC<AttendanceEditModalProps> = ({
  visible,
  onClose,
  subjectId,
  subjectName,
  year,
  month,
  day,
  onUpdate,
}) => {
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [hourAttendances, setHourAttendances] = useState<HourAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.8);
  const modalTranslateY = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      loadDayAttendance();
      // Animate in with better timing
      backdropOpacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
      modalScale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
        mass: 0.8,
      });
      modalTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
        mass: 0.8,
      });
    } else {
      // Animate out with faster timing
      backdropOpacity.value = withTiming(0, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      modalScale.value = withTiming(0.8, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      modalTranslateY.value = withTiming(height, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [visible]);

  // Gesture for swipe to dismiss with improved sensitivity
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        modalTranslateY.value = event.translationY;
        // More responsive backdrop fade
        const progress = Math.min(event.translationY / 200, 1);
        backdropOpacity.value = Math.max(0, 1 - progress);
      }
    })
    .onEnd((event) => {
      const shouldDismiss = event.translationY > 100 || event.velocityY > 800;

      if (shouldDismiss) {
        // Dismiss modal with animation
        modalTranslateY.value = withTiming(height, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        });
        backdropOpacity.value = withTiming(
          0,
          {
            duration: 200,
            easing: Easing.in(Easing.cubic),
          },
          () => {
            runOnJS(onClose)();
          }
        );
      } else {
        // Snap back with spring animation
        modalTranslateY.value = withSpring(0, {
          damping: 15,
          stiffness: 300,
        });
        backdropOpacity.value = withTiming(1, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
    modalScale.value = withTiming(0.8, {
      duration: 250,
      easing: Easing.in(Easing.cubic),
    });
    modalTranslateY.value = withTiming(
      height,
      {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      },
      () => {
        runOnJS(onClose)();
      }
    );
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [
        { scale: modalScale.value },
        { translateY: modalTranslateY.value },
      ] as any,
    };
  });

  useEffect(() => {
    if (visible) {
      loadDayAttendance();
    }
  }, [visible, subjectId, year, month, day]);

  const loadDayAttendance = () => {
    // Load attendance for hours 1-8 (typical class hours)
    const hours: HourAttendance[] = [];
    for (let hour = 1; hour <= 8; hour++) {
      const data = userAttendanceService.getAttendance(
        subjectId,
        year,
        month,
        day,
        hour
      );
      hours.push({ hour, data });
    }
    setHourAttendances(hours);
  };

  const handleAttendanceChange = async (
    hour: number,
    attendance: "P" | "A"
  ) => {
    try {
      setIsLoading(true);
      await userAttendanceService.setUserAttendance(
        subjectId,
        year,
        month,
        day,
        hour,
        attendance
      );
      loadDayAttendance(); // Reload to show updated data
      onUpdate?.();
    } catch (error) {
      Alert.alert("Error", "Failed to update attendance");
      console.error("Error updating attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOverride = async (hour: number) => {
    try {
      setIsLoading(true);
      await userAttendanceService.deleteUserOverride(
        subjectId,
        year,
        month,
        day,
        hour
      );
      loadDayAttendance();
      onUpdate?.();
    } catch (error) {
      Alert.alert("Error", "Failed to delete override");
      console.error("Error deleting override:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveConflict = async (
    hour: number,
    resolution: "accept_teacher" | "keep_user"
  ) => {
    try {
      setIsLoading(true);
      await userAttendanceService.resolveConflict(
        subjectId,
        year,
        month,
        day,
        hour,
        resolution
      );
      loadDayAttendance();
      onUpdate?.();
    } catch (error) {
      Alert.alert("Error", "Failed to resolve conflict");
      console.error("Error resolving conflict:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showConflictDialog = (
    hour: number,
    teacherAttendance: string,
    userAttendance: string
  ) => {
    const teacherStatus = teacherAttendance === "P" ? "Present" : "Absent";
    const userStatus = userAttendance === "P" ? "Present" : "Absent";
    const message = `Teacher marked: ${teacherStatus}\nYou marked: ${userStatus}\n\nHow would you like to resolve this?`;

    Alert.alert(
      "Attendance Conflict",
      message,
      [
        {
          text: "Accept Teacher",
          onPress: () => handleResolveConflict(hour, "accept_teacher"),
        },
        {
          text: "Keep My Record",
          onPress: () => handleResolveConflict(hour, "keep_user"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const renderHourRow = (hourAttendance: HourAttendance) => {
    const { hour, data } = hourAttendance;
    const hasConflict = data?.is_conflict;
    const hasUserOverride = data?.is_user_override;
    const finalAttendance = data?.final_attendance;
    const teacherAttendance = data?.teacher_attendance;
    const userAttendance = data?.user_attendance;

    return (
      <View key={hour} style={styles.hourRow}>
        <View style={styles.hourInfo}>
          <Text style={styles.hourText}>Hour {hour}</Text>
          {hasConflict && (
            <View style={styles.conflictBadge}>
              <Ionicons name="warning" size={12} color={colors.surface} />
              <Text style={styles.conflictText}>Conflict</Text>
            </View>
          )}
          {hasUserOverride && !hasConflict && (
            <View style={styles.overrideBadge}>
              <Ionicons name="person" size={12} color={colors.surface} />
              <Text style={styles.overrideText}>Your Record</Text>
            </View>
          )}
        </View>

        <View style={styles.attendanceControls}>
          {/* Present Button */}
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.presentButton,
              finalAttendance === "P" && styles.selectedButton,
            ]}
            onPress={() => handleAttendanceChange(hour, "P")}
            disabled={isLoading}
          >
            <Ionicons
              name="checkmark"
              size={16}
              color={finalAttendance === "P" ? colors.surface : colors.success}
            />
            <Text
              style={[
                styles.attendanceButtonText,
                finalAttendance === "P" && styles.selectedButtonText,
                {
                  color:
                    finalAttendance === "P" ? colors.surface : colors.success,
                },
              ]}
            >
              Present
            </Text>
          </TouchableOpacity>

          {/* Absent Button */}
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              styles.absentButton,
              finalAttendance === "A" && styles.selectedButton,
            ]}
            onPress={() => handleAttendanceChange(hour, "A")}
            disabled={isLoading}
          >
            <Ionicons
              name="close"
              size={16}
              color={finalAttendance === "A" ? colors.surface : colors.error}
            />
            <Text
              style={[
                styles.attendanceButtonText,
                finalAttendance === "A" && styles.selectedButtonText,
                {
                  color:
                    finalAttendance === "A" ? colors.surface : colors.error,
                },
              ]}
            >
              Absent
            </Text>
          </TouchableOpacity>

          {/* Action Button */}
          {hasConflict ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                showConflictDialog(hour, teacherAttendance!, userAttendance!)
              }
            >
              <Ionicons name="warning" size={16} color={colors.warning} />
            </TouchableOpacity>
          ) : hasUserOverride ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteOverride(hour)}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButton} />
          )}
        </View>

        {/* Conflict Details */}
        {hasConflict && (
          <View style={styles.conflictDetails}>
            <Text style={styles.conflictDetailsText}>
              {`Teacher: ${
                teacherAttendance === "P" ? "Present" : "Absent"
              } • Your Record: ${
                userAttendance === "P" ? "Present" : "Absent"
              }`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const formatDate = () => {
    const date = new Date(year, month - 1, day);
    return (
      date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) || "Invalid Date"
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>

      {/* Animated Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <BlurView
            style={StyleSheet.absoluteFill}
            tint={isDark ? "dark" : "light"}
            intensity={10}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Modal Content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.modalContainer, modalStyle]}>
          <View style={styles.dragHandle} />

          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Edit Attendance</Text>
                <Text style={styles.headerSubtitle}>{subjectName}</Text>
                <Text style={styles.headerDate}>{formatDate()}</Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <View style={styles.instructionRow}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.instructionText}>
                  Tap Present or Absent to override attendance for each hour
                </Text>
              </View>
              <View style={styles.instructionRow}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <Text style={styles.instructionText}>
                  Conflicts occur when your record differs from teacher's record
                </Text>
              </View>
            </View>

            {/* Hours List */}
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.hoursContainer}>
                {hourAttendances.map(renderHourRow)}
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    backdropTouchable: {
      flex: 1,
    },
    modalContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: height * 0.9,
      minHeight: height * 0.6,
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginTop: 8,
      marginBottom: 8,
      borderRadius: 2,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: 8,
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    instructionsContainer: {
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    instructionRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      gap: 8,
    },
    instructionText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    hoursContainer: {
      padding: 20,
    },
    hourRow: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    hourInfo: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      gap: 8,
    },
    hourText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    conflictBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.warning,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    conflictText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.surface,
    },
    overrideBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    overrideText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.surface,
    },
    attendanceControls: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    attendanceButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      gap: 6,
    },
    presentButton: {
      borderColor: colors.success,
      backgroundColor: colors.success + "20",
    },
    absentButton: {
      borderColor: colors.error,
      backgroundColor: colors.error + "20",
    },
    selectedButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    attendanceButtonText: {
      fontSize: 14,
      fontWeight: "600",
    },
    selectedButtonText: {
      color: colors.surface,
    },
    actionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.border,
    },
    conflictDetails: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.warning + "20",
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    conflictDetailsText: {
      fontSize: 12,
      color: colors.text,
      textAlign: "center",
    },
  });
