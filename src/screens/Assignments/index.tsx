import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../../state/themeStore";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAssignmentStore } from "../../state/assignments";
import { AssignmentCard } from "../../components/AssignmentCard";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Text from "../../components/UI/Text";


export const AssignmentsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, "Assignments">>();
  const styles = useThemedStyles(createStyles);

  const { subjectId, subjectName, subjectCode } = route.params;

  const assignments = useAssignmentStore((state) => state.assignments);

  const subjectAssignments = assignments.get(subjectId) || [];

  const colors = useThemeStore((state) => state.colors);

  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleAssignmentPress = (id: string, name: string) => {
    navigation.navigate("AssignmentsDetails", {
      assignmentId: id,
      assignmentName: name,
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No Assignments</Text>
      <Text style={styles.emptySubtitle}>
        There are no assignments for this subject at the moment.
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.background },
      ]}
    >
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTexts}>
            <Text style={styles.headerTitle}>Assignments</Text>
          </View>
        </View>
        <Text
          style={styles.headerSubtitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Assignments for {subjectName} ({subjectCode})
        </Text>
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {subjectAssignments.length} Assignment
            {subjectAssignments.length !== 1 && "s"}
          </Text>
        </View>
      </View>
      <FlatList
        data={subjectAssignments}
        keyExtractor={(item) => item.assignmentId}
        renderItem={({ item }) => (
          <AssignmentCard assignment={item} onPress={handleAssignmentPress} />
        )}
        ListEmptyComponent={renderEmptyState}
        scrollEnabled={subjectAssignments.length > 0}
        contentContainerStyle={
          subjectAssignments.length === 0
            ? styles.emptyList
            : [styles.listContent, { paddingBottom: insets.bottom + 20 }]
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 20,
    },
    emptyList: {
      flexGrow: 1,
    },
    headerContainer: {
      flexDirection: "column",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerTexts: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
      marginTop: 4,
    },
    countContainer: {
      alignSelf: "flex-start",
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    countText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primary,
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
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
