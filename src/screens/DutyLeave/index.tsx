import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import * as ImagePicker from "expo-image-picker";

import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { useAttendanceStore } from "../../state/attendance";
import { useDutyLeaveStore } from "../../state/dutyLeave";
import { DutyLeaveDatabase } from "../../utils/dutyLeaveDatabase";
import { ThemeColors } from "../../types/theme";
import { DutyLeave } from "../../types/dutyLeave";
import {
  formatPercentage,
  calculateEnhancedAttendanceStats,
  normalizeAttendance,
} from "../../utils/helpers";
import Text from "../../components/UI/Text";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const CELL_SIZE = Math.floor((width * 0.9 - 40) / 7);

const AttendanceImpactCard: React.FC<{
  impacts: {
    subjectName: string;
    currentPercentage: number;
    projectedPercentage: number;
    matchingAbsentCount: number;
  }[];
}> = ({ impacts }) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const validImpacts = impacts.filter(
    (impact) =>
      impact.projectedPercentage - impact.currentPercentage > 0 ||
      impact.matchingAbsentCount > 0,
  );

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={styles.impactCard}
      exiting={FadeOutUp.duration(300)}
    >
      <View style={styles.impactHeader}>
        <Ionicons name="trending-up" size={16} color={colors.primary} />
        <Text style={styles.impactTitle}>Expected Impact</Text>
      </View>
      <Animated.FlatList
        data={validImpacts}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.impactScrollContent}
        itemLayoutAnimation={LinearTransition}
        ListEmptyComponent={
          <Text style={styles.impactEmptyText}>
            No absent periods covered by duty leave yet.
          </Text>
        }
        renderItem={({ item: impact }) => (
          <View key={impact.subjectName} style={styles.impactChip}>
            <Text style={styles.impactChipSubject} numberOfLines={1}>
              {impact.subjectName}
            </Text>
            <View style={styles.impactChipStats}>
              <Text style={styles.impactChipOld}>
                {formatPercentage(impact.currentPercentage)}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={12}
                color={colors.textSecondary}
                style={{ marginHorizontal: 2 }}
              />
              <Text style={styles.impactChipNew}>
                {formatPercentage(impact.projectedPercentage)}
              </Text>
            </View>
          </View>
        )}
      />
    </Animated.View>
  );
};

const DutyLeaveCard: React.FC<{
  leave: DutyLeave;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DutyLeave>) => void;
  onEdit: (leave: DutyLeave) => void;
  hasCoverage?: boolean;
  topInset: number;
}> = ({ leave, onDelete, onUpdate, onEdit, hasCoverage = true, topInset }) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  const handleOpenDocument = async () => {
    if (!leave.documentUri) return;

    if (leave.documentType === "pdf") {
      Alert.alert(
        "Unsupported Attachment",
        "This app version supports duty leave image attachments only.",
      );
      return;
    }

    setImagePreviewVisible(true);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Duty Leave",
      `Remove duty leave for ${format(parseISO(leave.date), "dd MMM yyyy")}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(leave.id),
        },
      ],
    );
  };

  const cardContent = (
    <View style={styles.leaveCard}>
      <View style={styles.leaveCardTop}>
        <View style={styles.leaveCardHeaderLeft}>
          <View style={styles.leaveDateBadge}>
            <Text style={styles.leaveDay}>
              {format(parseISO(leave.date), "dd")}
            </Text>
            <Text style={styles.leaveMonth}>
              {format(parseISO(leave.date), "MMM")}
            </Text>
          </View>
          <View style={styles.leaveMainInfo}>
            <Text style={styles.leaveReason} numberOfLines={2}>
              {leave.reason}
            </Text>
            <Text style={styles.leaveDateFull}>
              {format(parseISO(leave.date), "EEEE, do MMMM yyyy")}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.leaveCardMiddle}>
        <View style={styles.leaveTags}>
          <View style={styles.tag}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.tagText}>
              {leave.hours === "full_day"
                ? "Full Day"
                : `Hours: ${[...leave.hours].sort().join(", ")}`}
            </Text>
          </View>

          {leave.documentUri && (
            <TouchableOpacity
              style={[styles.tag, styles.docTag]}
              onPress={handleOpenDocument}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: leave.documentUri }}
                style={styles.tagImage}
              />
              <Text style={[styles.tagText, { color: colors.primary }]}>
                Attachment
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {hasCoverage === false && (
          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={14} color={colors.warning} />
            <Text style={styles.warningText}>
              No absent periods covered by this leave.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.leaveCardBottom}>
        <TouchableOpacity
          onPress={() => onUpdate(leave.id, { approved: !leave.approved })}
          style={[
            styles.actionBtn,
            styles.approveBtn,
            leave.approved && styles.approveBtnActive,
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={leave.approved ? "checkmark-circle" : "ellipse-outline"}
            size={16}
            color={leave.approved ? colors.success : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionBtnText,
              { color: leave.approved ? colors.success : colors.textSecondary },
            ]}
          >
            {leave.approved ? "Approved" : "Approve"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onEdit(leave)}
          style={styles.actionBtn}
          activeOpacity={0.3}
        >
          <AntDesign name="edit" size={16} color={colors.textSecondary} />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          style={styles.actionBtn}
          activeOpacity={0.3}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      {cardContent}

      {/* Image Preview Modal */}
      <Modal
        visible={imagePreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.imagePreviewOverlay}>
          <View
            style={[
              styles.imagePreviewHeader,
              // {
              //   paddingTop: topInset + 16,
              // },
            ]}
          >
            <Text style={styles.imagePreviewTitle} numberOfLines={1}>
              {leave.documentName || "Image"}
            </Text>
            <TouchableOpacity
              onPress={() => setImagePreviewVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
          {leave.documentUri && (
            <Image
              source={{ uri: leave.documentUri }}
              style={styles.imagePreviewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const CalendarModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}> = ({ visible, onClose, onDateSelect, selectedDate }) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [displayMonth, setDisplayMonth] = useState(selectedDate || new Date());

  const calendarWeeks = useMemo(() => {
    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const weeks: (Date | null)[][] = [];
    let currentWeekStart = startOfWeek(monthStart);

    while (currentWeekStart <= monthEnd) {
      const weekEnd = endOfWeek(currentWeekStart);
      const days = eachDayOfInterval({
        start: currentWeekStart,
        end: weekEnd,
      });
      weeks.push(
        days.map((day) => (day >= monthStart && day <= monthEnd ? day : null)),
      );
      currentWeekStart = new Date(
        currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000,
      );
    }
    return weeks;
  }, [displayMonth]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      hardwareAccelerated
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.calendarModalContent]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => setDisplayMonth(subMonths(displayMonth, 1))}
            >
              <Ionicons name="chevron-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {format(displayMonth, "MMMM yyyy")}
            </Text>
            <TouchableOpacity
              onPress={() => setDisplayMonth(addMonths(displayMonth, 1))}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarGrid}>
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
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <View
                        key={`empty-${weekIndex}-${dayIndex}`}
                        style={styles.cell}
                      />
                    );
                  }
                  const isSelected =
                    selectedDate && isSameDay(selectedDate, day);
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
                      onPress={() => {
                        onDateSelect(day);
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isSelected && styles.selectedDayText,
                        ]}
                      >
                        {format(day, "d")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const AddDutyLeaveModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSave: (leave: Omit<DutyLeave, "id" | "createdAt">) => Promise<void>;
  editingLeave?: DutyLeave | null;
}> = ({ visible, onClose, onSave, editingLeave }) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reason, setReason] = useState("");
  const [documentUri, setDocumentUri] = useState<string | undefined>();
  const [documentName, setDocumentName] = useState<string | undefined>();
  const [documentType, setDocumentType] = useState<
    "image" | "pdf" | undefined
  >();
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullDay, setIsFullDay] = useState(true);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);

  useEffect(() => {
    if (editingLeave && visible) {
      setSelectedDate(parseISO(editingLeave.date));
      setReason(editingLeave.reason);
      setDocumentUri(editingLeave.documentUri);
      setDocumentName(editingLeave.documentName);
      setDocumentType(editingLeave.documentType);
      if (editingLeave.hours === "full_day") {
        setIsFullDay(true);
        setSelectedHours([]);
      } else {
        const normalizedHours = editingLeave.hours
          .map((hour) => Number(hour))
          .filter((hour) => Number.isFinite(hour) && hour > 0)
          .sort((a, b) => a - b);

        setIsFullDay(false);
        setSelectedHours([...new Set(normalizedHours)]);
      }
    }
  }, [editingLeave, visible]);

  const resetForm = () => {
    setSelectedDate(null);
    setReason("");
    setDocumentUri(undefined);
    setDocumentName(undefined);
    setDocumentType(undefined);
    setIsSaving(false);
    setIsFullDay(true);
    setSelectedHours([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.uri.split("/").pop();
        setDocumentUri(asset.uri);
        setDocumentName(fileName);
        setDocumentType("image");
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !reason.trim()) return;
    setIsSaving(true);

    try {
      let savedDocUri: string | undefined;

      if (editingLeave && documentUri === editingLeave.documentUri) {
        savedDocUri = editingLeave.documentUri;
      } else {
        if (editingLeave?.documentUri) {
          await DutyLeaveDatabase.deleteDocument(editingLeave.documentUri);
        }

        if (documentUri && documentName) {
          const uri = await DutyLeaveDatabase.saveDocument(
            documentUri,
            documentName,
          );
          if (uri) savedDocUri = uri;
        }
      }

      await onSave({
        date: format(selectedDate, "yyyy-MM-dd"),
        reason: reason.trim(),
        documentUri: savedDocUri,
        documentName,
        documentType,
        hours: isFullDay
          ? "full_day"
          : [...new Set(selectedHours)]
              .map((hour) => Number(hour))
              .filter((hour) => Number.isFinite(hour) && hour > 0)
              .sort((a, b) => a - b),
        approved: editingLeave ? editingLeave.approved : false,
      });
      handleClose();
    } catch (error) {
      console.error("Error saving:", error);
      setIsSaving(false);
    }
  };

  const canSave =
    selectedDate &&
    reason.trim().length > 0 &&
    !isSaving &&
    (isFullDay || selectedHours.length > 0);

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.addModalContent}>
              {/* Header */}
              <View style={styles.addModalHeader}>
                <Text style={styles.addModalTitle}>
                  {editingLeave ? "Edit Duty Leave" : "Add Duty Leave"}
                </Text>
                <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={28}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Date Picker */}
                <Text style={styles.fieldLabel}>Date *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setCalendarVisible(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.datePickerText,
                      !selectedDate && { color: colors.textSecondary },
                    ]}
                  >
                    {selectedDate
                      ? format(selectedDate, "EEEE, dd MMM yyyy")
                      : "Select a date"}
                  </Text>
                </TouchableOpacity>

                {/* Duration */}
                <Text style={styles.fieldLabel}>Duration *</Text>
                <View style={styles.durationTabsRow}>
                  <TouchableOpacity
                    style={[
                      styles.durationTab,
                      isFullDay && styles.durationTabActive,
                    ]}
                    onPress={() => setIsFullDay(true)}
                  >
                    <Text
                      style={[
                        styles.durationTabText,
                        isFullDay && styles.durationTabTextActive,
                      ]}
                    >
                      Full Day
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.durationTab,
                      !isFullDay && styles.durationTabActive,
                    ]}
                    onPress={() => setIsFullDay(false)}
                  >
                    <Text
                      style={[
                        styles.durationTabText,
                        !isFullDay && styles.durationTabTextActive,
                      ]}
                    >
                      Specific Hours
                    </Text>
                  </TouchableOpacity>
                </View>

                {!isFullDay && (
                  <View style={styles.hoursGrid}>
                    {[1, 2, 3, 4, 5, 6].map((hour) => {
                      const isSelected = selectedHours.includes(hour);
                      return (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.hourChip,
                            isSelected && styles.hourChipActive,
                          ]}
                          onPress={() => {
                            if (isSelected) {
                              setSelectedHours((prev) =>
                                prev.filter((h) => h !== hour),
                              );
                            } else {
                              setSelectedHours((prev) =>
                                [...prev, hour].sort(),
                              );
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.hourChipText,
                              isSelected && styles.hourChipTextActive,
                            ]}
                          >
                            Hour {hour}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Reason */}
                <Text style={styles.fieldLabel}>Reason *</Text>
                <TextInput
                  style={styles.reasonInput}
                  placeholder="e.g. NSS Camp, Workshop, Sports Event..."
                  placeholderTextColor={colors.textSecondary}
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* Image Upload */}
                <Text style={styles.fieldLabel}>
                  Image{" "}
                  <Text style={{ color: colors.textSecondary }}>
                    (optional)
                  </Text>
                </Text>

                {documentUri ? (
                  <View style={styles.documentPreview}>
                    <Image
                      source={{ uri: documentUri }}
                      style={styles.tagImage}
                    />
                    <Text style={styles.documentPreviewName} numberOfLines={1}>
                      {documentName}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setDocumentUri(undefined);
                        setDocumentName(undefined);
                        setDocumentType(undefined);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadButtonsRow}>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handlePickImage}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="images-outline"
                        size={22}
                        color={colors.primary}
                      />
                      <Text style={styles.uploadButtonText}>Choose Image</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !canSave && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.text}
                    />
                    <Text style={styles.saveButtonText}>
                      {editingLeave ? "Update Duty Leave" : "Save Duty Leave"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
        <CalendarModal
          visible={calendarVisible}
          onClose={() => setCalendarVisible(false)}
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </Modal>
    </>
  );
};

export const DutyLeaveScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [addModalVisible, setAddModalVisible] = useState(false);

  const {
    dutyLeaves,
    fetchDutyLeaves,
    addDutyLeave,
    deleteDutyLeave,
    updateDutyLeave,
  } = useDutyLeaveStore();

  const { data: attendanceData, courseSchedule } = useAttendanceStore();

  useEffect(() => {
    fetchDutyLeaves();
  }, []);

  const { subjectImpacts, leaveCoverageMap } = useMemo(() => {
    const map: Record<string, boolean> = {};
    const impacts: {
      subjectName: string;
      currentPercentage: number;
      projectedPercentage: number;
      matchingAbsentCount: number;
    }[] = [];

    if (!attendanceData || !courseSchedule) {
      return { subjectImpacts: impacts, leaveCoverageMap: map };
    }

    const dutyLeavesByDate = new Map<string, DutyLeave[]>();
    for (const leave of dutyLeaves) {
      const dateStr = leave.date;
      if (!dutyLeavesByDate.has(dateStr)) {
        dutyLeavesByDate.set(dateStr, []);
      }
      dutyLeavesByDate.get(dateStr)!.push(leave);
      map[leave.id] = false; // Initialize coverage map to false
    }

    for (const subject of attendanceData.subjects) {
      const records = courseSchedule.get(subject.subject.id.toString()) || [];
      const stats = calculateEnhancedAttendanceStats(subject, records);

      const totalClasses = stats.totalClasses;
      const attendedClasses = stats.attendedClasses;
      const currentPercentage =
        totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

      let matchingAbsentCount = 0;

      for (const entry of records) {
        const status = normalizeAttendance(
          entry.final_attendance ||
            entry.user_attendance ||
            entry.teacher_attendance,
        );

        if (status === "absent") {
          const dateStr = format(
            new Date(entry.year, entry.month - 1, entry.day),
            "yyyy-MM-dd",
          );

          const leavesForDate = dutyLeavesByDate.get(dateStr);
          if (leavesForDate) {
            const entryHour = Number(entry.hour);
            const coveringLeave = leavesForDate.find((leave) => {
              if (leave.hours === "full_day") {
                return true;
              }

              if (!Array.isArray(leave.hours) || !Number.isFinite(entryHour)) {
                return false;
              }

              return leave.hours.some((hour) => Number(hour) === entryHour);
            });

            if (coveringLeave) {
              matchingAbsentCount++;
              map[coveringLeave.id] = true;
            }
          }
        }
      }

      const projectedAttended = attendedClasses + matchingAbsentCount;
      const projectedPercentage =
        totalClasses > 0 ? (projectedAttended / totalClasses) * 100 : 0;

      impacts.push({
        subjectName: subject.subject.name,
        currentPercentage: Math.round(currentPercentage * 100) / 100,
        projectedPercentage: Math.round(projectedPercentage * 100) / 100,
        matchingAbsentCount,
      });
    }

    return { subjectImpacts: impacts, leaveCoverageMap: map };
  }, [attendanceData, courseSchedule, dutyLeaves]);

  const [editingLeave, setEditingLeave] = useState<DutyLeave | null>(null);

  const handleAddDutyLeave = async (
    data: Omit<DutyLeave, "id" | "createdAt">,
  ) => {
    if (editingLeave) {
      await updateDutyLeave(editingLeave.id, {
        ...data,
      });
      setEditingLeave(null);
    } else {
      const newLeave: DutyLeave = {
        ...data,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };
      await addDutyLeave(newLeave);
    }
  };

  const handleEditDutyLeave = (leave: DutyLeave) => {
    setEditingLeave(leave);
    setAddModalVisible(true);
  };

  const handleDeleteDutyLeave = async (id: string) => {
    await deleteDutyLeave(id);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={colors.textSecondary + "60"}
      />
      <Text style={styles.emptyTitle}>No Duty Leaves</Text>
      <Text style={styles.emptyMessage}>
        Tap the button below to log a duty leave.{"\n"}Duty leaves can be
        claimed with a valid signed document.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Duty Leave</Text>
      </View>

      {attendanceData && dutyLeaves.length > 0 && subjectImpacts.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <AttendanceImpactCard impacts={subjectImpacts} />
        </View>
      )}

      <Animated.FlatList
        data={dutyLeaves}
        renderItem={({ item }) => (
          <DutyLeaveCard
            leave={item}
            onDelete={handleDeleteDutyLeave}
            onUpdate={updateDutyLeave}
            onEdit={handleEditDutyLeave}
            hasCoverage={leaveCoverageMap[item.id] !== false}
            topInset={insets.top}
          />
        )}
        keyExtractor={(item) => item.id}
        extraData={leaveCoverageMap}
        itemLayoutAnimation={LinearTransition}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 100,
          flexGrow: 1,
        }}
        ListHeaderComponent={
          dutyLeaves.length > 0 ? (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>
                Your Duty Leaves ({dutyLeaves.length})
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.primary} />
      </TouchableOpacity>

      {/* Add Modal */}
      <AddDutyLeaveModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          setEditingLeave(null);
        }}
        onSave={handleAddDutyLeave}
        editingLeave={editingLeave}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },

    impactCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginVertical: 8,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.border + "40",
    },
    impactHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    impactTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    impactScrollContent: {
      paddingHorizontal: 16,
      gap: 10,
    },
    impactChip: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border + "40",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minWidth: 110,
    },
    impactChipSubject: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 6,
      maxWidth: 140,
    },
    impactChipStats: {
      flexDirection: "row",
      alignItems: "center",
    },
    impactChipOld: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    impactChipNew: {
      fontSize: 12,
      color: colors.success,
      fontWeight: "700",
    },
    impactEmptyText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
      paddingHorizontal: 16,
      marginTop: 2,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
      marginBottom: 12,
    },
    sectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },

    leaveCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border + "40",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    leaveCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    leaveCardHeaderLeft: {
      flexDirection: "row",
      flex: 1,
      gap: 12,
      marginRight: 8,
    },
    leaveDateBadge: {
      width: 46,
      height: 46,
      borderRadius: 12,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    leaveDay: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.primary,
      lineHeight: 20,
    },
    leaveMonth: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.primary,
      textTransform: "uppercase",
    },
    leaveMainInfo: {
      flex: 1,
      justifyContent: "center",
    },
    leaveReason: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
      lineHeight: 22,
    },
    leaveDateFull: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
    },
    statusApproved: {
      borderColor: colors.success,
    },
    statusPending: {
      borderColor: colors.warning,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    leaveCardMiddle: {
      gap: 8,
      marginBottom: 12,
    },
    leaveTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    tag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.border + "50",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    docTag: {
      backgroundColor: colors.primary + "10",
    },
    tagText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    tagImage: {
      width: 20,
      height: 20,
      borderRadius: 5,
    },
    warningBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.warning + "15",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 4,
    },
    warningText: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: "500",
      flex: 1,
    },
    leaveCardBottom: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border + "50",
      gap: 16,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 4,
    },
    approveBtn: {
      marginRight: "auto",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      backgroundColor: colors.surface,
    },
    approveBtnActive: {
      borderColor: colors.success,
      borderStyle: "solid",
    },
    actionBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingTop: 60,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptyMessage: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 20,
    },

    fab: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      borderColor: colors.primary,
      backgroundColor: colors.background + "aa",
      borderWidth: 1.5,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },

    addModalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 30,
      maxHeight: "85%",
    },
    addModalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    addModalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      marginTop: 12,
    },
    datePickerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary,
      backgroundColor: colors.primary + "08",
    },
    datePickerText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.primary,
    },
    reasonInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 80,
    },
    uploadButtonsRow: {
      flexDirection: "row",
      gap: 10,
    },
    uploadButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary + "60",
      backgroundColor: colors.primary + "08",
    },
    uploadButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },
    documentPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.primary + "10",
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    documentPreviewName: {
      flex: 1,
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      padding: 16,
      marginTop: 20,
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },

    durationTabsRow: {
      flexDirection: "row",
      backgroundColor: colors.border,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    durationTab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
    },
    durationTabActive: {
      backgroundColor: colors.surface,
    },
    durationTabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    durationTabTextActive: {
      color: colors.primary,
    },
    hoursGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    hourChip: {
      flex: 1,
      minWidth: "30%",
      backgroundColor: colors.border,
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "transparent",
    },
    hourChipActive: {
      backgroundColor: colors.primary + "10",
      borderColor: colors.primary,
    },
    hourChipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    hourChipTextActive: {
      color: colors.primary,
    },

    calendarModalContent: {
      width: "90%",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      alignSelf: "center",
      position: "absolute",
      top: "25%",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    calendarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    calendarTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    calendarGrid: {
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
      overflow: "hidden",
    },
    monthDay: {
      backgroundColor: colors.border,
    },
    todayMarker: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    selectedDay: {
      backgroundColor: colors.primary,
    },
    dayNumber: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.text,
    },
    selectedDayText: {
      color: colors.text,
      fontWeight: "700",
    },

    imagePreviewOverlay: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    imagePreviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    imagePreviewTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      flex: 1,
      marginRight: 16,
    },
    imagePreviewImage: {
      width: "100%",
      height: "80%",
    },
  });
