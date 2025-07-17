import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  Alert,
} from "react-native";
import {
  FontAwesome,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../hooks/useTheme";
import { ThemeColors } from "../types/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const UPI_URL = process.env.EXPO_PUBLIC_UPI_URL;

interface UPIModalProps {
  visible: boolean;
  onClose: () => void;
}

function UPIModal({ visible, onClose }: UPIModalProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const handlePayment = async () => {
    if (!UPI_URL) {
      Alert.alert(
        "Oops!",
        "Payment not configured yet. Thanks for the thought though! 😄"
      );
      return;
    }

    try {
      await Linking.openURL(UPI_URL);
    } catch (error) {
      Alert.alert("Error", "Failed to open payment link");
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "No Problem! 😊",
      "BunkMate will always be free for students. This was just a joke! Keep bunking responsibly! 🎓",
      [{ text: "Got it!", onPress: onClose }]
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      hardwareAccelerated
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          { paddingBottom: insets.bottom, paddingTop: insets.top },
        ]}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="diamond" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>
              BunkMate Premium!{" "}
              <MaterialCommunityIcons
                name="rocket-launch"
                size={24}
                color={colors.accent}
              />
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.subtitle}>
                Unlock Ultimate Bunking Powers!{" "}
                <Ionicons name="sparkles" size={16} color={colors.warning} />
              </Text>

              <View style={styles.featuresContainer}>
                <View style={styles.feature}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.featureText}>
                    Unlimited guilt-free bunking
                  </Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.featureText}>Auto-excuse generator</Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.featureText}>
                    Professor mind-reading feature
                  </Text>
                </View>
                <View style={styles.feature}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.success}
                  />
                  <Text style={styles.featureText}>
                    Time travel to attend missed classes
                  </Text>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Special Student Price:</Text>
                <Text style={styles.price}>₹1</Text>
                <Text style={styles.duration}>for 1 FULL YEAR! 🤯</Text>
                <Text style={styles.savings}>
                  (That's like ₹0.003 per day! Cheaper than a smile!)
                </Text>
              </View>

              <Text style={styles.disclaimer}>
                * This is obviously a joke! BunkMate is and will always be
                completely FREE! But if you really want to support the developer
                with ₹1, who am I to stop you?{" "}
                <FontAwesome6
                  name="face-smile-wink"
                  size={14}
                  color={colors.textSecondary}
                />
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.payButton} onPress={handleSkip}>
                <Text style={styles.payButtonText}>Nah, me gud</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handlePayment}
              >
                <FontAwesome name="money" size={20} color="white" />
                <Text style={styles.skipButtonText}>Pay ₹1 (Really?!)</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.background + "80",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      width: "100%",
      maxWidth: 400,
      maxHeight: "90%",
    },
    header: {
      alignItems: "center",
      padding: 20,
      paddingBottom: 10,
      position: "relative",
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
    closeButton: {
      position: "absolute",
      top: 15,
      right: 15,
      padding: 5,
    },
    content: {
      padding: 20,
      paddingTop: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 20,
    },
    featuresContainer: {
      marginBottom: 20,
    },
    feature: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    featureText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 10,
      flex: 1,
    },
    priceContainer: {
      alignItems: "center",
      backgroundColor: colors.primary + "10",
      borderRadius: 15,
      padding: 20,
      marginBottom: 15,
    },
    priceLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    price: {
      fontSize: 36,
      fontWeight: "bold",
      color: colors.primary,
    },
    duration: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginTop: 5,
    },
    savings: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      fontStyle: "italic",
    },
    disclaimer: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 16,
      fontStyle: "italic",
    },
    actions: {
      padding: 20,
      paddingTop: 10,
    },
    payButton: {
      backgroundColor: colors.primary,
      borderRadius: 15,
      paddingVertical: 15,
      paddingHorizontal: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    payButtonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
    skipButton: {
      borderRadius: 15,
      paddingVertical: 15,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    skipButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "500",
    },
    scrollViewContent: {
      paddingBottom: 20,
    },
  });

export default UPIModal;
