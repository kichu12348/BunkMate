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

  const showToast = useToastStore((state) => state.showToast);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    try {
      await lookupUsername(username.trim());
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
      await login(
        {
          username: verifiedUsername || username.trim(),
          password: password.trim(),
          stay_logged_in: true,
        }
      );
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
              placeholder="Username"
              placeholderTextColor={styles.inputPlaceholder.color}
              value={username}
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
              <Text style={styles.inputPlaceholder}>
                eg: 91{"<your_phone_number>"}
              </Text>
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
                  <ActivityIndicator size="small" color="white" />
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
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.loginButtonText}>Login</Text>
                )}
              </TouchableOpacity>
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
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 8,
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
      backgroundColor: colors.secondary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    continueButtonDisabled: {
      opacity: 0.6,
    },
    continueButtonText: {
      color: "white",
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
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: "white",
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
  });
