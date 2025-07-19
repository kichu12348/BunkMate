import React from "react";
import { useToastStore } from "../../state/toast";
import { Modal, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import type { ToastButton } from "../../types/toast";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Toast() {
  const { title, message, isVisible, buttons, hideToast } = useToastStore();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  const handleButtonPress = (button: ToastButton) => {
    button.onPress?.();
    hideToast();
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={hideToast}
      animationType="fade"
      hardwareAccelerated
    >
      <View
        style={[
          styles.container,
          { paddingBottom: insets.bottom, paddingTop: insets.top },
        ]}
      >
        <View style={styles.toastCard}>
          {title && <Text style={styles.title}>{title}</Text>}
          {message && <Text style={styles.message}>{message}</Text>}

          {buttons && buttons.length > 0 ? (
            <View style={styles.buttonContainer}>
              {buttons.map((button: ToastButton, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === "destructive" && styles.destructiveButton,
                    button.style === "cancel" && styles.cancelButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      button.style === "destructive" &&
                        styles.destructiveButtonText,
                      button.style === "cancel" && styles.cancelButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ):(
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={hideToast}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background + "cc",
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    toastCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      minWidth: 280,
      maxWidth: "90%",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    title: {
      fontSize: 18,
      color: colors.text,
      textAlign: "center",
      fontWeight: "600",
      marginBottom: 8,
    },
    message: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    button: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
    },
    buttonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    destructiveButton: {
      borderColor: colors.error,
      borderWidth: 1,
    },
    destructiveButtonText: {
      color: colors.error,
    },
    cancelButton: {
        borderColor: colors.textSecondary,
        borderWidth: 1,
    },
    cancelButtonText: {
        color: colors.textSecondary,
    },
  });
