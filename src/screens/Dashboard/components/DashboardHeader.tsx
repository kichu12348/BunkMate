import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { AnimatedStyle } from "react-native-reanimated";
import { useThemedStyles } from "../../../hooks/useTheme";
import { ThemeColors } from "../../../types/theme";
import Text from "../../../components/UI/Text";

interface DashboardHeaderProps {
  insetsTop: number;
  name: string | null;
  onNavigateForum: () => void;
  filterInfoAnimatedStyle: AnimatedStyle<ViewStyle>;
  setFilterInfoHeight: (height: number) => void;
  filterInfoHeight: number;
  openFilterModal: (filter: "year" | "semester") => void;
  selectedYearLabel: string;
  selectedSemesterLabel: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  insetsTop,
  name,
  onNavigateForum,
  filterInfoAnimatedStyle,
  setFilterInfoHeight,
  filterInfoHeight,
  openFilterModal,
  selectedYearLabel,
  selectedSemesterLabel,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.header, { paddingTop: insetsTop + 10 }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {name || "Student"}!</Text>
          <Text style={styles.subGreeting}>Track your attendance progress</Text>
        </View>
        <View style={styles.headerIconBadge}>
          <TouchableOpacity onPress={onNavigateForum} activeOpacity={0.7}>
            <Ionicons
              name="chatbubbles"
              size={28}
              color={styles.textSecondary.color}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Animated.View
        style={[styles.filterInfo, filterInfoAnimatedStyle]}
        onLayout={(event) => {
          if (filterInfoHeight === 0) {
            setFilterInfoHeight(event.nativeEvent.layout.height);
          }
        }}
      >
        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => openFilterModal("year")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={styles.textSecondary.color}
          />
          <Text style={styles.filterText}>{selectedYearLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterItem}
          onPress={() => openFilterModal("semester")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="school-outline"
            size={16}
            color={styles.textSecondary.color}
          />
          <Text style={styles.filterText}>{selectedSemesterLabel}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
    },
    headerLeft: {
      flex: 1,
    },
    headerIconBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    greeting: {
      fontSize: 24,
      fontFamily: "Fredoka-Regular",
      color: colors.text,
    },
    subGreeting: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    filterInfo: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      marginTop: 16,
      gap: 12,
    },
    filterItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    filterText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 6,
    },
    textSecondary: {
      color: colors.textSecondary,
    },
  });
