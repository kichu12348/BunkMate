import React from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
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
  withSpring,
  useSharedValue,
  Easing,
  useAnimatedStyle,
  SharedValue,
  runOnJS,
} from "react-native-reanimated";
import { CustomLoader } from "../../components/UI/RefreshLoader";
import Text from "../../components/UI/Text";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const AssignmentsDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, "AssignmentsDetails">>();
  const navigation = useNavigation();
  const { assignmentId, assignmentName } = route.params;
  const insets = useSafeAreaInsets();
  const fetchSpecificAssignment = useAssignmentStore(
    (state) => state.fetchSpecificAssignment,
  );
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  const [list, setList] = React.useState<QA[]>([]);
  const [score, setScore] = React.useState({ totalScore: 0, totalMaxMarks: 0 });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Popup state for long-press question details
  const [selectedItem, setSelectedItem] = React.useState<{
    item: QA;
    index: number;
  } | null>(null);
  const [showPopup, setShowPopup] = React.useState(false);

  const selectColor = (score: number, maxMarks: number) => {
    const percentage = score / maxMarks;
    if (percentage >= 0.8) {
      return [colors.primary, colors.primary + "20"];
    } else if (percentage >= 0.6) {
      return [colors.warning, colors.warning + "20"];
    } else {
      return [colors.error, colors.error + "20"];
    }
  };

  // Animation values for popup
  const overlayOpacity = useSharedValue(0);
  const popupScale = useSharedValue(0.8);
  const popupOpacity = useSharedValue(0);

  const progressValue = useSharedValue(0);

  const openPopup = React.useCallback(
    (item: QA, index: number) => {
      setSelectedItem({ item, index });
      setShowPopup(true);
      overlayOpacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
      popupScale.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
      popupOpacity.value = withTiming(1, {
        duration: 150,
        easing: Easing.out(Easing.ease),
      });
    },
    [overlayOpacity, popupScale, popupOpacity],
  );

  const closePopup = React.useCallback(() => {
    overlayOpacity.value = withTiming(0, {
      duration: 120,
      easing: Easing.in(Easing.ease),
    });
    popupScale.value = withTiming(0.9, {
      duration: 120,
      easing: Easing.in(Easing.ease),
    });
    popupOpacity.value = withTiming(
      0,
      { duration: 120, easing: Easing.in(Easing.ease) },
      () => {
        runOnJS(setShowPopup)(false);
        runOnJS(setSelectedItem)(null);
      },
    );
  }, [overlayOpacity, popupScale, popupOpacity]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const popupAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popupScale.value }],
    opacity: popupOpacity.value,
  }));

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
    const questionText = item.question || item.text || "";

    const [textColor, badgeColor] = selectColor(
      Number(itemScore),
      Number(itemMax),
    );

    return (
      <Pressable
        onLongPress={() => openPopup(item, index)}
        delayLongPress={300}
        style={({ pressed }) => [
          styles.detailRow,
          pressed && styles.detailRowPressed,
        ]}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{questionLabel}</Text>
          {questionText ? (
            <Text
              style={styles.questionPreview}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {questionText}
            </Text>
          ) : null}
        </View>
        {itemScore !== null && itemMax !== null && (
          <View style={[styles.scoreBadge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.scoreBadgeText, { color: textColor }]}>
              {Number(itemScore)}/{Number(itemMax)}
            </Text>
          </View>
        )}
      </Pressable>
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
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {assignmentName}
            </Text>
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
                  setError(e?.message || "Failed to load assignment"),
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
              <Text style={[styles.summaryTitle, { marginLeft: "auto" }]}>
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

      {/* Long-press popup modal */}
      <Modal
        visible={showPopup}
        transparent
        animationType="none"
        onRequestClose={closePopup}
        statusBarTranslucent
      >
        <Pressable style={styles.modalContainer} onPress={closePopup}>
          <Animated.View style={[styles.overlay, overlayAnimatedStyle]} />
          <Animated.View style={[styles.popupCard, popupAnimatedStyle]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              {selectedItem && (
                <>
                  <View style={styles.popupHeader}>
                    <View style={styles.popupLabelRow}>
                      <Text style={styles.popupLabel}>
                        Q{selectedItem.index + 1}
                      </Text>
                      {selectedItem.item.score !== null &&
                        selectedItem.item.maximum_mark !== null &&
                        (() => {
                          const itemScore = Number(selectedItem.item.score);
                          const itemMax = Number(
                            selectedItem.item.maximum_mark,
                          );

                          const [textColor, badgeColor] = selectColor(
                            itemScore,
                            itemMax,
                          );
                          return (
                            <View
                              style={[
                                styles.popupScoreBadge,
                                { backgroundColor: badgeColor },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.popupScoreBadgeText,
                                  { color: textColor },
                                ]}
                              >
                                {itemScore}/{itemMax}
                              </Text>
                            </View>
                          );
                        })()}
                    </View>
                    <TouchableOpacity
                      onPress={closePopup}
                      style={styles.closeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView
                    style={styles.popupScrollContent}
                    showsVerticalScrollIndicator={true}
                    bounces={false}
                  >
                    <Text style={styles.popupQuestionText}>
                      {selectedItem.item.question ||
                        selectedItem.item.text ||
                        "No question content available"}
                    </Text>
                  </ScrollView>
                </>
              )}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
      borderStyle: "dashed",
    },
    retryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "bold",
    },
    // Long-press item styles
    detailRowPressed: {
      opacity: 0.7,
      transform: [{ scale: 0.98 }],
    },
    itemContent: {
      flex: 1,
      gap: 4,
    },
    questionPreview: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
    },
    popupCard: {
      width: SCREEN_WIDTH - 40,
      maxHeight: "70%",
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 10,
    },
    popupHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border || colors.textSecondary + "30",
    },
    popupLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    popupLabel: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    popupScoreBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    popupScoreBadgeText: {
      fontSize: 14,
      fontWeight: "600",
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    popupScrollContent: {
      maxHeight: 400,
    },
    popupQuestionText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 24,
    },
  });
