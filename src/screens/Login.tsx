import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/auth";
import { useThemedStyles } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { APP_CONFIG } from "../constants/config";
import { useToastStore } from "../state/toast";
import { OptionsModal, ResetPasswordModal } from "../components/Modals/Reset";
import { useThemeStore } from "../state/themeStore";

export const LoginScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const {
    login,
    lookupUsername,
    isLoading,
    error,
    isUsernameVerified,
    verifiedUsername,
    resetLoginFlow,
    clearError,
  } = useAuthStore();

  const colors = useThemeStore((state) => state.colors);

  const showToast = useToastStore((state) => state.showToast);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetOption, setResetOption] = useState<"mail" | "sms">("mail");

  const handleUsernameSubmit = async () => {
    Keyboard.dismiss();
    if (!username.trim()) {
      showToast({
        title: "Error",
        message: "Please enter your username",
        buttons: [{ text: "OK", style: "destructive" }],
      });
      return;
    }
    let formattedUsername = username.trim();
    const checkIfPhone = /^\d+$/.test(username.trim());
    if (checkIfPhone) {
      if (username.trim().length < 10) {
        showToast({
          title: "Error",
          message: "Please enter a valid phone number of at least 10 digits",
          buttons: [{ text: "OK", style: "destructive" }],
        });
        return;
      }
      const formattedPhone = `91${username.slice(-10).trim()}`;
      formattedUsername = formattedPhone;
    }
    try {
      await lookupUsername(formattedUsername);
    } catch (error: any) {
      showToast({
        title: "Username Not Found",
        message: error.message || "Invalid username",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!password.trim()) {
      showToast({
        title: "Error",
        message: "Please enter your password",
        buttons: [{ text: "OK", style: "destructive" }],
      });
      return;
    }

    try {
      await login({
        username: verifiedUsername || username.trim(),
        password: password.trim(),
        stay_logged_in: true,
      });
    } catch (error: any) {
      showToast({
        title: "Login Failed",
        message: error.message || "Invalid credentials",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  const handleBackToUsername = () => {
    resetLoginFlow();
    setPassword("");
    setShowPassword(false);
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    if (isUsernameVerified) {
      resetLoginFlow();
    }
    clearError();
  };

  const handleForgotPassword = () => {
    const currentUsername = verifiedUsername || username.trim();
    if (!currentUsername) {
      showToast({
        title: "Username Required",
        message: "Please enter your username first",
        buttons: [{ text: "OK", style: "destructive" }],
      });
      return;
    }
    setShowOptionsModal(true);
  };

  const handleOptionSelected = (option: "mail" | "sms") => {
    setResetOption(option);
    setShowOptionsModal(false);
    setShowResetModal(true);
  };

  const handleResetSuccess = async (username: string, password: string) => {
    try {
      await login({ username, password, stay_logged_in: true });
    } catch (err) {
      showToast({
        title: "Login Failed",
        message: err.message || "Invalid credentials",
        buttons: [{ text: "OK", style: "destructive" }],
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{APP_CONFIG.NAME}</Text>
          <Text style={styles.subtitle}>{APP_CONFIG.DESCRIPTION}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={styles.inputIcon.color}
            />
            <TextInput
              style={styles.input}
              placeholder="Username/Email/Phone"
              placeholderTextColor={styles.inputPlaceholder.color}
              value={isUsernameVerified ? verifiedUsername : username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading && !isUsernameVerified}
            />
            {isUsernameVerified && (
              <TouchableOpacity
                onPress={handleBackToUsername}
                style={styles.editButton}
              >
                <Ionicons
                  name="pencil-outline"
                  size={18}
                  color={styles.inputIcon.color}
                />
              </TouchableOpacity>
            )}
          </View>

          {!isUsernameVerified && (
            <>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  isLoading && styles.continueButtonDisabled,
                  !isUsernameVerified && { marginTop: 8 },
                ]}
                onPress={handleUsernameSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {isUsernameVerified && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={styles.inputIcon.color}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={styles.inputPlaceholder.color}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  autoFocus={true}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={styles.inputIcon.color}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password ?
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={styles.errorText.color}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Developed for students to track attendance and maintain ≥75% per
            subject
          </Text>
        </View>
      </ScrollView>

      <OptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onOptionSelected={handleOptionSelected}
        username={verifiedUsername}
      />

      <ResetPasswordModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        username={verifiedUsername}
        option={resetOption}
        onSuccess={handleResetSuccess}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 48,
    },
    title: {
      fontSize: 32,
      fontFamily: "Chewy-Regular",
      color: colors.primary,
      marginBottom: 8,
      letterSpacing: 2,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
    form: {
      marginBottom: 32,
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
    inputPlaceholder: {
      color: colors.textSecondary,
    },
    passwordToggle: {
      padding: 4,
    },
    editButton: {
      padding: 4,
      marginLeft: 8,
    },
    continueButton: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: colors.secondary,
      borderStyle: "dashed",
    },
    continueButtonDisabled: {
      opacity: 0.6,
    },
    continueButtonText: {
      color: colors.secondary,
      fontSize: 16,
      fontWeight: "600",
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.danger + "20",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 16,
    },
    errorText: {
      color: colors.danger,
      fontSize: 14,
      marginLeft: 8,
      flex: 1,
    },
    loginButton: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      borderColor: colors.primary,
      borderWidth: 1.5,
      borderStyle: "dashed",
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    footer: {
      alignItems: "center",
      paddingVertical: 24,
    },
    footerText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 16,
    },
    forgotPasswordButton: {
      alignItems: "center",
      padding: 8,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "500",
    },
    forgotPasswordContainer: {
      alignItems: "center",
      marginTop: 16,
    },
  });
