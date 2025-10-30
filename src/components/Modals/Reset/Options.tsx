import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "../../../state/themeStore";
import { authService } from "../../../api/auth";
import { ResetOptionsResponse } from "../../../types/api";
import { useToastStore } from "../../../state/toast";

interface OptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onOptionSelected: (option: "mail" | "sms") => void;
  username: string;
}

const { width } = Dimensions.get("window");

export const OptionsModal: React.FC<OptionsModalProps> = ({
  visible,
  onClose,
  onOptionSelected,
  username,
}) => {
  const { colors } = useThemeStore();
  const showToast = useToastStore((state) => state.showToast);

  const [isLoading, setIsLoading] = useState(false);
  const [resetOptions, setResetOptions] = useState<ResetOptionsResponse | null>(
    null
  );

  useEffect(() => {
    if (visible && username && !resetOptions && !isLoading) {
      fetchResetOptions();
    }
  }, [visible, username]);

  const fetchResetOptions = async () => {
    if (!username.trim()) {
      showToast({
        title: "Error",
        message: "Username is required",
        buttons: [{ text: "OK", style: "destructive" }],
      });
      return;
    }

    setIsLoading(true);
    try {
      const options = await authService.GetResetPasswordOptions(
        username.trim()
      );
      setResetOptions(options);
    } catch (error: any) {
      showToast({
        title: "Username Not Found",
        message: error.message || "Invalid username",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (option: "mail" | "sms") => {
    if (resetOptions) {
      onOptionSelected(option);
      handleClose();
    }
  };

  const handleClose = () => {
    setResetOptions(null);
    onClose();
  };

  const getEmailOption = () => {
    return resetOptions?.options?.emails?.[0] || "";
  };

  const getMobileOption = () => {
    return resetOptions?.options?.mobiles?.[0] || "";
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.background + "80",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      margin: 20,
      maxWidth: width * 0.9,
      minWidth: width * 0.8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },

    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },

    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionIcon: {
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    optionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    optionArrow: {
      color: colors.textSecondary,
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 32,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: "center",
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      hardwareAccelerated
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Getting reset options for {username}...
                </Text>
              </View>
            </>
          )}

          {!isLoading && resetOptions && (
            <>
              <Text style={styles.subtitle}>
                Choose how you'd like to receive your password reset code
              </Text>

              {getEmailOption() && (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleOptionSelect("mail")}
                >
                  <Ionicons
                    name="mail-outline"
                    size={24}
                    color={colors.primary}
                    style={styles.optionIcon}
                  />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Send via Email</Text>
                    <Text style={styles.optionSubtitle}>
                      {getEmailOption()}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.optionArrow}
                  />
                </TouchableOpacity>
              )}

              {getMobileOption() && (
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleOptionSelect("sms")}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={24}
                    color={colors.secondary}
                    style={styles.optionIcon}
                  />
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Send via SMS</Text>
                    <Text style={styles.optionSubtitle}>
                      {getMobileOption()}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.optionArrow}
                  />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
