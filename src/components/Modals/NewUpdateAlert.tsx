import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Linking,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useThemeStore } from "../../state/themeStore";

const { width } = Dimensions.get("screen");

const UPDATE_URL = process.env.EXPO_PUBLIC_OVERVIEW_URL as string | undefined;

const NewUpdateAlertModal = ({
    defaultVisible = true
}) => {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((state) => state.colors);

  const [isVisible, setIsVisible] = React.useState(defaultVisible);
  const onClose = () => setIsVisible(false);

  const handleUpdatePress = async () => {
    await Linking.openURL(UPDATE_URL + "/#download");
  };

  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
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
            { backgroundColor: colors.background + "80" },
          ]}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Fresh update is here!
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            New features and improvements await! Updating now ensures you'll
            stay compatible with all upcoming enhancements.
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.cta,
                {
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                },
              ]}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Remind me later"
            >
              <MaterialIcons name="watch-later" size={18} color={colors.text} />
              <Text style={[styles.ctaText, { color: colors.text }]}>
                Later
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpdatePress}
              style={[styles.cta, { backgroundColor: colors.primary }]}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Update now"
            >
              <Ionicons name="rocket" size={18} color={colors.text} />
              <Text style={[styles.ctaText, { color: colors.text }]}>
                Update now
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.legal, { color: colors.textSecondary }]}>
            Psst… not updating means you won't be eligible for new improvements
            that roll out next.
          </Text>
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
  closeBtnLeft: {},
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
