import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSurveysStore } from "../state/surveys";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { Survey } from "../api/surveys";
import { formatDistanceToNow, parseISO, isPast, isFuture } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useToastStore } from "../state/toast";
import { useThemeStore } from "../state/themeStore";

type SurveysScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

interface SurveyCardProps {
  survey: Survey;
  onPress: () => void;
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onPress }) => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  const isCompleted = survey.pivot.end_at !== null;
  const endDate = parseISO(survey.end_at);
  const startDate = parseISO(survey.start_at);
  const isExpired = isPast(endDate) && !isCompleted;
  const isPending = isFuture(startDate);

  const getStatusInfo = () => {
    if (isCompleted) {
      return {
        text: "Completed",
        color: colors.success,
        icon: "checkmark-circle" as const,
        bg: colors.success + "20",
      };
    }
    if (isExpired) {
      return {
        text: "Expired",
        color: colors.error,
        icon: "time-outline" as const,
        bg: colors.error + "20",
      };
    }
    if (isPending) {
      return {
        text: "Upcoming",
        color: colors.warning,
        icon: "calendar-outline" as const,
        bg: colors.warning + "20",
      };
    }
    return {
      text: "Active",
      color: colors.primary,
      icon: "play-circle" as const,
      bg: colors.primary + "20",
    };
  };

  const status = getStatusInfo();

  const getSurveyTypeInfo = () => {
    switch (survey.survey_type) {
      case "course_exit":
        return {
          text: "Course Exit Survey",
          icon: "school-outline" as const,
          color: colors.secondary,
        };
      case "student_feedback":
        return {
          text: "Student Feedback",
          icon: "chatbubble-outline" as const,
          color: colors.accent,
        };
      default:
        return {
          text: "Survey",
          icon: "document-text-outline" as const,
          color: colors.textSecondary,
        };
    }
  };

  const typeInfo = getSurveyTypeInfo();

  return (
    <TouchableOpacity
      style={styles.surveyCard}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isCompleted || isExpired}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.typeIndicator,
              { backgroundColor: typeInfo.color + "20" },
            ]}
          >
            <Ionicons name={typeInfo.icon} size={16} color={typeInfo.color} />
          </View>
          <Text style={styles.surveyTitle} numberOfLines={2}>
            {survey.name}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
      </View>

      {survey.summary && (
        <Text style={styles.surveySummary} numberOfLines={2}>
          {survey.summary}
        </Text>
      )}

      <View style={styles.courseInfo}>
        {survey.course && (
          <View style={styles.courseRow}>
            <Ionicons
              name="book-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.courseText}>
              {survey.course.name} ({survey.course.code})
            </Text>
          </View>
        )}
        {survey.usersubgroup && (
          <View style={styles.courseRow}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.courseText}>{survey.usersubgroup.name}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>
            {isCompleted ? "Completed" : isExpired ? "Expired" : "Ends"}:
          </Text>
          <Text style={styles.timeText}>
            {isCompleted
              ? formatDistanceToNow(parseISO(survey.pivot.end_at!), {
                  addSuffix: true,
                })
              : formatDistanceToNow(endDate, { addSuffix: true })}
          </Text>
        </View>
        {survey.time_required && (
          <View style={styles.durationInfo}>
            <Ionicons
              name="timer-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.durationText}>{survey.time_required}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const FilterChip: React.FC<{
  label: string;
  isActive: boolean;
  onPress: () => void;
  count: number;
}> = ({ label, isActive, onPress, count }) => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: isActive ? "transparent" : colors.surface,
          borderWidth: isActive ? 1 : 0,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.countText,
          {
            color: isActive ? colors.primary : colors.textSecondary,
          },
        ]}
      >
        {count}
      </Text>
      <Text
        style={[
          styles.filterChipText,
          {
            color: isActive ? colors.primary : colors.text,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export const SurveysScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<SurveysScreenNavigationProp>();

  const showToast = useToastStore((state) => state.showToast);

  const {
    surveys,
    error,
    filterType,
    fetchSurveys,
    refreshSurveys,
    setFilter,
    getFilteredSurveys,
  } = useSurveysStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSurveys();
    setRefreshing(false);
  };

  const handleSurveyPress = (survey: Survey) => {
    const isCompleted = survey.pivot.end_at !== null;
    const endDate = parseISO(survey.end_at);
    const startDate = parseISO(survey.start_at);
    const isExpired = isPast(endDate) && !isCompleted;
    const isPending = isFuture(startDate);

    if (isExpired) {
      showToast({
        title: "Survey Expired",
        message: "This survey has expired and can no longer be taken.",
        buttons: [{ text: "OK", style: "destructive" }],
      });

      return;
    }

    if (isCompleted) {
      showToast({
        title: "Survey Completed",
        message: "You have already completed this survey.",
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    if (isPending) {
      showToast({
        title: "Survey Not Available",
        message: `This survey will be available ${formatDistanceToNow(
          startDate,
          {
            addSuffix: true,
          }
        )}.`,
        buttons: [{ text: "OK", style: "default" }],
      });
      return;
    }

    // Navigate to survey attempt screen
    navigation.navigate("SurveyAttempt", {
      surveyId: survey.id,
      surveyName: survey.name,
    });
  };

  const filteredSurveys = getFilteredSurveys();

  const getFilterCounts = () => {
    const now = new Date();
    const pending = surveys.filter((s) => {
      const endDate = new Date(s.end_at);
      const hasCompleted = s.pivot.end_at !== null;
      return !hasCompleted && endDate > now;
    }).length;

    const completed = surveys.filter((s) => s.pivot.end_at !== null).length;

    const expired = surveys.filter((s) => {
      const endDate = new Date(s.end_at);
      const hasCompleted = s.pivot.end_at !== null;
      return !hasCompleted && endDate <= now;
    }).length;

    return { all: surveys.length, pending, completed, expired };
  };

  const filterCounts = getFilterCounts();

  const bottomBarHeight = useBottomTabBarHeight();

  const renderSurvey = ({ item }: { item: Survey }) => (
    <SurveyCard survey={item} onPress={() => handleSurveyPress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No Surveys Found</Text>
      <Text style={styles.emptyMessage}>
        {filterType === "all"
          ? "There are no surveys available at the moment."
          : "No surveys"}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Surveys</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Error Loading Surveys</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSurveys(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Surveys</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSurveys.length} survey
          {filteredSurveys.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterChip
          label="All"
          isActive={filterType === "all"}
          onPress={() => setFilter("all")}
          count={filterCounts.all}
        />
        <FilterChip
          label="Pending"
          isActive={filterType === "pending"}
          onPress={() => setFilter("pending")}
          count={filterCounts.pending}
        />
        <FilterChip
          label="Expired"
          isActive={filterType === "expired"}
          onPress={() => setFilter("expired")}
          count={filterCounts.expired}
        />
      </ScrollView>

      <FlatList
        data={filteredSurveys}
        renderItem={renderSurvey}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: bottomBarHeight + 60 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.textSecondary}
            progressBackgroundColor={colors.background}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
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
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    filtersContainer: {
      height: 80,
      maxHeight: 80,
      minHeight: 80,
      paddingVertical: 20,
    },
    filtersContent: {
      paddingHorizontal: 20,
      gap: 8,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderStyle: "dashed",
      gap: 8,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: "600",
    },
    countBadge: {
      minWidth: 20,
      alignItems: "center",
    },
    countText: {
      fontSize: 12,
      fontWeight: "bold",
    },
    listContainer: {
      flexGrow: 1,
      paddingHorizontal: 16,
    },
    surveyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginVertical: 6,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
    surveyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      lineHeight: 22,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
    },
    surveySummary: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    courseInfo: {
      marginBottom: 12,
      gap: 6,
    },
    courseRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    courseText: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeInfo: {
      flex: 1,
    },
    timeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    timeText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    durationInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "600",
    },
  });
