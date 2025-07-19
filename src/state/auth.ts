import { create } from "zustand";
import { User, LoginRequest } from "../types/api";
import { authService } from "../api/auth";
import { kvHelper } from "../kv/kvStore";

interface AuthState {
  user: User | null;
  name: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasShownSubscriptionModal: boolean;

  // Login flow state
  isUsernameVerified: boolean;
  verifiedUsername: string | null;

  // Actions
  lookupUsername: (username: string) => Promise<string[]>;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: (callback?: () => Promise<void>) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  resetLoginFlow: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  name: null,
  isLoading: false,
  error: null,
  isUsernameVerified: false,
  verifiedUsername: null,
  hasShownSubscriptionModal: false,

  lookupUsername: async (username: string) => {
    set({ isLoading: true, error: null });

    try {
      const { users } = await authService.lookupUsername(username);

      if (users.length > 0) {
        set({
          isUsernameVerified: true,
          verifiedUsername: users[0], // Use first username
          isLoading: false,
          error: null,
        });
        return users;
      } else {
        set({
          isUsernameVerified: false,
          verifiedUsername: null,
          isLoading: false,
          error: "Username not found",
        });
        throw new Error("Username not found");
      }
    } catch (error: any) {
      set({
        isUsernameVerified: false,
        verifiedUsername: null,
        isLoading: false,
        error: error.message || "Username lookup failed",
      });
      throw error;
    }
  },

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });

    try {
      await authService.login(credentials);

      // After successful login, fetch user data
      const { user, first_name, last_name } =
        await authService.getCurrentUser();

      set({
        user,
        name: `${first_name || ""} ${last_name || ""}`,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || "Login failed",
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });

    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout error:", error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isUsernameVerified: false,
        verifiedUsername: null,
      });
    }
  },

  checkAuthStatus: async (cb) => {
    set({
      isLoading: true,
      hasShownSubscriptionModal: kvHelper.hasSubscriptionModalBeenShown(),
    });
    try {
      const isAuthenticated = await authService.isAuthenticated();

      if (isAuthenticated) {
        // Fetch user data if authenticated
        const { user, first_name, last_name } =
          await authService.getCurrentUser();
        set({
          user,
          name: `${first_name} ${last_name}`,
          isAuthenticated: true,
          isLoading: false,
        });
        await cb?.();
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: "Failed to check authentication status",
      });
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });

    try {
      const { user, first_name, last_name } =
        await authService.getCurrentUser();
      set({
        user,
        name: `${first_name || ""} ${last_name || ""}`,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to fetch user data",
      });
    }
  },

  clearError: () => set({ error: null }),

  resetLoginFlow: () =>
    set({
      isUsernameVerified: false,
      verifiedUsername: null,
      error: null,
    }),
}));
