import { StyleSheet } from "react-native";
import { ThemeColors } from "../../types/theme";

export const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    backButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.4,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    // Sections
    section: {
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 12,
      overflow: "hidden",
    },
    cardContent: {
      padding: 16,
      gap: 12,
    },

    // Form
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      minHeight: 48,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 12,
    },

    // Errors
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.danger + "12",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: colors.danger,
      lineHeight: 18,
    },

    // Buttons
    primaryButton: {
      borderColor: colors.primary,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    primaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
      letterSpacing: 0.5,
    },

    // Privacy note
    noteBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 20,
      paddingVertical: 8,
    },
    noteText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },

    // Semester chips
    semRow: {
      paddingHorizontal: 20,
      gap: 8,
      marginBottom: 12,
    },
    semChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    semChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      borderWidth: 0,
    },
    semChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    semChipTextActive: {
      color: colors.text,
    },

    // SGPA
    sgpaCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 20,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    sgpaLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    sgpaValue: {
      fontSize: 22,
      fontWeight: "600",
      color: colors.primary,
    },

    // Cache badge
    cacheBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colors.border + "40",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    cacheBadgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    // Course items
    courseItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 12,
    },
    courseLeft: {
      flex: 1,
      gap: 3,
    },
    courseName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 19,
    },
    courseSub: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    gradeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 40,
    },
    gradeText: {
      fontSize: 14,
      fontWeight: "700",
    },
    itemSeparator: {
      height: 1,
      backgroundColor: colors.border + "20",
      marginLeft: 16,
    },
  });
