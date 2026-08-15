import { create } from "zustand";
import { kvHelper } from "../kv/kvStore";

export interface PfpState {
  uri: string | null;
  setUri: (uri: string, accountId?: number | null) => void;
  initialize: (accountId?: number | null) => Promise<void>;
  clearUri: () => void;
}

export const usePfpStore = create<PfpState>((set) => ({
  uri: null,
  setUri: (uri, accountId) => {
    const accId = accountId ?? kvHelper.getAccounts();
    if (uri && uri.trim()) {
      kvHelper.setPfpUri(uri, accId);
      set({ uri });
    } else {
      kvHelper.clearPfpUri(accId);
      set({ uri: null });
    }
  },
  initialize: async (accountId) => {
    const accId = accountId ?? kvHelper.getAccounts();
    const uri = kvHelper.getPfpUri(accId);
    if (uri) {
      // Import the validation function dynamically to avoid circular imports
      const { validatePfpUri } = require("../utils/pfpUtil");
      const isValid = await validatePfpUri(uri);
      if (isValid) {
        set({ uri });
      } else {
        // Clear invalid URI
        kvHelper.clearPfpUri(accId);
        set({ uri: null });
      }
    } else {
      set({ uri: null });
    }
  },
  clearUri: () => set({ uri: null }),
}));
