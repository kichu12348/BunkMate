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
    logoutButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.danger + "10",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    // Sections
    section: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },

    // Card
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border + "40",
    },
    cardContent: {
      padding: 20,
      gap: 16,
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
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    primaryButtonDisabled: {
      backgroundColor: colors.border,
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    // Privacy note
    noteBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginHorizontal: 24,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginTop: 16,
    },
    noteText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Semester chips
    semRow: {
      paddingHorizontal: 20,
      paddingBottom: 4,
      gap: 10,
    },
    semChip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    semChipActive: {
      backgroundColor: colors.primary + "15",
      borderColor: colors.primary,
    },
    semChipText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    semChipTextActive: {
      color: colors.primary,
    },

    // SGPA
    sgpaCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 24,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border + "40",
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
