import { create } from "zustand";
import {
  getAllAccounts,
  insertAccount,
  deleteAccount,
  getAccount,
} from "../db/accountsDb";
import type { Account } from "../db/accountsDb";
import { kvHelper } from "../kv/kvStore";

interface AccountsState {
  accounts: Account[];
  currentAccountId: number | null;
  loading: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  initAccounts: () => Promise<void>;
  addAccount: (name: string, token: string) => Promise<void>;
  removeAccount: (id: number) => Promise<void>;
  updateAccount: (id: number, name: string, token: string) => Promise<void>;
  getCurrentAccount: () => Promise<Account | null>;
}

const useAccountStore = create<AccountsState>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,
  currentAccountId: null,
  initAccounts: async () => {
    const id = kvHelper.getAccounts();
    const accounts = await getAllAccounts();
    set({ currentAccountId: id, accounts });
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
      set({ accounts: [...get().accounts, account], loading: false });
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
  getCurrentAccount: async () => {
    const id = kvHelper.getAccounts();
    if (!id) {
      return null;
    }
    return getAccount(id);
  },
}));

export default useAccountStore;
