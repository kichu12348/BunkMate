import React, { useEffect, useMemo, useState, ReactElement } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Image,
} from "react-native";
import {
  Entypo,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useSettingsStore } from "../../state/settings";
import { useAttendanceStore } from "../../state/attendance";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import { Dropdown } from "../../components/Dropdown";
import { ThemeColors } from "../../types/theme";
import { useAuthStore } from "../../state/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Switch from "../../components/UI/Switch";
import { useToastStore } from "../../state/toast";
import { useThemeStore } from "../../state/themeStore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import AnimatedHeart from "../../components/UI/AnimatedHeart";
import { APP_CONFIG } from "../../constants/config";
import { darkTheme, lightTheme } from "../../constants/colors";
import { usePfp } from "../../utils/pfpUtil";
import { usePfpStore } from "../../state/pfpStore";

const GITHUB_URL = process.env.EXPO_PUBLIC_GITHUB_URL;
const INSTAGRAM_URL = process.env.EXPO_PUBLIC_INSTAGRAM_URL;
const INSTAGRAM_COLOR = "#d82d7e";

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
    clearError,
  } = useSettingsStore();

  const fetchAttendance = useAttendanceStore((s) => s.fetchAttendance);
  const { logout, user } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const insets = useSafeAreaInsets();
  const bottomBarHeight = useBottomTabBarHeight();
  const pfpUri = usePfpStore((s) => s.uri);
  const updatePfp = usePfp(() => setPfpLoadingError(false));

  const bgFrom = useSharedValue(colors.background);
  const bgTo = useSharedValue(colors.background);
  const surfaceFrom = useSharedValue(colors.surface);
  const surfaceTo = useSharedValue(colors.surface);
  const progress = useSharedValue(1);

  const [pfpLoadingError, setPfpLoadingError] = useState(false);

  useEffect(() => {
    // When colors object changes (theme toggled), update from/to and animate
    if (
      bgTo.value !== colors.background ||
      surfaceTo.value !== colors.surface
    ) {
      bgFrom.value = bgTo.value;
      surfaceFrom.value = surfaceTo.value;
      bgTo.value = colors.background;
      surfaceTo.value = colors.surface;
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 320,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [colors, bgFrom, bgTo, surfaceFrom, surfaceTo, progress]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [bgFrom.value, bgTo.value]
    ),
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [surfaceFrom.value, surfaceTo.value]
    ),
  }));

  const darkModeIconTransLate = useSharedValue(isDark ? 0 : -30);
  const lightModeIconTransLate = useSharedValue(isDark ? 30 : 0);

  const lightModeIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: lightModeIconTransLate.value,
      },
      {
        translateY: lightModeIconTransLate.value,
      },
    ] as [{ translateX: number }, { translateY: number }],
  }));

  const darkModeIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: darkModeIconTransLate.value,
      },
      {
        translateY: darkModeIconTransLate.value * -1,
      },
    ] as [{ translateX: number }, { translateY: number }],
  }));

  const AnimatedCard: React.FC<{ style?: any; children: React.ReactNode }> = ({
    style,
    children,
  }) => (
    <Animated.View style={[styles.card, cardAnimatedStyle, style]}>
      {children}
    </Animated.View>
  );

  const fetchAttendanceDebounced = useMemo(
    () => debounced(fetchAttendance, 500),
    []
  );

  const handleYearChange = async (year: string) => {
    try {
      await setAcademicYear(year).then(fetchAttendanceDebounced);
    } catch (error: any) {
      showToast({
        title: "Error",
        message: error.message || "Failed to update academic year",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleSemesterChange = async (semester: string) => {
    try {
      await setSemester(semester).then(fetchAttendanceDebounced);
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
    if (isDark) {
      darkModeIconTransLate.value = withTiming(-30, {
        duration: 320,
        easing: Easing.out(Easing.ease),
      });
      lightModeIconTransLate.value = withTiming(0, {
        duration: 320,
        easing: Easing.in(Easing.ease),
      });
    } else {
      darkModeIconTransLate.value = withTiming(0, {
        duration: 320,
        easing: Easing.in(Easing.ease),
      });
      lightModeIconTransLate.value = withTiming(30, {
        duration: 320,
        easing: Easing.out(Easing.ease),
      });
    }
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
    titleFontFamily = false,
    danger = false,
  }: {
    Icon: ReactElement;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
    isGreat?: boolean;
    iconColor?: string;
    titleFontFamily?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        !onPress && !rightElement && styles.settingItemDisabled,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View
          style={[
            styles.settingIconContainer,
            danger && styles.dangerIconContainer,
          ]}
        >
          {Icon}
        </View>
        <View style={styles.settingItemContent}>
          <Text
            style={[
              titleFontFamily ? styles.customSettingTitle : styles.settingTitle,
              danger && styles.dangerText,
            ]}
          >
            {title}
          </Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement ||
        (showArrow && onPress && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={danger ? colors.danger : styles.settingArrow.color}
          />
        ))}
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        containerAnimatedStyle,
        { paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottomBarHeight + 24 + insets.bottom,
        }}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <Animated.View style={[styles.profileCard, cardAnimatedStyle]}>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.profileAvatarContainer}
                onPress={updatePfp}
                activeOpacity={0.7}
              >
                {pfpUri && !pfpLoadingError ? (
                  <Image
                    source={{ uri: pfpUri }}
                    style={styles.profileAvatarImage}
                    onError={(e) => {
                      setPfpLoadingError(true);
                      console.log("PFP load error:", e.nativeEvent.error);
                    }}
                  />
                ) : (
                  <View style={styles.profileAvatarPlaceholder}>
                    <Ionicons name="person" size={40} color={colors.primary} />
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={14} color="white" />
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.username || "User"}
                </Text>
                <View style={styles.profileBadge}>
                  <MaterialCommunityIcons
                    name="school"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={styles.profileBadgeText}>Student Account</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
        {/* Academic Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Academic Settings</Text>
          </View>

          <AnimatedCard>
            <View style={styles.cardContent}>
              <View style={styles.dropdownContainer}>
                <Dropdown
                  label="Academic Year"
                  options={availableYears}
                  selectedValue={selectedYear}
                  onSelect={handleYearChange}
                  placeholder="Select academic year"
                  disabled={isLoading}
                />
              </View>

              <View style={styles.dropdownContainer}>
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
                  styles.primaryButton,
                  isLoading && styles.primaryButtonDisabled,
                ]}
                onPress={handleApplySettings}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <View style={styles.primaryButtonContent}>
                    <Ionicons name="refresh-outline" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>
                      Refresh Attendance
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </AnimatedCard>
        </View>
        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="color-palette-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <AnimatedCard>
            <SettingItem
              Icon={
                <View style={styles.themeIconContainer}>
                  <Animated.View
                    style={[
                      lightModeIconAnimatedStyle,
                      styles.themeIcon,
                      isDark && styles.themeIconHidden,
                    ]}
                  >
                    <Ionicons
                      name="sunny"
                      color={lightTheme.warning}
                      size={22}
                    />
                  </Animated.View>
                  <Animated.View
                    style={[
                      darkModeIconAnimatedStyle,
                      styles.themeIcon,
                      !isDark && styles.themeIconHidden,
                    ]}
                  >
                    <Ionicons name="moon" color={darkTheme.primary} size={22} />
                  </Animated.View>
                </View>
              }
              title="Dark Mode"
              subtitle={isDark ? "Dark theme enabled" : "Light theme enabled"}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleToggleTheme}
                  size={30}
                  thumbDisabledColor={lightTheme.surface}
                  thumbEnabledColor={darkTheme.surface}
                  trackDisabledColor={lightTheme.border}
                  trackEnabledColor={darkTheme.primary}
                />
              }
              showArrow={false}
            />
          </AnimatedCard>
        </View>
        {/* About & Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>About & Support</Text>
          </View>

          <AnimatedCard>
            <SettingItem
              Icon={
                <Entypo name="emoji-happy" size={22} color={colors.primary} />
              }
              title={APP_CONFIG.NAME}
              subtitle={APP_CONFIG.DESCRIPTION}
              titleFontFamily
              showArrow={false}
            />
            <View style={styles.itemSeparator} />
            <SettingItem
              Icon={
                <MaterialCommunityIcons
                  name="information-variant"
                  size={22}
                  color={colors.primary}
                />
              }
              title="Version"
              subtitle={APP_CONFIG.VERSION}
              showArrow={false}
            />
          </AnimatedCard>

          <AnimatedCard>
            <SettingItem
              Icon={
                <Ionicons name="logo-github" size={22} color={colors.text} />
              }
              title="Contribute on GitHub"
              subtitle="Star the repository & contribute"
              onPress={() => Linking.openURL(GITHUB_URL)}
            />
            <View style={styles.itemSeparator} />
            <SettingItem
              Icon={
                <Ionicons
                  name="logo-instagram"
                  size={22}
                  color={INSTAGRAM_COLOR}
                />
              }
              title="Follow me on Instagram"
              subtitle="blu blu blu"
              onPress={() => Linking.openURL(INSTAGRAM_URL)}
            />
            <View style={styles.itemSeparator} />
            <SettingItem
              Icon={<Feather name="coffee" size={22} color={colors.warning} />}
              title="Buy Me a Coffee"
              subtitle="Support the development"
              onPress={handleCoffee}
            />
          </AnimatedCard>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <AnimatedCard style={styles.dangerCard}>
            <SettingItem
              Icon={
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.danger}
                />
              }
              title="Logout"
              subtitle="Sign out from your account"
              onPress={handleLogout}
              danger={true}
            />
          </AnimatedCard>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity onPress={clearError} style={styles.errorClose}>
              <Ionicons name="close-circle" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <AnimatedHeart size={20} />
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.5,
    },
    content: {
      flex: 1,
    },

    // Profile Section
    profileSection: {
      padding: 20,
      paddingTop: 24,
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    profileHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    profileAvatarContainer: {
      position: "relative",
    },
    profileAvatarImage: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 3,
      borderColor: colors.primary + "30",
    },
    profileAvatarPlaceholder: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.primary + "30",
    },
    editBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.surface,
    },
    profileInfo: {
      flex: 1,
      gap: 6,
    },
    profileName: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.3,
    },
    profileBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: "flex-start",
    },
    profileBadgeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.primary,
    },

    // Section Styles
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
    dangerCard: {
      borderWidth: 1,
      borderColor: colors.danger + "30",
    },

    // Dropdown Container
    dropdownContainer: {
      marginBottom: 8,
    },

    // Setting Item
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 64,
    },
    settingItemDisabled: {
      opacity: 1,
    },
    settingItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 14,
    },
    settingIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary + "12",
      alignItems: "center",
      justifyContent: "center",
    },
    dangerIconContainer: {
      backgroundColor: colors.danger + "12",
    },
    settingItemContent: {
      flex: 1,
      gap: 3,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: 0.2,
    },
    customSettingTitle: {
      fontSize: 17,
      fontFamily: "Fredoka-Regular",
      color: colors.text,
      letterSpacing: 1,
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    settingArrow: {
      color: colors.textSecondary,
    },
    dangerText: {
      color: colors.danger,
    },
    itemSeparator: {
      height: 1,
      backgroundColor: colors.border + "20",
      marginLeft: 74,
    },

    // Theme Icon
    themeIconContainer: {
      position: "relative",
      width: 22,
      height: 22,
      overflow: "hidden",
    },
    themeIcon: {
      position: "absolute",
    },
    themeIconHidden: {
      opacity: 0,
    },

    // Primary Button
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    primaryButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    // Error
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.danger + "15",
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.danger + "30",
    },
    errorContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: colors.danger,
      fontWeight: "500",
      lineHeight: 20,
    },
    errorClose: {
      padding: 4,
    },
    // Footer
    footer: {
      marginTop: 24,
      marginBottom: 16,
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
    },
  });
