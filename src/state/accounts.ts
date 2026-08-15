import { create } from "zustand";
import {
  getAllAccounts,
  insertAccount,
  deleteAccount,
  getAccount,
  deleteAllAccounts,
  getAccountByUsername,
  updateAccount as updateAccountDb,
  upsertAccount,
} from "../db/accountsDb";
import type { Account } from "../db/accountsDb";
import { kvHelper } from "../kv/kvStore";
import { useAuthStore } from "./auth";
import { useAttendanceStore } from "./attendance";
import { useNotificationsStore } from "./notifications";
import { useSurveysStore } from "./surveys";
import { useDutyLeaveStore } from "./dutyLeave";
import { useAssignmentStore } from "./assignments";
import { useChatStore } from "./chat";
import { usePfpStore } from "./pfpStore";
import useKtuGradeStore from "./ktuGrades";

async function reInitAllStores() {
  const { checkAuthStatus } = useAuthStore.getState();
  await checkAuthStatus();

  const { fetchAttendance, clearAttendanceData } =
    useAttendanceStore.getState();
  clearAttendanceData();
  fetchAttendance();

  const { clearNotifications, fetchNotifications } =
    useNotificationsStore.getState();
  clearNotifications();
  fetchNotifications(true);

  const { clearSurveys, fetchSurveys } = useSurveysStore.getState();
  clearSurveys();
  fetchSurveys();

  const { clearDutyLeaves, fetchDutyLeaves } = useDutyLeaveStore.getState();
  clearDutyLeaves();
  fetchDutyLeaves();

  const { clearAssignments, fetchAssignments } = useAssignmentStore.getState();
  clearAssignments();
  fetchAssignments();

  const { clearMessages } = useChatStore.getState();
  clearMessages();

  const { initialize: initPfp } = usePfpStore.getState();
  initPfp();

  // Reset KTU session state so old session doesn't linger
  useKtuGradeStore.setState({
    credentialsLoaded: false,
    hasSavedCredentials: false,
    accountId: null,
    ktuLoginId: null,
    isLoggedIn: false,
    gradeCard: null,
    fetchError: null,
    loginError: null,
    fromCache: false,
    username: "",
    password: "",
  });
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
      const account = await upsertAccount(name, username, token);
      kvHelper.setAccounts(account.id);
      kvHelper.setAuthToken(token);

      const accounts = await getAllAccounts();
      set({
        accounts,
        loading: false,
        currentAccountId: account.id,
      });

      await reInitAllStores();
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
      await updateAccountDb(id, name, token);
      const accounts = await getAllAccounts();
      set({
        accounts,
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
    const previousAccountId = get().currentAccountId;
    const previousToken = kvHelper.getAuthToken();

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

      try {
        await reInitAllStores();
      } catch (authErr: any) {
        // Roll back to previous account if switch failed
        if (previousAccountId && previousToken) {
          kvHelper.setAccounts(previousAccountId);
          kvHelper.setAuthToken(previousToken);
          try {
            await reInitAllStores();
          } catch {
            // ignore
          }
        }
        set({
          error:
            authErr?.message ||
            "Failed to switch account. Session may have expired.",
          isSwitching: false,
        });
        cb?.(false);
        return;
      }

      set({
        currentAccountId: account.id,
        isSwitching: false,
      });
      cb?.(true);
    } catch (error: any) {
      set({ error: error.message, isSwitching: false });
      cb?.(false);
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
      set({ accounts: [], loading: false, currentAccountId: null });
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
        kvHelper.setAccounts(existingAccount.id);
        set({ currentAccountId: existingAccount.id });
        return;
      }
      const account = await insertAccount(name, username, token);
      kvHelper.setAccounts(account.id);
      const accounts = await getAllAccounts();
      set({
        accounts,
        loading: false,
        currentAccountId: account.id,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useAccountStore;
