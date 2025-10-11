import Storage from "expo-sqlite/kv-store";
import { AUTH_ACCESS_TOKEN, INSIGHTS_LOGGED, PFP_URL, SUBSCRIPTION_MODAL_SHOWN, THEME_MODE } from "../constants/config";

class KVStore {
  set(key: string, value: any): void {
    if (
      typeof value === "undefined" ||
      value === null ||
      typeof value !== "string"
    ) {
      console.warn(
        `Attempted to set undefined or null string value for key: ${key}`
      );
      return;
    }
    Storage.setItemSync(key, value);
  }

  get<T = any>(key: string): T | null {
    const value = Storage.getItemSync(key);
    if (value === null) {
      return null;
    }
    try {
      return value as T;
    } catch (error) {
      console.error(`Error parsing KV value for key ${key}:`, error);
      return null;
    }
  }

  delete(key: string): void {
    Storage.removeItemSync(key);
  }

  clear(): void {
    Storage.clearSync();
  }

  getAllKeys(): string[] {
    return Storage.getAllKeysSync();
  }

  has(key: string): boolean {
    return Storage.getItemSync(key) !== null;
  }
}

// Create namespace instances
export const tokenStore = new KVStore();
export const themeStore = new KVStore();
export const userStore = new KVStore();
export const settingsStore = new KVStore();
export const insightsStore = new KVStore();
export const pfpStore = new KVStore();

let localToken: string | null;
let timeoutId: NodeJS.Timeout | null = null;

export const kvHelper = {
  // Auth tokens
  setAuthToken(token: string): void {
    tokenStore.set(AUTH_ACCESS_TOKEN, token);
  },

  setInsightsLogged(code: string): void {
    insightsStore.set(INSIGHTS_LOGGED, code);
  },

  getInsightsLogged(): string | null {
    return insightsStore.get<string>(INSIGHTS_LOGGED);
  },

  // removeInsightsLogged(): void {
  //   insightsStore.delete(INSIGHTS_LOGGED);
  // },

  getAuthToken(): string | null {
    if (localToken) return localToken;
    const token = tokenStore.get<string>(AUTH_ACCESS_TOKEN);
    localToken = token;
    return token;
  },

  clearAuthToken(): void {
    tokenStore.delete(AUTH_ACCESS_TOKEN);
    localToken = null;
  },

  setThemeMode(mode: "light" | "dark"): void {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      themeStore.set(THEME_MODE, mode);
    }, 300);
  },

  getThemeMode(): "light" | "dark" | null {
    return themeStore.get<"light" | "dark">(THEME_MODE);
  },

  // Settings
  setSetting(key: string, value: any): void {
    settingsStore.set(key, JSON.stringify(value));
  },

  getSetting<T = any>(key: string): T | null {
    const value = settingsStore.get<string>(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing setting for key ${key}:`, error);
      return null;
    }
  },

  setPfpUri(uri: string): void {
    pfpStore.set(PFP_URL, uri);
  },
  
  clearPfpUri(): void {
    pfpStore.delete(PFP_URL);
  },
  
  getPfpUri(): string | null {
    return pfpStore.get<string>(PFP_URL);
  },

  // Subscription modal tracking
  setSubscriptionModalShown(): void {
    settingsStore.set(SUBSCRIPTION_MODAL_SHOWN, "true");
  },

  hasSubscriptionModalBeenShown(): boolean {
    return settingsStore.get<string>(SUBSCRIPTION_MODAL_SHOWN) === "true";
  },

  resetSubscriptionModal(): void {
    settingsStore.delete(SUBSCRIPTION_MODAL_SHOWN);
  },
};
