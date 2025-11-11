import { create } from "zustand";
import { authService } from "../api/auth";
import {
  generateAcademicYears,
  generateSemesters,
  getDefaultAcademicYear,
  getDefaultSemester,
} from "../utils/helpers";

interface SettingsState {
  hasInitialized: boolean;
  selectedYear: string;

  selectedSemester: string;
  availableYears: Array<{ value: string; label: string }>;
  availableSemesters: Array<{ value: string; label: string }>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAcademicYear: (year: string) => Promise<void>;
  setSemester: (semester: string) => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  hasInitialized: false,
  selectedYear: "0",
  selectedSemester: "0",
  availableYears: generateAcademicYears(),
  availableSemesters: generateSemesters(),
  isLoading: false,
  error: null,

  setAcademicYear: async (year: string) => {
    set({ isLoading: true, error: null });

    try {
      const currentState = get();
      let nextSemester = currentState.selectedSemester;
      if (year === "0") {
        nextSemester = "0";
      } else if (currentState.selectedSemester === "0") {
        nextSemester = getDefaultSemester();
      }
      authService.setDefaultYear(year);
      authService.setDefaultSemester(nextSemester);
      set({
        selectedYear: year,
        selectedSemester: nextSemester,
        isLoading: false,
      });
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
      const currentState = get();
      let nextYear = currentState.selectedYear;

      if (semester === "0") {
        nextYear = "0";
      } else if (currentState.selectedYear === "0") {
        nextYear = getDefaultAcademicYear();
      }
      authService.setDefaultSemester(semester);
      authService.setDefaultYear(nextYear);

      set({
        selectedSemester: semester,
        selectedYear: nextYear,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to set semester",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
