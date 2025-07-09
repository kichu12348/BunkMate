import { create } from "zustand";
import { authService } from "../api/auth";
import { kvHelper } from "../kv/kvStore";
import {
  generateAcademicYears,
  generateSemesters,
  getDefaultAcademicYear,
  getDefaultSemester,
} from "../utils/helpers";

interface SettingsState {
  selectedYear: string;
  selectedSemester: string;
  availableYears: Array<{ value: string; label: string }>;
  availableSemesters: Array<{ value: string; label: string }>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAcademicYear: (year: string) => Promise<void>;
  setSemester: (semester: string) => Promise<void>;
  initializeSettings: () => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  selectedYear: "0",
  selectedSemester: "0",
  availableYears: generateAcademicYears(),
  availableSemesters: generateSemesters(),
  isLoading: false,
  error: null,

  setAcademicYear: async (year: string) => {
    set({ isLoading: true, error: null });

    try {
      // Set on server
      authService.setDefaultYear(year);
      kvHelper.setSetting("selectedYear", year);
      if (year === "0") {
        set({
          selectedSemester: "0",
          selectedYear: year,
          isLoading: false,
          error: null,
        });
        kvHelper.setSetting("selectedSemester", "0");
        return;
      } else {
        set({
          selectedYear: year,
          isLoading: false,
          error: null,
        });
        if (get().selectedSemester === "0") {
          set({
            selectedSemester: "odd",
          });
          kvHelper.setSetting("selectedSemester", "odd");
        }
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to set academic year",
      });
      throw error;
    }
  },

  setSemester: async (semester: string) => {
    set({ isLoading: true, error: null });

    try {
      // Set on server
      authService.setDefaultSemester(semester);
      kvHelper.setSetting("selectedSemester", semester);
      if (semester === "0") {
        set({
          selectedSemester: semester,
          selectedYear: "0",
          isLoading: false,
          error: null,
        });
        kvHelper.setSetting("selectedYear", "0");
        return;
      }
      set({
        selectedSemester: semester,
        selectedYear:
          get().selectedYear === "0"
            ? getDefaultAcademicYear()
            : get().selectedYear,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to set semester",
      });
      throw error;
    }
  },

  initializeSettings: async () => {
    try {
      // Try to load from local storage first
      const savedYear = kvHelper.getSetting<string>("selectedYear");
      const savedSemester = kvHelper.getSetting<string>("selectedSemester");

      set({
        selectedYear: savedYear || getDefaultAcademicYear(),
        selectedSemester: savedSemester || getDefaultSemester(),
      });
      await authService.setDefaultYear(savedYear || getDefaultAcademicYear());
      await authService.setDefaultSemester(savedSemester || getDefaultSemester());
    } catch (error) {
      console.warn("Failed to initialize settings:", error);
      // Use defaults
      set({
        selectedYear: getDefaultAcademicYear(),
        selectedSemester: getDefaultSemester(),
      });
    }
  },

  clearError: () => set({ error: null }),
}));
