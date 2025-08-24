import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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
        index === options.length - 1 && { borderBottomWidth: 0 },
      ]}
      onPress={() => handleSelect(item.value)}
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
        <Ionicons
          name="checkmark"
          size={20}
          color={styles.selectedOptionText.color}
        />
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
        duration: 280,
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
        <Ionicons
          name={isVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color={styles.chevronIcon.color}
        />
      </AnimatedTouchable>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
        hardwareAccelerated
        statusBarTranslucent
        navigationBarTranslucent
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || "Select Option"}</Text>
              <TouchableOpacity
                onPress={() => setIsVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={24}
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
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    dropdown: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dropdownDisabled: {
      opacity: 0.5,
    },
    dropdownText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    chevronIcon: {
      color: colors.textSecondary,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.background + "80",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      margin: 20,
      maxHeight: "60%",
      width: "80%",
      overflow: "hidden",
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
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeIcon: {
      color: colors.textSecondary,
    },
    optionsList: {
      maxHeight: 300,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedOption: {
      backgroundColor: colors.primary + "10",
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    selectedOptionText: {
      color: colors.primary,
      fontWeight: "600",
    },
  });
