import React, { useEffect } from "react";
import { View, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import Text from "../../components/UI/Text";
import useAccountStore from "../../state/accounts";
import useKtuGradeStore from "../../state/ktuGrades";

import { createStyles } from "./styles";
import { LoginView } from "./LoginView";
import { GradeResultsView } from "./GradeResultsView";

type KtuGradeCardNavProp = NativeStackNavigationProp<RootStackParamList>;

export function KtuGradeCardScreen({
  navigation,
}: {
  navigation: KtuGradeCardNavProp;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const currentAccountId = useAccountStore((s) => s.currentAccountId);

  const credentialsLoaded = useKtuGradeStore((s) => s.credentialsLoaded);
  const hasSavedCredentials = useKtuGradeStore((s) => s.hasSavedCredentials);
  const loadCachedCredentials = useKtuGradeStore(
    (s) => s.loadCachedCredentials,
  );
  const disconnectKtu = useKtuGradeStore((s) => s.disconnectKtu);

  // Load cached credentials on mount
  useEffect(() => {
    if (currentAccountId) {
      loadCachedCredentials(currentAccountId);
    } else {
      // No account — nothing to load, just proceed to login form
      useKtuGradeStore.setState({ credentialsLoaded: true });
    }
  }, [currentAccountId, loadCachedCredentials]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>KTU Results</Text>
        {hasSavedCredentials && (
          <TouchableOpacity
            onPress={disconnectKtu}
            activeOpacity={0.7}
            style={styles.logoutButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {!credentialsLoaded ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={"large"} color={colors.primary} />
        </View>
      ) : !hasSavedCredentials ? (
        <LoginView />
      ) : (
        <GradeResultsView />
      )}
    </View>
  );
}
