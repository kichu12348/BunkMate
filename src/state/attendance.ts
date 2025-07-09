import { create } from "zustand";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  CourseSchedule,
} from "../types/api";
import { attendanceService } from "../api/attendance";

interface AttendanceState {
  data: AttendanceDetailedResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  courseSchedule: Map<string, CourseSchedule[]> | null;

  // Actions
  fetchAttendance: (forceRefresh?: boolean) => Promise<void>;
  refreshAttendance: () => Promise<void>;
  refreshCourseSchedule: () => Promise<void>;
  getSubjectAttendance: (subjectId: number) => SubjectAttendance | null;
  clearError: () => void;
  clearCache: () => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  courseSchedule: null,

  fetchAttendance: async (forceRefresh = false) => {
    set({ isLoading: true, error: null });

    try {
      const data = await attendanceService.fetchAttendanceDetailed(
        forceRefresh,
        (courseSchedule) => set({ courseSchedule })
      );

      set({
        data,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to fetch attendance data",
      });
      throw error;
    }
  },

  refreshAttendance: async () => {
    await get().fetchAttendance(true);
  },

  refreshCourseSchedule: async () => {
    try {
      // Get updated course schedule from database without API call
      const cachedSchedule = await attendanceService.getCachedCourseSchedule();
      if (cachedSchedule) {
        set({ courseSchedule: cachedSchedule });
      }
    } catch (error) {
      console.error("Error refreshing course schedule:", error);
    }
  },

  getSubjectAttendance: (subjectId: number) => {
    const data = get().data;
    if (!data) return null;

    return (
      data.subjects.find((subject) => subject.subject.id === subjectId) || null
    );
  },

  clearError: () => set({ error: null }),

  clearCache: async () => {
    try {
      await attendanceService.clearAttendanceCache();
      set({
        data: null,
        courseSchedule: null,
        lastUpdated: null,
        error: null,
      });
    } catch (error) {
      console.error("Error clearing attendance cache:", error);
    }
  },
}));
