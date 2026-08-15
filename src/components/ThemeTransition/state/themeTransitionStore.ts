import { create } from "zustand";
import { ThemeTransitionStoreState, TransitionOrigin } from "../types";
import { captureViewSnapshot } from "../utils/viewSnapshot";
import { useThemeStore } from "../../../state/themeStore";

export const useThemeTransitionStore = create<ThemeTransitionStoreState>(
  (set, get) => ({
    isTransitioning: false,
    snapshot: null,
    origin: null,
    rootViewRef: null,

    setRootViewRef: (ref) => {
      set({ rootViewRef: ref });
    },

    toggleModeWithTransition: async (origin?: TransitionOrigin) => {
      const state = get();
      if (state.isTransitioning) {
        return;
      }

      set({ isTransitioning: true });

      const snapshot = await captureViewSnapshot(state.rootViewRef);

      if (!snapshot) {
        // Fallback: If snapshot capture fails, switch theme directly
        useThemeStore.getState().toggleMode();
        set({ isTransitioning: false, snapshot: null, origin: null });
        return;
      }

      // Store snapshot & origin, then toggle theme underneath
      set({
        snapshot,
        origin: origin ?? null,
      });

      // Instantly switch theme in Zustand store
      await useThemeStore.getState().toggleMode();
    },

    endTransition: () => {
      set({
        isTransitioning: false,
        snapshot: null,
        origin: null,
      });
    },
  }),
);
