import { create } from "zustand";
import {
  getAllAccounts,
  insertAccount,
  deleteAccount,
  getAccount,
  deleteAllAccounts,
  getAccountByUsername,
} from "../db/accountsDb";
import type { Account } from "../db/accountsDb";
import { kvHelper } from "../kv/kvStore";
import { useAuthStore } from "./auth";
import { useAttendanceStore } from "./attendance";
import { useNotificationsStore } from "./notifications";
import { useSurveysStore } from "./surveys";

async function reInitAllStores() {
  const { checkAuthStatus, clearData } = useAuthStore.getState();
  clearData();
  await checkAuthStatus();
  const { fetchAttendance, clearAttendanceData } =
    useAttendanceStore.getState();
  clearAttendanceData();
  fetchAttendance();
  const { clearNotifications } = useNotificationsStore.getState();
  clearNotifications();
  const { clearSurveys, fetchSurveys } = useSurveysStore.getState();
  clearSurveys();
  fetchSurveys();
}

interface AccountsState {
  accounts: Account[];
  currentAccountId: number | null;
  initialised: boolean;
  loading: boolean;
  isSwitching: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  initAccounts: () => Promise<void>;
  addAccount: (name: string, username: string, token: string) => Promise<void>;
  checkAccountExists: (username: string) => Promise<Account | null>;
  removeAccount: (id: number) => Promise<void>;
  updateAccount: (id: number, name: string, token: string) => Promise<void>;
  switchAccount: (
    id: number,
    cb?: (switched: boolean) => void,
  ) => Promise<void>;
  getCurrentAccount: () => Promise<Account | null>;
  logout: () => Promise<void>;
  removeAllAccounts: () => Promise<void>;
  backwardCompact: (
    name: string,
    username: string,
    token: string,
  ) => Promise<void>;
}

const useAccountStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,
  isSwitching: false,
  initialised: false,
  error: null,
  currentAccountId: null,
  initAccounts: async () => {
    if (get().initialised) return;
    const rawId = kvHelper.getAccounts();

    const id = rawId ? rawId : null;
    const accounts = await getAllAccounts();
    set({ currentAccountId: id, accounts, initialised: true });
  },
  loadAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const accounts = await getAllAccounts();
      set({ accounts, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  addAccount: async (name, username, token) => {
    set({ loading: true, error: null });
    try {
      const existingAccount = await getAccountByUsername(username);
      if (existingAccount) {
        set({ error: "Account already exists", loading: false });
        return;
      }
      const account = await insertAccount(name, username, token);
      kvHelper.setAccounts(account.id);
      set({
        accounts: [...get().accounts, account],
        loading: false,
        currentAccountId: account.id,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  checkAccountExists: async (username) => {
    try {
      const account = await getAccountByUsername(username);
      return account;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
  removeAccount: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteAccount(id);
      set({
        accounts: get().accounts.filter((account) => account.id !== id),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  updateAccount: async (id, name, token) => {
    set({ loading: true, error: null });
    try {
      const existing = await getAccount(id);
      if (!existing) {
        set({ error: "Account not found", loading: false });
        return;
      }
      set({
        accounts: get().accounts.map((account) =>
          account.id === id ? { ...account, name, token } : account,
        ),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  switchAccount: async (id, cb) => {
    if (get().currentAccountId === id) {
      cb?.(false);
      return;
    }
    set({ isSwitching: true, error: null });
    try {
      const account = await getAccount(id);
      if (!account) {
        set({ error: "Account not found", isSwitching: false });
        cb?.(false);
        return;
      }
      kvHelper.setAccounts(account.id);
      kvHelper.setAuthToken(account.token);
      await reInitAllStores();
      set({
        currentAccountId: account.id,
        isSwitching: false,
      });
      cb?.(true);
    } catch (error: any) {
      set({ error: error.message, isSwitching: false });
    }
  },
  getCurrentAccount: async () => {
    const id = kvHelper.getAccounts();
    if (!id) {
      return null;
    }
    return getAccount(id);
  },
  logout: async () => {
    try {
      const { currentAccountId, removeAccount } = get();
      if (currentAccountId) {
        kvHelper.clearAccounts();
        await removeAccount(currentAccountId);
      }
      set({ currentAccountId: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  removeAllAccounts: async () => {
    try {
      await deleteAllAccounts();
      set({ accounts: [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  backwardCompact: async (name, username, token) => {
    if (!name || !username || !token) {
      return;
    }
    try {
      const existingAccount = await getAccountByUsername(username);
      if (existingAccount) {
        return;
      }
      const account = await insertAccount(name, username, token);
      kvHelper.setAccounts(account.id);
      set({
        accounts: [
          ...get().accounts.filter((account) => account.id !== account.id),
          account,
        ],
        loading: false,
        currentAccountId: account.id,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useAccountStore;
