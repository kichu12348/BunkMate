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
import { Entypo, Feather, Ionicons } from "@expo/vector-icons";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import AnimatedHeart from "../components/UI/AnimatedHeart";
import { APP_CONFIG } from "../constants/config";
import { darkTheme, lightTheme } from "../constants/colors";
import pfp from "../assets/bonk_pfp.jpeg";
import { usePfp } from "../utils/pfpUtil";
import { usePfpStore } from "../state/pfpStore";

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
    initializeSettings,
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

  const [isHeartActive, setIsHeartActive] = useState(false);
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

  useEffect(() => {
    initializeSettings();
  }, []);

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
          <Text
            style={
              titleFontFamily ? styles.customSettingTitle : styles.settingTitle
            }
          >
            {title}
          </Text>
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
    <Animated.View
      style={[
        styles.container,
        containerAnimatedStyle,
        { paddingTop: insets.top },
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
        contentContainerStyle={{
          paddingBottom: bottomBarHeight + 24 + insets.bottom,
        }}
      >
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <Animated.View style={[styles.profileCard, cardAnimatedStyle]}>
            <TouchableOpacity
              style={styles.profileAvatar}
              onPress={updatePfp}
              activeOpacity={0.7}
            >
              {pfpUri && !pfpLoadingError ? (
                <Image
                  source={{ uri: pfpUri }}
                  style={styles.profileAvatarImage}
                  onError={(e) => {
                    setPfpLoadingError(true)
                    console.log("PFP load error:", e.nativeEvent.error);
                  }}
                />
              ) : (
                <Ionicons
                  name="person-circle-outline"
                  size={60}
                  color={colors.primary}
                />
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.username || "User"}</Text>
              <Text style={styles.profileEmail}>Student Account</Text>
            </View>
          </Animated.View>
        </View>

        {/* Academic Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Academic Settings</Text>

          <AnimatedCard>
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
          </AnimatedCard>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <AnimatedCard>
            <SettingItem
              Icon={
                <View style={{ overflow: "hidden", position: "relative" }}>
                  <Animated.View
                    style={[
                      lightModeIconAnimatedStyle,
                      isDark && { position: "absolute" },
                    ]}
                  >
                    <Ionicons
                      name="sunny"
                      color={lightTheme.warning}
                      size={24}
                    />
                  </Animated.View>
                  <Animated.View
                    style={[
                      darkModeIconAnimatedStyle,
                      !isDark && { position: "absolute" },
                    ]}
                  >
                    <Ionicons name="moon" color={darkTheme.primary} size={24} />
                  </Animated.View>
                </View>
              }
              title="Dark Mode"
              subtitle={isDark ? "Enabled" : "Disabled"}
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

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hehe</Text>

          <AnimatedCard>
            <SettingItem
              Icon={
                <Entypo
                  name="emoji-happy"
                  size={24}
                  color={styles.settingIcon.color}
                />
              }
              title={APP_CONFIG.NAME}
              subtitle={APP_CONFIG.DESCRIPTION}
              titleFontFamily
              showArrow={false}
              onPress={null}
            />
          </AnimatedCard>

          <AnimatedCard>
            <SettingItem
              Icon={
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={styles.settingIcon.color}
                />
              }
              title="App Version"
              subtitle={APP_CONFIG.VERSION}
              showArrow={false}
              onPress={null}
            />
          </AnimatedCard>

          <AnimatedCard>
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
          </AnimatedCard>

          <AnimatedCard
            style={{ borderColor: INSTAGRAM_COLOR, borderWidth: 1 }}
          >
            <SettingItem
              Icon={
                <Ionicons
                  name="logo-instagram"
                  size={24}
                  color={INSTAGRAM_COLOR}
                />
              }
              title="Instagram"
              showArrow={true}
              onPress={() => Linking.openURL(INSTAGRAM_URL)}
            />
          </AnimatedCard>

          <AnimatedCard style={{ borderColor: colors.warning, borderWidth: 1 }}>
            <SettingItem
              Icon={<Feather name="coffee" size={24} color={colors.warning} />}
              title={"Buy Me a Coffee"}
              subtitle=""
              onPress={handleCoffee}
              iconColor={colors.warning}
            />
          </AnimatedCard>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <AnimatedCard style={styles.borderRed}>
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
          </AnimatedCard>
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
          <TouchableOpacity
            onPress={() => setIsHeartActive(true)}
            disabled={isHeartActive}
            activeOpacity={1}
          >
            <Text style={styles.footerText}>
              Made Wid{" "}
              <AnimatedHeart
                isActive={isHeartActive}
                setIsActive={setIsHeartActive}
                size={20}
              />{" "}
              by Kichu
            </Text>
          </TouchableOpacity>
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
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    profileAvatarImage: {
      width: 60,
      height: 60,
      borderRadius: 30,
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
    customSettingTitle: {
      fontSize: 16,
      fontFamily: "Chewy-Regular",
      color: colors.text,
      marginBottom: 2,
      letterSpacing: 1,
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
      fontFamily: "Chewy-Regular",
      letterSpacing: 1,
    },
  });
