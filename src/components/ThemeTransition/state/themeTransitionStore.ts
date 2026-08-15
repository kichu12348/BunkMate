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
  height: number,
): number {
  const safeX = typeof x === "number" && !isNaN(x) ? x : width / 2;
  const safeY = typeof y === "number" && !isNaN(y) ? y : height / 2;
  return Math.max(
    Math.hypot(safeX, safeY),
    Math.hypot(width - safeX, safeY),
    Math.hypot(safeX, height - safeY),
    Math.hypot(width - safeX, height - safeY),
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
      if (get().active || get().isTransitioning) return;
      set({ active: true, isTransitioning: true });

      const { width, height } = Dimensions.get("window");

      // Resolve origin safely — default to screen centre
      const cx =
        typeof origin?.x === "number" && !isNaN(origin.x)
          ? origin.x
          : width / 2;
      const cy =
        typeof origin?.y === "number" && !isNaN(origin.y)
          ? origin.y
          : height / 2;
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

      // 3. Mount overlay with old snapshot
      set({ overlay1: snapshot1 });

      // 4. Toggle the theme in the Zustand store immediately
      // The real app tree re-renders to the new theme underneath the canvas
      useThemeStore.getState().toggleMode();
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
  }),
);
