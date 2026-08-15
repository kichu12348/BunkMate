import { create } from "zustand";
import { Dimensions, View } from "react-native";
import { makeImageFromView } from "@shopify/react-native-skia";
import { ThemeTransitionStoreState, TransitionOrigin } from "../types";
import { useThemeStore } from "../../../state/themeStore";

/**
 * Calculates the distance from (x, y) to the furthest screen corner.
 * Guarantees the expanding circle fully covers the viewport.
 */
function calcMaxRadius(
  x: number,
  y: number,
  width: number,
  height: number
): number {
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(width - x, y),
    Math.hypot(x, height - y),
    Math.hypot(width - x, height - y)
  );
}

export const useThemeTransitionStore = create<ThemeTransitionStoreState>(
  (set, get) => ({
    // ── Initial state ──────────────────────────────────────────────────
    active: false,
    isTransitioning: false,
    overlay1: null,
    overlay2: null,
    circleX: 0,
    circleY: 0,
    circleRadius: 0,
    // Mirrors the current theme mode so the first render is correct
    statusBarStyle:
      useThemeStore.getState().mode === "dark"
        ? "light-content"
        : "dark-content",
    rootViewRef: null,

    // ── Root ref registration ──────────────────────────────────────────
    setRootViewRef: (ref) => set({ rootViewRef: ref }),

    // ── Core transition trigger ────────────────────────────────────────
    toggleModeWithTransition: async (origin?: TransitionOrigin) => {
      // 1. Concurrency guard
      if (get().active) return;
      set({ active: true, isTransitioning: true });

      const { width, height } = Dimensions.get("window");

      // Resolve origin — default to screen centre
      const cx = origin?.x ?? width / 2;
      const cy = origin?.y ?? height / 2;
      const radius = calcMaxRadius(cx, cy, width, height);

      set({ circleX: cx, circleY: cy, circleRadius: radius });

      const ref = get().rootViewRef;

      // ── Fallback: no ref — just toggle without animation ──
      if (!ref?.current) {
        useThemeStore.getState().toggleMode();
        set({ active: false, isTransitioning: false });
        return;
      }

      // 2. Capture snapshot of the OLD theme → overlay1
      let snapshot1 = null;
      try {
        snapshot1 = await makeImageFromView(ref as React.RefObject<View>);
      } catch (err) {
        console.warn("[ThemeTransition] overlay1 capture failed:", err);
      }

      if (!snapshot1) {
        useThemeStore.getState().toggleMode();
        set({ active: false, isTransitioning: false });
        return;
      }

      set({ overlay1: snapshot1 });

      // 3. Toggle the theme in the Zustand store
      useThemeStore.getState().toggleMode();

      // 4. Yield the event loop so React Native can commit the new UI tree
      await new Promise<void>((resolve) => setTimeout(resolve, 10));

      // 5. Capture snapshot of the NEW theme → overlay2
      let snapshot2 = null;
      try {
        snapshot2 = await makeImageFromView(ref as React.RefObject<View>);
      } catch (err) {
        console.warn("[ThemeTransition] overlay2 capture failed:", err);
      }

      if (!snapshot2) {
        // Animation cannot proceed — clean up silently
        set({ overlay1: null, active: false, isTransitioning: false });
        return;
      }

      // 6. Both snapshots ready → overlay will react and start the animation
      set({ overlay2: snapshot2 });
    },

    // ── Called by ThemeTransitionOverlay when the animation completes ──
    endTransition: () => {
      // Read the current (already-toggled) mode from the theme store
      const currentMode = useThemeStore.getState().mode;
      set({
        active: false,
        isTransitioning: false,
        overlay1: null,
        overlay2: null,
        // Now safe to flip the status bar text colour
        statusBarStyle:
          currentMode === "dark" ? "light-content" : "dark-content",
      });
    },
  })
);
