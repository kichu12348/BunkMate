import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { Semester } from "../../types/gradeCard";
import Text from "../../components/UI/Text";
import useAccountStore from "../../state/accounts";
import useKtuGradeStore from "../../state/ktuGrades";

type KtuGradeCardNavProp = NativeStackNavigationProp<RootStackParamList>;

const SEMESTERS: { label: string; value: Semester }[] = [
  { label: "S1", value: "1" },
  { label: "S2", value: "2" },
  { label: "S3", value: "3" },
  { label: "S4", value: "4" },
  { label: "S5", value: "5" },
  { label: "S6", value: "6" },
  { label: "S7", value: "7" },
  { label: "S8", value: "8" },
];

const GRADE_COLORS: Record<string, string> = {
  S: "#22c55e",
  "A+": "#4ade80",
  A: "#86efac",
  "B+": "#facc15",
  B: "#fb923c",
  C: "#f87171",
  P: "#60a5fa",
  F: "#ef4444",
  FE: "#ef4444",
  AB: "#9ca3af",
};

function gradeColor(grade: string, fallback: string): string {
  return GRADE_COLORS[grade?.toUpperCase()] ?? fallback;
}

export function KtuGradeCardScreen({
  navigation,
}: {
  navigation: KtuGradeCardNavProp;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const currentAccountId = useAccountStore((s) => s.currentAccountId);

  const {
    username,
    password,
    credentialsLoaded,
    hasSavedCredentials,
    isLoggingIn,
    loginError,
    selectedSemester,
    gradeCard,
    isFetching,
    fetchError,
    fromCache,
    setUsername,
    setPassword,
    setSelectedSemester,
    loadCachedCredentials,
    manualLogin,
    fetchGrades,
    refreshGrades,
    disconnectKtu,
    isOld,
  } = useKtuGradeStore();

  const [showPassword, setShowPassword] = useState(false);

  // Load cached credentials on mount
  useEffect(() => {
    if (currentAccountId) {
      loadCachedCredentials(currentAccountId);
    } else {
      // No account — nothing to load, just proceed to login form
      useKtuGradeStore.setState({ credentialsLoaded: true });
    }
  }, [currentAccountId]);

  // ── Loading state ─────────────────────────────────────────────
  if (!credentialsLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>KTU Results</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={"large"} color={colors.primary} />
        </View>
      </View>
    );
  }

  // ── LOGIN FORM (only when no saved credentials) ───────────────
  if (!hasSavedCredentials) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={styles.backButton}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>KTU Results</Text>
            </View>

            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: insets.bottom + 32,
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Form card */}
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="account-box-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.sectionTitle}>Login to KTU</Text>
                  </View>

                  <View style={styles.card}>
                    <View style={styles.cardContent}>
                      <Text style={styles.fieldLabel}>Username</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="Your KTU username"
                          placeholderTextColor={colors.textSecondary}
                          value={username}
                          onChangeText={setUsername}
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                      </View>

                      <Text style={styles.fieldLabel}>Password</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Your KTU password"
                          placeholderTextColor={colors.textSecondary}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword((v) => !v)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name={
                              showPassword ? "eye-off-outline" : "eye-outline"
                            }
                            size={20}
                            color={colors.textSecondary}
                          />
                        </TouchableOpacity>
                      </View>

                      {loginError && (
                        <View style={styles.errorBox}>
                          <Ionicons
                            name="alert-circle"
                            size={16}
                            color={colors.danger}
                          />
                          <Text style={styles.errorText}>{loginError}</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.primaryButton,
                          (isLoggingIn || !username || !password) &&
                            styles.primaryButtonDisabled,
                        ]}
                        onPress={manualLogin}
                        disabled={isLoggingIn || !username || !password}
                        activeOpacity={0.8}
                      >
                        {isLoggingIn ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                          />
                        ) : (
                          <View style={styles.primaryButtonContent}>
                            <Text style={styles.primaryButtonText}>Login</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Privacy note */}
                <View style={styles.noteBox}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.noteText}>
                    Your credentials are cached locally on your device to
                    auto-fill next time. They are never sent anywhere except the
                    KTU portal.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── GRADE CARD (saved credentials exist — semester picker) ────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KTU Results</Text>
        <TouchableOpacity
          onPress={disconnectKtu}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Semester Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="calendar-text"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Semester</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.semRow}
          >
            {SEMESTERS.map((sem) => {
              const active = sem.value === selectedSemester;
              return (
                <TouchableOpacity
                  key={sem.value}
                  style={[styles.semChip, active && styles.semChipActive]}
                  onPress={() => setSelectedSemester(sem.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.semChipText,
                      active && styles.semChipTextActive,
                    ]}
                  >
                    {sem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { marginHorizontal: 20, marginTop: 4, borderWidth: 1.2 },
              (isFetching || isLoggingIn) && styles.primaryButtonDisabled,
            ]}
            onPress={fetchGrades}
            disabled={isFetching || isLoggingIn}
            activeOpacity={0.8}
          >
            {isFetching || isLoggingIn ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.primaryButtonContent}>
                <Ionicons
                  name="cloud-download-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.primaryButtonText}>
                  Get Sem - {selectedSemester} Result
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Login error (auto-login failed) */}
        {loginError && (
          <View style={[styles.errorBox, { marginHorizontal: 20 }]}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        )}

        {fetchError && (
          <View style={[styles.errorBox, { marginHorizontal: 20 }]}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{fetchError}</Text>
          </View>
        )}

        {/* Results */}
        {gradeCard && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>
                Semester {gradeCard.semester} Results
              </Text>
              {/* Cache indicator + refresh */}
              <View style={{ flex: 1 }} />
              {fromCache && (
                <View style={styles.cacheBadge}>
                  <Ionicons
                    name="archive-outline"
                    size={12}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.cacheBadgeText}>cached</Text>
                </View>
              )}
              {isOld && (
                <TouchableOpacity
                  onPress={refreshGrades}
                  disabled={isFetching || isLoggingIn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* SGPA row */}
            <View style={styles.sgpaCard}>
              <Text style={styles.sgpaLabel}>SGPA</Text>
              <Text style={styles.sgpaValue}>{gradeCard.sgpa}</Text>
            </View>

            {/* Courses */}
            <View style={styles.card}>
              {gradeCard.courses.map((course, i) => {
                const color = gradeColor(course.grade, colors.textSecondary);
                const isLast = i === gradeCard.courses.length - 1;
                return (
                  <View key={i}>
                    <View style={styles.courseItem}>
                      <View style={styles.courseLeft}>
                        <Text style={styles.courseName} numberOfLines={2}>
                          {course.course}
                        </Text>
                        <Text style={styles.courseSub}>
                          {[
                            course.code,
                            `${course.credits} cr`,
                            course.monthYear,
                          ]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.gradeBadge,
                          { backgroundColor: color + "18" },
                        ]}
                      >
                        <Text style={[styles.gradeText, { color }]}>
                          {course.grade || "—"}
                        </Text>
                      </View>
                    </View>
                    {!isLast && <View style={styles.itemSeparator} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header — same as SwitchAccounts / Settings
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
