import Storage from "expo-sqlite/kv-store";
import {
  AUTH_ACCESS_TOKEN,
  INSIGHTS_LOGGED,
  PFP_URL,
  SUBSCRIPTION_MODAL_SHOWN,
  THEME_MODE,
  ACCOUNTS_KEY,
  UPDATE_TIME,
} from "../constants/config";

class KVStore {
  set(key: string, value: any): void {
    if (
      typeof value === "undefined" ||
      value === null ||
      typeof value !== "string"
    ) {
      console.warn(
        `Attempted to set undefined or null string value for key: ${key}`,
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
const tokenStore = new KVStore();
const settingsStore = new KVStore();
const insightsStore = new KVStore();
const pfpStore = new KVStore();

let localToken: string | null;
let timeoutId: number | null = null;

export const kvHelper = {
  // Auth tokens
  setAuthToken(token: string): void {
    tokenStore.set(AUTH_ACCESS_TOKEN, token);
    localToken = token;
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

  updateLocalToken(token: string): void {
    localToken = token;
  },

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

  async setThemeMode(mode: "light" | "dark"): Promise<void> {
    await Storage.setItemAsync(THEME_MODE, mode);
  },

  getThemeMode(): "light" | "dark" | null {
    return Storage.getItemSync(THEME_MODE) as "light" | "dark" | null;
  },

  setPfpUri(uri: string, accountId?: number | null): void {
    const key = accountId ? `${PFP_URL}_${accountId}` : PFP_URL;
    pfpStore.set(key, uri);
  },

  clearPfpUri(accountId?: number | null): void {
    const key = accountId ? `${PFP_URL}_${accountId}` : PFP_URL;
    pfpStore.delete(key);
  },

  getPfpUri(accountId?: number | null): string | null {
    if (accountId) {
      const accountSpecific = pfpStore.get<string>(`${PFP_URL}_${accountId}`);
      if (accountSpecific) return accountSpecific;
    }
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

  setAccounts(id: number): void {
    settingsStore.set(ACCOUNTS_KEY, id.toString());
  },

  getAccounts(): number | null {
    const raw = settingsStore.get<string>(ACCOUNTS_KEY);
    if (!raw) return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  },

  clearAccounts(): void {
    settingsStore.delete(ACCOUNTS_KEY);
  },

  setUpdateTime(time: string): void {
    settingsStore.set(UPDATE_TIME, time);
  },

  getUpdateTime(): string | null {
    return settingsStore.get<string>(UPDATE_TIME);
  },

  clearUpdateTime(): void {
    settingsStore.delete(UPDATE_TIME);
  },
};
