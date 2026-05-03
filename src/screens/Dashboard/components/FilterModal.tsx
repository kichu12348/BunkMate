import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../../../hooks/useTheme";
import { useThemeStore } from "../../../state/themeStore";
import { ThemeColors } from "../../../types/theme";
import Text from "../../../components/UI/Text";

interface FilterModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  activeFilter: "year" | "semester" | null;
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  setVisible,
  activeFilter,
  options,
  selectedValue,
  onSelect,
}) => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setVisible(false)}
      hardwareAccelerated
      statusBarTranslucent
      navigationBarTranslucent
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setVisible(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeFilter === "year" ? "Academic Year" : "Semester"}
            </Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item, index }) => {
              const isSelected = item.value === selectedValue;
              return (
                <TouchableOpacity
                  key={`filter-opt-${index}`}
                  style={[
                    styles.modalOption,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => onSelect(item.value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background + "80",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: "hidden",
      maxHeight: "60%",
      width: "80%",
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border + "40",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.3,
      flex: 1,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginHorizontal: 8,
    },
    selectedOption: {
      backgroundColor: colors.primary + "15",
      borderRadius: 12,
    },
    optionText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
      fontWeight: "500",
      letterSpacing: 0.2,
    },
    selectedOptionText: {
      color: colors.primary,
      fontWeight: "600",
    },
    checkmarkContainer: {
      marginLeft: 12,
    },
  });
