import React, { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import Text from "../../components/UI/Text";
import useKtuGradeStore from "../../state/ktuGrades";
import { createStyles } from "./styles";

export function LoginView() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    username,
    password,
    isLoggingIn,
    loginError,
    setUsername,
    setPassword,
    manualLogin,
  } = useKtuGradeStore();

  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Form card */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
          }}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-box-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Login to KTU</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.fieldLabel}>Username</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Your KTU username"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Your KTU password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((v) => !v)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {loginError && (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color={colors.danger}
                    />
                    <Text style={styles.errorText}>{loginError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (isLoggingIn || !username || !password) &&
                      styles.primaryButtonDisabled,
                  ]}
                  onPress={manualLogin}
                  disabled={isLoggingIn || !username || !password}
                  activeOpacity={0.8}
                >
                  {isLoggingIn ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={styles.primaryButtonContent}>
                      <Text style={styles.primaryButtonText}>Login to Portal</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Privacy note */}
          <View style={styles.noteBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.noteText}>
              Your credentials are cached locally on your device to auto-fill
              next time. They are never sent anywhere except the KTU portal.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
