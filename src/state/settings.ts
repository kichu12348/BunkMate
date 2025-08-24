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
      const currentState = get();
      let nextSemester = currentState.selectedSemester;
      if (year === "0") {
        nextSemester = "0";
      } 
      else if (currentState.selectedSemester === "0") {
        nextSemester = getDefaultSemester();
      }
      authService.setDefaultYear(year);
      kvHelper.setSetting("selectedYear", year);
      authService.setDefaultSemester(nextSemester);
      kvHelper.setSetting("selectedSemester", nextSemester);
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
      } 
      else if (currentState.selectedYear === "0") {
        nextYear = getDefaultAcademicYear();
      }
      authService.setDefaultSemester(semester);
      kvHelper.setSetting("selectedSemester", semester);
      authService.setDefaultYear(nextYear);
      kvHelper.setSetting("selectedYear", nextYear);

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

  initializeSettings: async () => {
    try {
      const savedYear = kvHelper.getSetting<string>("selectedYear");
      const savedSemester = kvHelper.getSetting<string>("selectedSemester");
      const yearToSet = savedYear || getDefaultAcademicYear();
      const semesterToSet = savedSemester || getDefaultSemester();

      set({
        selectedYear: yearToSet,
        selectedSemester: semesterToSet,
      });
      
      await authService.setDefaultYear(yearToSet);
      await authService.setDefaultSemester(semesterToSet);
    } catch (error) {
      console.warn("Failed to initialize settings:", error);
      set({
        selectedYear: getDefaultAcademicYear(),
        selectedSemester: getDefaultSemester(),
      });
    }
  },

  clearError: () => set({ error: null }),
}));