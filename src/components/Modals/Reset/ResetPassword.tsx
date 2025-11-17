import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../../../state/themeStore";
import { authService } from "../../../api/auth";
import Text from "../../UI/Text";

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  option: "mail" | "sms";
  onSuccess: (username: string, password: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  onClose,
  username,
  option,
  onSuccess,
}) => {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (visible && username && option && !otpRequested) {
      requestOtp();
    }
  }, [visible, username, option]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const requestOtp = async () => {
    setIsRequestingOtp(true);
    try {
      await authService.RequestPasswordReset(username, option);
      setOtpRequested(true);
      setCountdown(60); // 60 second countdown for resend
      Alert.alert(
        "OTP Sent",
        `Verification code sent via ${option === "mail" ? "email" : "SMS"}`,
        [{ text: "OK", style: "default" }]
      );
    } catch (error: any) {
      Alert.alert(
        "Failed to Send OTP",
        error.message || "Something went wrong",
        [{ text: "OK", style: "destructive", onPress: handleClose }]
      );
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyAndReset = async () => {
    // Validation
    if (!otp.trim()) {
      Alert.alert("Error", "Please enter the verification code", [
        { text: "OK", style: "destructive" },
      ]);
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Please enter a new password", [
        { text: "OK", style: "destructive" },
      ]);
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long", [
        { text: "OK", style: "destructive" },
      ]);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match", [
        { text: "OK", style: "destructive" },
      ]);
      return;
    }

    setIsVerifying(true);
    try {
      await authService.VerifyPasswordReset(
        username,
        otp.trim(),
        password.trim()
      );

      Alert.alert(
        "Success",
        "Password reset successfully! Please login with your new password.",
        [{ text: "OK", style: "default" }]
      );

      handleClose();
      onSuccess(username, password);
    } catch (error: any) {
      Alert.alert(
        "Reset Failed",
        error.message || "Invalid verification code or something went wrong",
        [{ text: "OK", style: "destructive" }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = () => {
    if (countdown === 0) {
      requestOtp();
    }
  };

  const handleClose = () => {
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOtpRequested(false);
    setCountdown(0);
    onClose();
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingBottom: insets.bottom,
      paddingHorizontal: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: insets.top + 12,
      paddingHorizontal: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 22,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: Platform.OS === "ios" ? 12 : 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      color: colors.textSecondary,
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      paddingHorizontal: 8,
    },
    passwordToggle: {
      padding: 4,
    },
    otpContainer: {
      marginBottom: 16,
    },
    resendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    resendText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    resendButton: {
      marginLeft: 8,
    },
    resendButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    resendButtonDisabled: {
      color: colors.textSecondary,
    },
    resetButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 16,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    resetButtonDisabled: {
      opacity: 0.6,
    },
    resetButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 48,
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
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Reset Password</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={32} color={colors.text} />
          </TouchableOpacity>
        </View>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {isRequestingOtp && !otpRequested ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    Sending verification code via{" "}
                    {option === "mail" ? "email" : "SMS"}...
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.subtitle}>
                    Enter the verification code sent to your{" "}
                    {option === "mail" ? "email" : "phone"} and set a new
                    password
                  </Text>

                  <View style={styles.otpContainer}>
                    <View style={styles.inputContainer}>
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color={colors.textSecondary}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Verification Code"
                        placeholderTextColor={colors.textSecondary}
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isVerifying}
                        maxLength={6}
                      />
                    </View>
                  </View>

                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                      Didn't receive the code?
                    </Text>
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResendOtp}
                      disabled={countdown > 0}
                    >
                      <Text
                        style={[
                          styles.resendButtonText,
                          countdown > 0 && styles.resendButtonDisabled,
                        ]}
                      >
                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password"
                      placeholderTextColor={colors.textSecondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isVerifying}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor={colors.textSecondary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isVerifying}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.resetButton,
                      isVerifying && styles.resetButtonDisabled,
                    ]}
                    onPress={handleVerifyAndReset}
                    disabled={isVerifying}
                  >
                    {isVerifying ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.resetButtonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
