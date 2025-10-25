import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { RootStackParamList } from "../navigation/RootNavigator";

type ForumsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MainTabs"
>;

export const ForumsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ForumsScreenNavigationProp>();

  const handleForumPress = () => {
    navigation.navigate("PublicForum");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Forums</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        <View style={styles.listContainer}>
          <TouchableOpacity
            style={styles.forumCard}
            activeOpacity={0.7}
            onPress={() => handleForumPress()}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={styles.icon.color}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.forumTitle}>Public Forum</Text>
              <Text style={styles.forumSubtitle}>
                General chat and discussion
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={styles.chevron.color}
            />
          </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    forumCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    icon: {
      color: colors.primary,
    },
    textContainer: {
      flex: 1,
      marginRight: 8,
    },
    forumTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    forumSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    chevron: {
      color: colors.textSecondary,
    },
  });
