import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNotificationsStore } from "../../state/notifications";
import { useThemedStyles } from "../../hooks/useTheme";
import { ThemeColors } from "../../types/theme";
import { Notification } from "../../api/notifications";
import { formatDistanceToNow } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useThemeStore } from "../../state/themeStore";
import { useToastStore } from "../../state/toast";
import Text from "../../components/UI/Text";

interface NotificationItemProps {
  notification: Notification;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
}) => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return colors.success;
      case "warning":
        return colors.warning;
      case "error":
        return colors.error;
      default:
        return colors.info;
    }
  };

  return (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTitleRow}>
          <Ionicons
            name={"notifications-outline"}
            size={20}
            color={getTypeColor("")}
            style={styles.notificationIcon}
          />
          <Text
            style={[
              styles.notificationTitle,
              !notification.read_at && styles.unreadTitle,
            ]}
          >
            {notification.type.split("\\").pop()}
          </Text>
        </View>
        <Text style={styles.notificationTime}>
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </Text>
      </View>

      <Text style={styles.notificationMessage} numberOfLines={2}>
        {notification.data}
      </Text>
    </View>
  );
};

export const NotificationsScreen: React.FC = () => {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeStore((state) => state.colors);
  const insets = useSafeAreaInsets();
  const bottomBarHeight = useBottomTabBarHeight();

  const {
    notifications,
    unreadCount,
    error,
    hasMore,
    fetchNotifications,
    markAllAsRead,
    loadMore,
  } = useNotificationsStore();

  const showToast = useToastStore((state) => state.showToast);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    setRefreshing(false);
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    showToast({
      title: "Notifications Updated",
      message: "All notifications have been marked as read.",
      buttons: [{ text: "OK", style: "destructive" }],
    });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem notification={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You're all caught up! Check back later for new notifications.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore || notifications.length === 0) return null;

    return (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.error}
          />
          <Text style={styles.errorTitle}>Error Loading Notifications</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchNotifications(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: bottomBarHeight + 24 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.textSecondary}
            progressBackgroundColor={colors.background}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    markAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.primary,
    },
    markAllButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "600",
    },
    unreadBanner: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    unreadText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    listContainer: {
      flexGrow: 1,
    },
    notificationItem: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 12,
      padding: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    unreadNotification: {
      backgroundColor: colors.surface,
      borderColor: colors.primary + "20",
      borderWidth: 1,
    },
    notificationHeader: {
      marginBottom: 8,
    },
    notificationTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    notificationIcon: {
      marginRight: 8,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    unreadTitle: {
      fontWeight: "700",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    disabledText: {
      color: colors.success,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    footerContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 16,
    },
    footerText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    retryButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "600",
    },
  });
