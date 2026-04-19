import React, { useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ThemeColors } from "../../types/theme";
import { useTheme } from "../../hooks/useTheme";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import useAccountStore from "../../state/accounts";
import type { Account } from "../../db/accountsDb";
import { useToastStore } from "../../state/toast";
import Text from "../../components/UI/Text";
import { CustomLoader } from "../../components/UI/RefreshLoader";
import { SharedValue } from "react-native-reanimated";

type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SwitchAccountsScreen({
  navigation,
}: {
  navigation: RootNavigationProp;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);
  const {
    accounts,
    initAccounts,
    loading,
    removeAccount,
    currentAccountId,
    switchAccount,
    isSwitching,
  } = useAccountStore();
  const { showToast } = useToastStore();

  const handleSwitching = async (id: number) => {
    await switchAccount(id);
    // Only go back if the switch succeeded (no error in store)
    const { error } = useAccountStore.getState();
    if (error) {
      showToast({
        title: "Switch Failed",
        message: error,
        buttons: [{ text: "OK", style: "cancel" }],
      });
    }
  };

  useEffect(() => {
    initAccounts();
  }, []);

  const handleRemoveAccount = (id: number, name: string) => {
    showToast({
      title: "Remove Account",
      message: `Are you sure you want to remove "${name}"?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeAccount(id),
        },
      ],
    });
  };

  const handleSwitchAccount = (id: number, name: string) => {
    if (id === currentAccountId || isSwitching) return;
    showToast({
      title: "Switch Account",
      message: `Switch to "${name}"?`,
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          style: "default",
          onPress: () => handleSwitching(id),
        },
      ],
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: Account }) => {
      const isActive = item.id === currentAccountId;
      return (
        <View>
          <TouchableOpacity
            style={[styles.accountItem, isActive && styles.activeAccount]}
            onPress={() => handleSwitchAccount(item.id, item.name)}
            disabled={isActive}
            activeOpacity={0.7}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatarContainer,
                isActive && styles.avatarContainerActive,
              ]}
            >
              <Ionicons
                name="person"
                size={20}
                color={isActive ? "white" : colors.primary}
              />
              {isActive && <View style={styles.activeDot} />}
            </View>

            {/* Info */}
            <View style={styles.accountInfo}>
              <View style={styles.accountNameRow}>
                <Text style={styles.accountName}>{item.name}</Text>
                {isActive && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </View>
              <Text style={styles.accountSubtitle}>
                {isActive
                  ? "Currently signed in"
                  : "Tap to switch to this account"}
              </Text>
            </View>

            {/* Actions */}
            {isActive ? (
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.primary}
              />
            ) : (
              <TouchableOpacity
                onPress={() => handleRemoveAccount(item.id, item.name)}
                activeOpacity={0.7}
                style={styles.trashButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [accounts, currentAccountId, colors, styles],
  );

  const ListHeader = (
    <>
      {/* Add Account Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="add-circle-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Add Account</Text>
        </View>

        <View style={[styles.card, styles.addCard]}>
          <TouchableOpacity
            style={styles.addAccountItem}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate("LoginNewAccount");
            }}
          >
            <View style={styles.addIconContainer}>
              <AntDesign name="user-add" size={22} color={colors.primary} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.settingTitle}>Add another account</Text>
              <Text style={styles.settingSubtitle}>
                Sign in with a different account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Note */}
      <View style={styles.infoBox}>
        <Ionicons name="warning-outline" size={18} color={colors.warning} />
        <Text style={styles.infoText}>
          Please Report Any Errors to the Developer through the Forum or through
          Github Issues.
        </Text>
      </View>

      {/* Saved Accounts Section Header */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="account-multiple"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.sectionTitle}>Saved Accounts</Text>
      </View>

      {/* Loading / Empty states live inside the card above FlatList items */}
      {loading && (
        <View style={[styles.card, styles.stateCard]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading accounts…</Text>
          </View>
        </View>
      )}

      {!loading && accounts.length === 0 && (
        <View style={[styles.card, styles.stateCard]}>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons
                name="person-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No saved accounts</Text>
            <Text style={styles.emptySubtitle}>
              Add an account above to switch between profiles
            </Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Switch Accounts</Text>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        ListHeaderComponentStyle={styles.listHeaderStyle}
      />

      {/* Switching overlay */}
      {isSwitching && (
        <View style={styles.switchingOverlay}>
          <View style={styles.switchingCard}>
            <CustomLoader
              size={2}
              pullProgress={{ value: 1 } as SharedValue<number>}
            />
            <Text style={styles.switchingTitle}>Switching Account</Text>
            <Text style={styles.switchingSubtitle}>
              Please wait while we load your account…
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Fixed top header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      gap: 12,
    },
    backButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.4,
    },

    // FlatList
    listContent: {
      paddingTop: 8,
      gap: 20,
    },
    listHeaderStyle: {
      marginBottom: 0,
    },

    // Section
    section: {
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    // Generic card
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderRadius: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      marginBottom: 12,
      overflow: "hidden",
    },
    addCard: {
      borderWidth: 1,
      borderColor: colors.primary + "30",
    },
    // Card used for loading / empty state
    stateCard: {
      marginBottom: 0,
    },

    // Account row (FlatList items share the same card background)
    accountItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 72,
      gap: 14,
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
    },
    activeAccount: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    avatarContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarContainerActive: {
      backgroundColor: colors.primary,
    },
    activeDot: {
      position: "absolute",
      bottom: 1,
      right: 1,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#22c55e",
      borderWidth: 2,
      borderColor: colors.surface,
    },
    accountInfo: {
      flex: 1,
      gap: 3,
    },
    accountNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: 0.2,
    },
    accountSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    activeBadge: {
      backgroundColor: colors.primary + "18",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    activeBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 0.4,
    },
    trashButton: {
      padding: 4,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border + "20",
      marginLeft: 94,
    },

    // States
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 36,
      paddingHorizontal: 24,
      gap: 10,
    },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },

    // Add Account
    addAccountItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 64,
      gap: 14,
    },
    addIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.primary + "12",
      alignItems: "center",
      justifyContent: "center",
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      letterSpacing: 0.2,
    },
    settingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // Info note
    infoBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: colors.warning + "10",
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 20,
    },

    // Switching overlay
    switchingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },
    switchingCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingVertical: 36,
      paddingHorizontal: 40,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      borderWidth: 1.5,
      borderColor: colors.primary,
      borderStyle: "dashed",
      minWidth: 240,
    },
    switchingIconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    switchingTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: 0.3,
    },
    switchingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
  });
