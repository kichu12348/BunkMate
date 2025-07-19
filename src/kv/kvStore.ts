import Storage from "expo-sqlite/kv-store";

class KVStore {
  set(key: string, value: any): void {
    if (
      typeof value === "undefined" ||
      value === null ||
      typeof value !== "string"
    ) {
      console.warn(`Attempted to set undefined or null string value for key: ${key}`);
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

export const kvHelper = {
  // Auth tokens
  setAuthToken(token: string): void {
    tokenStore.set("access_token", token);
  },

  getAuthToken(): string | null {
    return tokenStore.get<string>("access_token");
  },

  clearAuthToken(): void {
    tokenStore.delete("access_token");
  },

  // User preferences
  setThemeMode(mode: "light" | "dark"): void {
    themeStore.set("mode", mode);
  },

  getThemeMode(): "light" | "dark" | null {
    return themeStore.get<"light" | "dark">("mode");
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

  // Subscription modal tracking
  setSubscriptionModalShown(): void {
    settingsStore.set("subscription_modal_shown", "true");
  },

  hasSubscriptionModalBeenShown(): boolean {
    return settingsStore.get<string>("subscription_modal_shown") === "true";
  },

  resetSubscriptionModal(): void {
    settingsStore.delete("subscription_modal_shown");
  },
};
