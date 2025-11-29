import { create } from "zustand";
import { kvHelper } from "../kv/kvStore";

export interface PfpState {
  uri: string | null;
  setUri: (uri: string) => void;
  initialize: () => Promise<void>;
}

export const usePfpStore = create<PfpState>((set, get) => ({
  uri: null,
  setUri: (uri) => {
    if (uri && uri.trim()) {
      kvHelper.setPfpUri(uri);
      set({ uri });
    } else {
      kvHelper.clearPfpUri();
      set({ uri: null });
    }
  },
  initialize: async () => {
    const uri = kvHelper.getPfpUri();
    if (uri) {
      // Import the validation function dynamically to avoid circular imports
      const { validatePfpUri } = require("../utils/pfpUtil");
      const isValid = await validatePfpUri(uri);
      if (isValid) {
        set({ uri });
      } else {
        // Clear invalid URI
        kvHelper.clearPfpUri();
        set({ uri: null });
        console.log("Profile picture file no longer exists, clearing URI");
      }
    } else {
      set({ uri });
    }
  },
}));
