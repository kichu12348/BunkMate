import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useThemeStore } from "../../state/themeStore";
import { useUpdateStore } from "../../state/updateStore";
import Text from "../UI/Text";

const { width } = Dimensions.get("screen");

interface NewUpdateAlertModalProps {
  visible: boolean;
}

const NewUpdateAlertModal = ({ visible }: NewUpdateAlertModalProps) => {
  const { isVisible, forceUpdate, downloadUrl, checkForUpdate, dismissModal } =
    useUpdateStore();

  const insets = useSafeAreaInsets();
  const colors = useThemeStore((state) => state.colors);

  useEffect(() => {
    if (visible) checkForUpdate();
  }, []);

  if (!visible) return null;

  const handleUpdatePress = async () => {
    if (downloadUrl) {
      await Linking.openURL(downloadUrl);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
      // Prevent dismissal by back button when forceUpdate is true
      onRequestClose={forceUpdate ? undefined : dismissModal}
    >
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: colors.background + (forceUpdate ? "EF" : "80"),
            },
          ]}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
              borderColor: forceUpdate ? colors.danger : "transparent",
            },
            forceUpdate && styles.cardDanger,
          ]}
        >
          {forceUpdate && (
            <View
              style={[
                styles.forceBadge,
                { backgroundColor: colors.danger + "22" },
              ]}
            >
              <Ionicons name="warning" size={14} color={colors.danger} />
              <Text style={[styles.forceBadgeText, { color: colors.danger }]}>
                Required update
              </Text>
            </View>
          )}

          <Text style={[styles.title, { color: colors.text }]}>
            {forceUpdate
              ? "Update required to continue"
              : "Fresh update is here!"}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {forceUpdate
              ? "This version of BunkMate is no longer supported. Please update to continue using the app."
              : "New features and improvements await! Updating now ensures you stay compatible with all upcoming enhancements."}
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            {!forceUpdate && (
              <TouchableOpacity
                onPress={dismissModal}
                style={[
                  styles.cta,
                  {
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    borderStyle: "dashed",
                  },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Remind me later"
              >
                <MaterialIcons
                  name="watch-later"
                  size={18}
                  color={colors.text}
                />
                <Text style={[styles.ctaText, { color: colors.text }]}>
                  Later
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleUpdatePress}
              style={[
                styles.cta,
                {
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Update now"
            >
              <Ionicons
                name={forceUpdate ? "warning" : "rocket"}
                size={18}
                color={colors.text}
              />
              <Text style={[styles.ctaText, { color: colors.text }]}>
                Update now
              </Text>
            </TouchableOpacity>
          </View>

          {!forceUpdate && (
            <Text style={[styles.legal, { color: colors.textSecondary }]}>
              Psst… not updating means you won't be eligible for new
              improvements that roll out next.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default NewUpdateAlertModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: Math.min(width * 0.9, 420),
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  cardDanger: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  forceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  forceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  cta: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
  },
  legal: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    opacity: 0.8,
  },
});
