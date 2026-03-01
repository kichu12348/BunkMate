import { create } from "zustand";
import { notificationsService, Notification } from "../api/notifications";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  // Actions
  fetchNotifications: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setError: (error: string | null) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    page: 1,
    hasMore: true,

    fetchNotifications: async (refresh = false) => {
      const state = get();

      if (state.isLoading) return;

      set({ isLoading: true, error: null });

      try {
        const response = await notificationsService.getNotifications();

        const newNotifications = refresh
          ? response
          : [...state.notifications, ...response];

        set({
          notifications: newNotifications,
          page: refresh ? 2 : state.page + 1,
          hasMore: response.length === 20,
          isLoading: false,
        });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch notifications",
          isLoading: false,
        });
      }
    },

    loadMore: async () => {
      const state = get();
      if (!state.hasMore || state.isLoading) return;

      await get().fetchNotifications(false);
    },

    setError: (error: string | null) => {
      set({ error });
    },

    clearNotifications: () => {
      set({
        notifications: [],
        unreadCount: 0,
        page: 1,
        hasMore: true,
        error: null,
      });
    },
  }),
);
