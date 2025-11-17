import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AssignmentData } from "../types/assignments";
import { useThemedStyles } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { useThemeStore } from "../state/themeStore";
import { formatDistanceToNow, parseISO } from "date-fns";
import Text from "./UI/Text";

interface AssignmentCardProps {
  assignment: AssignmentData;
  onPress: (id: string, name: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  const postedRelative = formatDistanceToNow(parseISO(assignment.created_at), {
    addSuffix: true,
  });

  const getActivityIcon = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case "assignment":
        return "document-text";
      case "quiz":
        return "help-circle";
      case "exam":
        return "school";
      case "project":
        return "folder";
      default:
        return "clipboard";
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType.toLowerCase()) {
      case "assignment":
        return colors.primary;
      case "quiz":
        return colors.accent;
      case "exam":
        return colors.error;
      case "project":
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const activityColor = getActivityColor(assignment.activity_type);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        onPress(assignment.assignmentId, assignment.assignmentName)
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: activityColor + "20" },
            ]}
          >
            <Ionicons
              name={getActivityIcon(assignment.activity_type)}
              size={16}
              color={activityColor}
            />
          </View>
          <Text style={styles.assignmentName} numberOfLines={2}>
            {assignment.assignmentName}
          </Text>
        </View>
        <View
          style={[styles.typeBadge, { backgroundColor: activityColor + "20" }]}
        >
          <Text style={[styles.typeText, { color: activityColor }]}>
            {assignment.activity_type}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Ionicons
            name="time-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.dateText}>Posted {postedRelative}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginVertical: 6,
      marginHorizontal: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    titleRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginRight: 8,
    },
    typeIndicator: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    assignmentName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      lineHeight: 22,
    },
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    typeText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dateText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });
