import { create } from "zustand";
import { kvHelper } from "../kv/kvStore";

export interface PfpState {
  uri: string | null;
  setUri: (uri: string) => void;
  initialize: () => void;
}

export const usePfpStore = create<PfpState>((set) => ({
  uri: null,
  setUri: (uri) => {
    kvHelper.setPfpUri(uri);
    set({ uri });
  },
  initialize: () => {
    const uri = kvHelper.getPfpUri();
    set({ uri });
  },
}));
