import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../../hooks/useTheme";
import { ThemeColors } from "../../../types/theme";
import Text from "../../../components/UI/Text";
import { AttendanceCard } from "../../../components/AttendanceCard";

type DisplayFilter = "all" | "danger" | "warning" | "safe";

interface SubjectsListProps {
  activeDisplayFilter: DisplayFilter;
  dangerSubjects: any[];
  warningSubjects: any[];
  safeSubjects: any[];
  handleSubjectPress: (
    subject: any,
    canMiss: number,
    classesToAttend: number,
  ) => void;
}

export const SubjectsList: React.FC<SubjectsListProps> = ({
  activeDisplayFilter,
  dangerSubjects,
  warningSubjects,
  safeSubjects,
  handleSubjectPress,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.subjectsContainer}>
      {(activeDisplayFilter === "all" || activeDisplayFilter === "danger") &&
        dangerSubjects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={styles.dangerColor.color}
              />
              <Text style={[styles.sectionTitle, styles.dangerText]}>
                Critical Attention Required
              </Text>
            </View>
            {dangerSubjects.map((subject, index) => (
              <AttendanceCard
                key={`danger-${index}`}
                subject={subject}
                onPress={(canMiss, classesToAttend) =>
                  handleSubjectPress(subject, canMiss, classesToAttend)
                }
              />
            ))}
          </View>
        )}

      {(activeDisplayFilter === "all" || activeDisplayFilter === "warning") &&
        warningSubjects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="warning"
                size={18}
                color={styles.warningColor.color}
              />
              <Text style={[styles.sectionTitle, styles.warningText]}>
                Needs Attention
              </Text>
            </View>
            {warningSubjects.map((subject, index) => (
              <AttendanceCard
                key={`warning-${index}`}
                subject={subject}
                onPress={(canMiss, classesToAttend) =>
                  handleSubjectPress(subject, canMiss, classesToAttend)
                }
              />
            ))}
          </View>
        )}

      {(activeDisplayFilter === "all" || activeDisplayFilter === "safe") &&
        safeSubjects.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="checkmark-circle"
                size={18}
                color={styles.safeColor.color}
              />
              <Text style={[styles.sectionTitle, styles.safeText]}>
                Good Standing
              </Text>
            </View>
            {safeSubjects.map((subject, index) => (
              <AttendanceCard
                key={`safe-${index}`}
                subject={subject}
                onPress={(canMiss, classesToAttend) =>
                  handleSubjectPress(subject, canMiss, classesToAttend)
                }
              />
            ))}
          </View>
        )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    subjectsContainer: {
      paddingBottom: 20,
      paddingHorizontal: 16,
    },
    sectionContainer: {
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    dangerText: { color: colors.danger },
    warningText: { color: colors.warning },
    safeText: { color: colors.success },
    safeColor: { color: colors.success },
    warningColor: { color: colors.warning },
    dangerColor: { color: colors.danger },
  });
