import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { useThemeStore } from "../state/themeStore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { TouchableOpacity as RNTouchableOpacity } from "react-native";
import Text from "./UI/Text";

const AnimatedTouchable = Animated.createAnimatedComponent(RNTouchableOpacity);

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option",
  label,
  disabled = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsVisible(false);
  };

  const renderOption = ({
    item,
    index,
  }: {
    item: DropdownOption;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === selectedValue && styles.selectedOption,
        index === 0 && styles.firstOption,
        index === options.length - 1 && styles.lastOption,
      ]}
      onPress={() => handleSelect(item.value)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          item.value === selectedValue && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
      {item.value === selectedValue && (
        <View style={styles.checkmarkContainer}>
          <Ionicons
            name="checkmark"
            size={20}
            color={styles.selectedOptionText.color}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  const themeColors = useThemeStore((s) => s.colors);
  const bgFrom = useSharedValue(themeColors.surface);
  const bgTo = useSharedValue(themeColors.surface);
  const borderFrom = useSharedValue(themeColors.border);
  const borderTo = useSharedValue(themeColors.border);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (
      bgTo.value !== themeColors.surface ||
      borderTo.value !== themeColors.border
    ) {
      bgFrom.value = bgTo.value;
      borderFrom.value = borderTo.value;
      bgTo.value = themeColors.surface;
      borderTo.value = themeColors.border;
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 320,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [themeColors, bgFrom, bgTo, borderFrom, borderTo, progress]);

  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [bgFrom.value, bgTo.value]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [borderFrom.value, borderTo.value]
    ),
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <AnimatedTouchable
        style={[
          styles.dropdown,
          dropdownAnimatedStyle,
          disabled && styles.dropdownDisabled,
        ]}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownText,
            !selectedOption && styles.placeholderText,
          ]}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <View style={styles.chevronContainer}>
          <Ionicons
            name={isVisible ? "chevron-up" : "chevron-down"}
            size={18}
            color={styles.chevronIcon.color}
          />
        </View>
      </AnimatedTouchable>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
        hardwareAccelerated
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
                <TouchableOpacity
                  onPress={() => setIsVisible(false)}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="close-circle"
                    size={28}
                    color={styles.closeIcon.color}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item) => item.value}
                style={styles.optionsList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.optionsListContent}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    dropdownDisabled: {
      opacity: 0.5,
    },
    dropdownText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
      fontWeight: "500",
      letterSpacing: 0.2,
    },
    placeholderText: {
      color: colors.textSecondary,
      fontWeight: "400",
    },
    chevronContainer: {
      marginLeft: 12,
    },
    chevronIcon: {
      color: colors.textSecondary,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "85%",
      maxWidth: 400,
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      maxHeight: "100%",
      overflow: "hidden",
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
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
    closeButton: {
      padding: 4,
      marginLeft: 12,
    },
    closeIcon: {
      color: colors.textSecondary,
    },
    optionsList: {
      flexGrow: 0
    },
    optionsListContent: {
      paddingVertical: 8,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginHorizontal: 8,
    },
    firstOption: {
      marginTop: 4,
    },
    lastOption: {
      marginBottom: 4,
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
