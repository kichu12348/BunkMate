import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import Text from "../../components/UI/Text";
import useKtuGradeStore from "../../state/ktuGrades";
import { createStyles } from "./styles";
import { SEMESTERS, gradeColor } from "./constants";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export function GradeResultsView() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    isLoggingIn,
    loginError,
    selectedSemester,
    gradeCard,
    isFetching,
    fetchError,
    fromCache,
    setSelectedSemester,
    fetchGrades,
    refreshGrades,
    isOld,
    resetError,
  } = useKtuGradeStore();

  return (
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
            { marginHorizontal: 20, marginTop: 12 },
            (isFetching || isLoggingIn) && styles.primaryButtonDisabled,
          ]}
          onPress={fetchGrades}
          disabled={isFetching || isLoggingIn}
          activeOpacity={0.8}
        >
          {isFetching || isLoggingIn ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.primaryButtonContent}>
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>
                Get Result for Semester {selectedSemester}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Login error (auto-login failed) */}
      {loginError ? (
        <AnimatedTouchableOpacity
          style={[styles.errorBox, { marginHorizontal: 20 }]}
          onPress={resetError}
          activeOpacity={0.7}
          entering={FadeInUp.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{loginError}</Text>
        </AnimatedTouchableOpacity>
      ) : null}

      {fetchError ? (
        <Animated.View
          style={[styles.errorBox, { marginHorizontal: 20 }]}
          entering={FadeInUp.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{fetchError}</Text>
        </Animated.View>
      ) : null}

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
                        {[course.code, `${course.credits} cr`, course.monthYear]
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
  );
}
