import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAssignmentStore } from "../../state/assignments";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../state/themeStore";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { QA } from "../../types/assignments";
import Animated, {
  withTiming,
  useSharedValue,
  Easing,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { CustomLoader } from "../../components/UI/RefreshLoader";

export const AssignmentsDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "AssignmentsDetails">>();
  const navigation = useNavigation();
  const { assignmentId, assignmentName } = route.params;
  const insets = useSafeAreaInsets();
  const fetchSpecificAssignment = useAssignmentStore(
    (state) => state.fetchSpecificAssignment
  );
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  const [list, setList] = React.useState<QA[]>([]);
  const [score, setScore] = React.useState({ totalScore: 0, totalMaxMarks: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSpecificAssignment(assignmentId);
        if (!mounted) return;
        setList(Array.isArray(data.list) ? data.list : []);
        setScore({
          totalScore: data.totalScore || 0,
          totalMaxMarks: data.totalMaxMarks || 0,
        });
      } catch (e: any) {
        if (mounted) setError("Failed to load assignment");
      } finally {
        mounted && setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, [assignmentId]);

  const progress =
    score.totalMaxMarks > 0 ? score.totalScore / score.totalMaxMarks : 0;

  React.useEffect(() => {
    progressValue.value = withTiming(progress, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    });
  }, [progress]);

  const animatedWidth = useAnimatedStyle(() => {
    return {
      width: `${Math.min(progressValue.value * 100, 100)}%`,
    };
  });

  const renderItem = ({ item, index }: { item: QA; index: number }) => {
    const questionLabel = `Q${index + 1}`;
    const itemScore = item.score ?? null;
    const itemMax = (item as any).maximum_mark ?? null; // using any in case type not updated
    return (
      <View style={styles.detailRow}>
          <Text style={styles.itemTitle}>{questionLabel}</Text>
        {itemScore !== null && itemMax !== null && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>
              {Number(itemScore)}/{Number(itemMax)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>{assignmentName}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          {/* <ActivityIndicator color={colors.primary} size="large" /> */}
          <CustomLoader
            pullProgress={{ value: 1 } as SharedValue<number>}
            size={2}
          />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchSpecificAssignment(assignmentId)
                .then((data) => {
                  setList(Array.isArray(data.list) ? data.list : []);
                  setScore({
                    totalScore: data.totalScore || 0,
                    totalMaxMarks: data.totalMaxMarks || 0,
                  });
                })
                .catch((e: any) =>
                  setError(e?.message || "Failed to load assignment")
                )
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons
                name="analytics-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.summaryTitle}>Performance</Text>
              <Text 
                style={[styles.summaryTitle, { marginLeft: "auto" }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <Animated.View style={[styles.progressBarFill, animatedWidth]} />
            </View>
            <Text style={styles.scoreText}>
              Score: <Text style={styles.scoreValue}>{score.totalScore}</Text> /{" "}
              {score.totalMaxMarks}
            </Text>
          </View>
          <FlatList
            data={list}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderItem}
            contentContainerStyle={
              list.length === 0
                ? styles.emptyList
                : [
                    styles.listContent,
                    {
                      paddingBottom: insets.bottom + 20,
                    },
                  ]
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.emptyTitle}>No Items</Text>
                <Text style={styles.emptySubtitle}>
                  This assignment has no detailed items to display.
                </Text>
              </View>
            }
            scrollEnabled={list.length > 0}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTexts: { flex: 1 },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
      gap: 12,
    },
    summaryHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    summaryTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    progressBarTrack: {
      height: 10,
      backgroundColor: colors.primary + "20",
      borderRadius: 6,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    scoreText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    scoreValue: {
      fontWeight: "700",
      color: colors.text,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    emptyList: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingBottom: 32,
      justifyContent: "center",
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      marginBottom: 8,
      padding: 14,
      borderRadius: 14,
      gap: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 1,
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 18,
      marginRight: "auto",
    },
    scoreBadge: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    scoreBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
    },
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      paddingTop: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
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
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: "dashed"
    },
    retryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
  });
