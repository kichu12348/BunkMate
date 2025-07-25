import React, { useEffect, useMemo, useState, ReactElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSettingsStore } from "../state/settings";
import { useAttendanceStore } from "../state/attendance";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import { Dropdown } from "../components/Dropdown";
import { ThemeColors } from "../types/theme";
import { useAuthStore } from "../state/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Switch from "../components/UI/Switch";
import { useToastStore } from "../state/toast";
import { useThemeStore } from "../state/themeStore";

const GITHUB_URL = process.env.EXPO_PUBLIC_GITHUB_URL;

interface SettingsScreenProps {
  onClose?: () => void;
}

function debounced(func: Function, delay: number) {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const styles = useThemedStyles(createStyles);
  const { isDark, toggleMode } = useTheme();
  const colors = useThemeStore((state) => state.colors);
  const {
    selectedYear,
    selectedSemester,
    availableYears,
    availableSemesters,
    isLoading,
    error,
    setAcademicYear,
    setSemester,
    initializeSettings,
    clearError,
  } = useSettingsStore();

  const [themeIcon, setThemeIcon] = useState<string>(isDark ? "moon" : "sunny");
  const fetchAttendance = useAttendanceStore((s) => s.fetchAttendance);
  const { logout, user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const insets = useSafeAreaInsets();
  const bottomBarHeight = useBottomTabBarHeight();

  useEffect(() => {
    initializeSettings();
  }, []);

  const handleYearChange = async (year: string) => {
    try {
      await setAcademicYear(year);
      await setSemester(selectedSemester);
      await fetchAttendance(true);
    } catch (error: any) {
      showToast({
        title: "Error",
        message: error.message || "Failed to update academic year",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const fetchAttendanceDebounced = useMemo(
    () => debounced(fetchAttendance, 500),
    []
  );

  const handleSemesterChange = async (semester: string) => {
    try {
      await setAcademicYear(selectedYear);
      await setSemester(semester);
      await fetchAttendance(true);
    } catch (error: any) {
      showToast({
        title: "Error",
        message: error.message || "Failed to update semester",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleApplySettings = async () => {
    try {
      fetchAttendanceDebounced();
    } catch (error) {
      showToast({
        title: "Error",
        message: "Failed to refresh attendance data",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleLogout = () => {
    showToast({
      title: "Confirm Logout",
      message: "Are you sure you want to logout?",
      buttons: [
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            logout();
            onClose?.();
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    });
  };

  const handleToggleTheme = () => {
    toggleMode();
    setThemeIcon(isDark ? "sunny" : "moon");
  };

  const handleCoffee = () => {
    const coffeeUrl = process.env.EXPO_PUBLIC_COFFEE_URL;
    Linking.openURL(coffeeUrl);
  };

  const SettingItem = ({
    Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    showArrow = true,
    isGreat = false,
  }: {
    Icon: ReactElement;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
    isGreat?: boolean;
    iconColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIconContainer}>{Icon}</View>
        <View style={styles.settingItemContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement ||
        (showArrow && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={styles.settingArrow.color}
          />
        ))}
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 25 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomBarHeight + 10 }}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Ionicons
                name="person"
                size={32}
                color={styles.profileAvatarIcon.color}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.username || "User"}</Text>
              <Text style={styles.profileEmail}>Student Account</Text>
            </View>
          </View>
        </View>

        {/* Academic Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Settings</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Filter Options</Text>
              <Text style={styles.cardDescription}>
                Select academic year and semester to filter your attendance data
              </Text>
            </View>

            <View style={styles.form}>
              <Dropdown
                label="Academic Year"
                options={availableYears}
                selectedValue={selectedYear}
                onSelect={handleYearChange}
                placeholder="Select academic year"
                disabled={isLoading}
              />

              <Dropdown
                label="Semester"
                options={availableSemesters}
                selectedValue={selectedSemester}
                onSelect={handleSemesterChange}
                placeholder="Select semester"
                disabled={isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.refreshButton,
                isLoading && styles.refreshButtonDisabled,
              ]}
              onPress={handleApplySettings}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View style={styles.refreshButtonContent}>
                  <Ionicons name="refresh" size={18} color="white" />
                  <Text style={styles.refreshButtonText}>Refresh Data</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.card}>
            <SettingItem
              Icon={
                <Ionicons
                  name={themeIcon as keyof typeof Ionicons.glyphMap}
                  color={styles.settingIcon.color}
                  size={24}
                />
              }
              title="Dark Mode"
              subtitle={isDark ? "Enabled" : "Disabled"}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleToggleTheme}
                  size={30}
                  thumbColor={
                    isDark
                      ? styles.switchThumbOn.color
                      : styles.switchThumbOff.color
                  }
                  trackColor={
                    isDark
                      ? styles.switchTrackOn.color
                      : styles.switchTrackOff.color
                  }
                />
              }
              showArrow={false}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hehe</Text>

          <View style={styles.card}>
            <SettingItem
              Icon={
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={styles.settingIcon.color}
                />
              }
              title="App Version"
              subtitle="1.0.0"
              showArrow={false}
              onPress={null}
            />
          </View>

          <View style={styles.card}>
            <SettingItem
              Icon={
                <Ionicons
                  name="logo-github"
                  size={24}
                  color={styles.settingIcon.color}
                />
              }
              title="Contribute"
              subtitle="Support the development of BunkMate"
              showArrow={true}
              onPress={() => Linking.openURL(GITHUB_URL)}
            />
          </View>

          <View
            style={[
              styles.card,
              { borderColor: colors.warning, borderWidth: 1 },
            ]}
          >
            <SettingItem
              Icon={<Feather name="coffee" size={24} color={colors.warning} />}
              title={"Buy Me a Coffee"}
              subtitle=""
              onPress={handleCoffee}
              iconColor={colors.warning}
            />
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <View style={[styles.card, styles.borderRed]}>
            <SettingItem
              Icon={
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  color={colors.danger}
                />
              }
              title="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              showArrow={false}
              isGreat={true}
            />
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={styles.errorIcon.color}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={styles.errorClose}>
              <Ionicons name="close" size={16} color={styles.errorIcon.color} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made Wid <Ionicons name="heart" size={16} color={"red"} /> By Kichu
          </Text>
        </View>
      </ScrollView>
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
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    closeButton: {
      padding: 8,
    },
    headerIcon: {
      color: colors.text,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    profileSection: {
      padding: 16,
    },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    profileAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    profileAvatarIcon: {
      color: colors.primary,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    profileEmail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    section: {
      marginBottom: 24,
      gap: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 16,
    },
    cardHeader: {
      padding: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    form: {
      padding: 16,
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      minHeight: 60,
    },
    settingItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    settingIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    settingIcon: {
      color: colors.primary,
    },
    logOutColor: {
      color: colors.danger,
    },
    settingItemContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    settingArrow: {
      color: colors.textSecondary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 68,
    },
    refreshButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      margin: 16,
    },
    refreshButtonDisabled: {
      opacity: 0.6,
    },
    refreshButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    refreshButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    switchTrackOff: {
      color: colors.border,
    },
    switchTrackOn: {
      color: colors.primary,
    },
    switchThumbOff: {
      color: colors.surface,
    },
    switchThumbOn: {
      color: colors.surface,
    },
    logoutIcon: {
      color: colors.danger,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.danger + "20",
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
    },
    errorIcon: {
      color: colors.danger,
    },
    errorText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 14,
      color: colors.danger,
    },
    errorClose: {
      padding: 4,
    },
    bottomSpacing: {
      height: 32,
    },
    borderRed: {
      borderColor: colors.danger,
      borderWidth: 1,
    },
    footer: {
      marginTop: 16,
      padding: 16,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    footerText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
