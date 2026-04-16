import { create } from "zustand";
import {
  getAllAccounts,
  insertAccount,
  deleteAccount,
  getAccount,
  deleteAllAccounts,
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
  await fetchAttendance();
  const { clearNotifications } = useNotificationsStore.getState();
  clearNotifications();
  const { clearSurveys, fetchSurveys } = useSurveysStore.getState();
  clearSurveys();
  await fetchSurveys();
}

interface AccountsState {
  accounts: Account[];
  currentAccountId: number | null;
  initialised: boolean;
  loading: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  initAccounts: () => Promise<void>;
  addAccount: (name: string, token: string) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
  updateAccount: (id: number, name: string, token: string) => Promise<void>;
  switchAccount: (id: number) => Promise<void>;
  getCurrentAccount: () => Promise<Account | null>;
  logout: () => Promise<void>;
}

const useAccountStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,
  initialised: false,
  error: null,
  currentAccountId: null,
  initAccounts: async () => {
    if (get().initialised) return;
    const id = kvHelper.getAccounts();
    const accounts = await getAllAccounts();
    set({ currentAccountId: id, accounts, initialised: true });
  },
  loadAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const accounts = await getAllAccounts();
      set({ accounts, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  addAccount: async (name, token) => {
    set({ loading: true, error: null });
    try {
      const account = await insertAccount(name, token);
      kvHelper.setAccounts(account.id);
      set({
        accounts: [...get().accounts, account],
        loading: false,
        currentAccountId: account.id,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
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
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  updateAccount: async (id, name, token) => {
    set({ loading: true, error: null });
    try {
      const account = await getAccount(id);
      if (!account) {
        set({ error: "Account not found", loading: false });
        return;
      }
      account.name = name;
      account.token = token;
      set({
        accounts: get().accounts.map((account) =>
          account.id === id ? account : account,
        ),
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  switchAccount: async (id) => {
    set({ loading: true, error: null });
    try {
      const account = await getAccount(id);
      if (!account) {
        set({ error: "Account not found", loading: false });
        return;
      }
      kvHelper.setAccounts(account.id);
      kvHelper.setAuthToken(account.token);
      await reInitAllStores();
      set({
        currentAccountId: account.id,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
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
      if (get().currentAccountId) {
        await deleteAccount(get().currentAccountId);
      }
      set({ accounts: [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
  removeAllAccounts: async () => {
    try {
      await deleteAllAccounts();
      set({ accounts: [], loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useAccountStore;
