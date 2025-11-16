import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { surveysService } from "../../api/surveys";
import { SurveyStartData, QuestionChoice } from "../../types/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Dropdown } from "../../components/Dropdown";
import { useSurveysStore } from "../../state/surveys";
import { useToastStore } from "../../state/toast";
import { useThemeStore } from "../../state/themeStore";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type SurveyAttemptScreenRouteProp = RouteProp<
  RootStackParamList,
  "SurveyAttempt"
>;
type SurveyAttemptScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SurveyAttempt"
>;

interface QuestionResponse {
  questionId: number;
  choiceId: number | null;
  comment: string;
  courseTeacherId?: number;
}

export const SurveyAttemptScreen: React.FC = () => {
  const route = useRoute<SurveyAttemptScreenRouteProp>();
  const navigation = useNavigation<SurveyAttemptScreenNavigationProp>();
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);
  const insets = useSafeAreaInsets();
  const showToast = useToastStore((state) => state.showToast);

  const { surveyId } = route.params;

  const [surveyData, setSurveyData] = useState<SurveyStartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Map<number, QuestionResponse>>(
    new Map()
  );
  const [selectedBulkChoice, setSelectedBulkChoice] = useState<string | null>(
    null
  );
  const questionsPartRef = useRef(0);

  const removeSurvey = useSurveysStore((state) => state.removeSurvey);

  const progressWidth = useSharedValue(0);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  useEffect(() => {
    loadSurveyData();
  }, [surveyId]);

  const loadSurveyData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await surveysService.startSurvey(surveyId);
      setSurveyData(data);

      // Initialize responses map
      const initialResponses = new Map<number, QuestionResponse>();
      data.questionsChoices.forEach((question: QuestionChoice) => {
        initialResponses.set(question.id, {
          questionId: question.id,
          choiceId: null,
          comment: "",
        });
      });
      setResponses(initialResponses);
      questionsPartRef.current = 1 / data.questionsChoices.length;
    } catch (error: any) {
      setError(error.message || "Failed to load survey");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoiceSelect = (
    questionId: number,
    choiceId: number,
    courseTeacherId?: number
  ) => {
    const updatedResponses = new Map(responses);
    const currentResponse = updatedResponses.get(questionId) || {
      questionId,
      choiceId: null,
      comment: "",
    };

    updatedResponses.set(questionId, {
      ...currentResponse,
      choiceId,
      courseTeacherId,
    });

    setResponses(updatedResponses);
    const answeredQuestions = Array.from(updatedResponses.values()).filter(
      (response) => response.choiceId !== null
    ).length;
    progressWidth.value = withTiming(
      (answeredQuestions / surveyData!.questionsChoices.length) * 100,
      { duration: 300, easing: Easing.out(Easing.ease) }
    );
  };

  const handleCommentChange = (questionId: number, comment: string) => {
    const updatedResponses = new Map(responses);
    const currentResponse = updatedResponses.get(questionId) || {
      questionId,
      choiceId: null,
      comment: "",
    };

    updatedResponses.set(questionId, {
      ...currentResponse,
      comment,
    });

    setResponses(updatedResponses);
  };

  const validateResponses = (): boolean => {
    if (!surveyData) return false;

    for (const question of surveyData.questionsChoices) {
      const response = responses.get(question.id);

      if (
        question.answer_required &&
        (!response || response.choiceId === null)
      ) {
        showToast({
          title: "Incomplete Survey",
          message: `Please answer question ${question.question_no}: ${question.name}`,
          buttons: [{ text: "OK", style: "default" }],
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateResponses()) return;

    try {
      setIsSubmitting(true);

      const submissionData = Array.from(responses.values())
        .filter((response) => response.choiceId !== null)
        .map((response) => ({
          course_id: null,
          teacher_id: null,
          survey_question_id: response.questionId,
          survey_choice_id: response.choiceId,
          answer: response.comment || "",
        }));

      await surveysService.submitSurvey(surveyId, submissionData);
      showToast({
        title: "Survey Submitted",
        message: "Thank you for your feedback!",
        buttons: [
          {
            text: "OK",
            style: "default",
            onPress: () => {
              removeSurvey(surveyId);
              navigation.goBack();
            },
          },
        ],
      });
    } catch (error: any) {
      showToast({
        title: "Submission Failed",
        message: error.message || "Failed to submit survey",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: QuestionChoice) => {
    const response = responses.get(question.id);
    const isRequired = question.answer_required === 1;
    const allowDescriptive = question.allow_descriptive === 1;
    return (
      <View key={question.id} style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>Q{question.question_no}</Text>
          <View style={styles.questionTitleContainer}>
            <Text style={styles.questionTitle}>{question.name}</Text>
            {isRequired && <Text style={styles.requiredIndicator}>*</Text>}
          </View>
        </View>

        <View style={styles.choicesContainer}>
          {question.choices.map((choice) => {
            const isSelected = response?.choiceId === choice.id;

            return (
              <TouchableOpacity
                key={choice.id}
                style={[
                  styles.choiceButton,
                  isSelected && styles.selectedChoice,
                ]}
                onPress={() => handleChoiceSelect(question.id, choice.id)}
              >
                <View style={styles.choiceContent}>
                  <View
                    style={[
                      styles.radioButton,
                      isSelected && styles.selectedRadio,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.choiceText,
                      isSelected && styles.selectedChoiceText,
                    ]}
                  >
                    {choice.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {allowDescriptive && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>
              Additional Comments (Optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              multiline
              numberOfLines={3}
              placeholder="Enter your comments here..."
              placeholderTextColor={colors.textSecondary}
              value={response?.comment || ""}
              onChangeText={(text) => handleCommentChange(question.id, text)}
            />
          </View>
        )}
      </View>
    );
  };

  const renderCourseTeacherInfo = () => {
    if (
      !surveyData?.surveyCourceTeachers ||
      surveyData.surveyCourceTeachers.length === 0
    ) {
      return null;
    }

    return (
      <View style={styles.courseInfoContainer}>
        <Text style={styles.sectionTitle}>Course & Teacher Information</Text>
        {surveyData.surveyCourceTeachers.map((courseTeacher) => (
          <View key={courseTeacher.id} style={styles.courseTeacherCard}>
            <Text style={styles.courseName}>
              {courseTeacher.course.name} ({courseTeacher.course.code})
            </Text>
            <Text style={styles.teacherName}>
              {courseTeacher.teacher.first_name}{" "}
              {courseTeacher.teacher.last_name}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const getProgressPercentage = () => {
    if (!surveyData) return 0;

    const answeredQuestions = Array.from(responses.values()).filter(
      (response) => response.choiceId !== null
    ).length;

    return (answeredQuestions / surveyData.questionsChoices.length) * 100;
  };

  const getUniqueChoiceNames = (): string[] => {
    if (!surveyData) return [];

    const choiceNames = new Set<string>();
    surveyData.questionsChoices.forEach((question) => {
      question.choices.forEach((choice) => {
        choiceNames.add(choice.name);
      });
    });

    return Array.from(choiceNames).sort();
  };

  const handleBulkChoiceSelect = (choiceName: string) => {
    if (!surveyData) return;

    setSelectedBulkChoice(choiceName);
    const updatedResponses = new Map(responses);

    surveyData.questionsChoices.forEach((question) => {
      const matchingChoice = question.choices.find(
        (choice) => choice.name === choiceName
      );
      if (matchingChoice) {
        const currentResponse = updatedResponses.get(question.id) || {
          questionId: question.id,
          choiceId: null,
          comment: "",
        };

        updatedResponses.set(question.id, {
          ...currentResponse,
          choiceId: matchingChoice.id,
        });
      }
    });

    setResponses(updatedResponses);
    const hasAllQuestionsAnswered = Array.from(updatedResponses.values()).every(
      (response) => response.choiceId !== null
    );
    progressWidth.value = withTiming(100, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    });
    if (validateResponses() && hasAllQuestionsAnswered) {
      showToast({
        title: "Submit",
        message: `All questions will be filled with "${choiceName}"`,
        buttons: [
          {
            text: "Submit",
            style: "default",
            onPress: handleSubmit,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        delay: 10000,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading survey...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Error Loading Survey</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadSurveyData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!surveyData) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {surveyData.studFBSurvey.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {surveyData.studFBSurvey.academic_year} •{" "}
              {surveyData.studFBSurvey.survey_type}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, animatedProgressStyle]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(getProgressPercentage())}% Complete
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 10 }}
        >
          {/* Survey Info */}
          <View style={styles.surveyInfoContainer}>
            <Text style={styles.surveyTitle}>
              {surveyData.studFBSurvey.name}
            </Text>
            {surveyData.studFBSurvey.summary && (
              <Text style={styles.surveySummary}>
                {surveyData.studFBSurvey.summary}
              </Text>
            )}

            <View style={styles.surveyMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  {surveyData.studFBSurvey.time_required
                    ? `${surveyData.studFBSurvey.time_required} minutes`
                    : "No time limit"}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="shield-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText}>
                  {surveyData.studFBSurvey.is_anonymous
                    ? "Anonymous"
                    : "Not Anonymous"}
                </Text>
              </View>
            </View>
          </View>

          {renderCourseTeacherInfo()}

          {/* Questions */}
          <View style={styles.questionsContainer}>
            <Text style={styles.sectionTitle}>Survey Questions</Text>

            {/* Bulk Choice Selection */}
            <View style={styles.bulkSelectionContainer}>
              <Text style={styles.bulkSelectionTitle}>
                Quick Fill All Questions
              </Text>
              <Text style={styles.bulkSelectionSubtitle}>
                Select a response to apply to all questions at once
              </Text>
              <Dropdown
                options={getUniqueChoiceNames().map((name) => ({
                  label: name,
                  value: name,
                }))}
                placeholder="Select a response for all questions"
                selectedValue={selectedBulkChoice}
                onSelect={(value) => handleBulkChoiceSelect(value)}
              />
            </View>

            {surveyData.questionsChoices.map(renderQuestion)}
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="white"
                  />
                  <Text style={styles.submitButtonText}>Submit Survey</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    progressContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    progressBar: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },
    scrollView: {
      flex: 1,
    },
    surveyInfoContainer: {
      padding: 20,
    },
    surveyTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    surveySummary: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
      marginBottom: 16,
    },
    surveyMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    metaText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    courseInfoContainer: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    courseTeacherCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    courseName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    teacherName: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    bulkSelectionContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    bulkSelectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    bulkSelectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    bulkDropdown: {
      borderColor: colors.primary,
    },
    questionsContainer: {
      padding: 20,
    },
    questionContainer: {
      marginBottom: 32,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
    },
    questionHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    questionNumber: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 12,
      minWidth: 40,
      textAlign: "center",
    },
    questionTitleContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
    },
    questionTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      lineHeight: 24,
      flex: 1,
    },
    requiredIndicator: {
      color: colors.error,
      fontSize: 16,
      marginLeft: 4,
    },
    choicesContainer: {
      marginBottom: 16,
    },
    choiceButton: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    selectedChoice: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + "10",
    },
    choiceContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedRadio: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    choiceText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    selectedChoiceText: {
      color: colors.primary,
      fontWeight: "500",
    },
    choiceScore: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    commentContainer: {
      marginTop: 16,
    },
    commentLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      textAlignVertical: "top",
      minHeight: 80,
    },
    submitContainer: {
      padding: 20,
      paddingBottom: 40,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
  });
