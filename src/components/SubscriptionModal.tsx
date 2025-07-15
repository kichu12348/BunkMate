import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
} from "react-native";
import { useThemeStore } from "../state/themeStore";
import { AntDesign } from "@expo/vector-icons";

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors } = useThemeStore();
  const [showJoke, setShowJoke] = useState(false);

  const handleNext = () => {
    setShowJoke(true);
  };

  const handleContribute = async () => {
    const githubUrl = "https://github.com/kichu12348/BunkMate";
    try {
      const canOpen = await Linking.canOpenURL(githubUrl);
      if (canOpen) {
        await Linking.openURL(githubUrl);
      }
    } catch (error) {
      console.error("Error opening GitHub URL:", error);
    }
  };

  const handleClose = () => {
    setShowJoke(false);
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      margin: 20,
      maxWidth: width * 0.9,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 32,
    },
    priceContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    priceText: {
      fontSize: 48,
      fontWeight: "bold",
      color: colors.primary,
    },
    priceSubtext: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 4,
    },
    featuresContainer: {
      marginBottom: 32,
    },
    featureItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    featureIcon: {
      fontSize: 16,
      color: colors.success,
      marginRight: 12,
      width: 20,
    },
    featureText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    primaryButton: {
      backgroundColor: colors.primary,
      marginTop: 16,
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 16,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
    },
    primaryButtonText: {
      color: "#ffffff",
    },
    secondaryButtonText: {
      color: colors.text,
    },
    jokeContainer: {
      alignItems: "center",
      marginBottom: 24,
    },
    jokeEmoji: {
      fontSize: 64,
      marginBottom: 16,
    },
    jokeTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    jokeText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      marginBottom: 20,
    },
    githubText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    contributionButton: {
      backgroundColor: colors.accent,
      marginTop: 16,
    },
  });

  if (!showJoke) {
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
            <Text style={styles.title}>BunkMate Premium</Text>
            <Text style={styles.subtitle}>
              Unlock exclusive features (or so I say...)
            </Text>

            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>₹1</Text>
              <Text style={styles.priceSubtext}>per year</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={handleClose}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Maybe Later
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={handleNext}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

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
          <View style={styles.jokeContainer}>
            <Text style={styles.jokeEmoji}>
              <AntDesign name="smileo" size={64} color={colors.text} />
            </Text>
            <Text style={styles.jokeTitle}>Just Kidding!</Text>
            <Text style={styles.jokeText}>
              BunkMate is completely free and will always be!
            </Text>
            <Text style={styles.githubText}>
              However, if you'd like to support the development of this app,
              you're welcome to contribute on GitHub or star the repository!{" "}
              <AntDesign name="star" size={16} color={colors.warning} />
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleClose}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.contributionButton]}
              onPress={handleContribute}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Visit GitHub
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
