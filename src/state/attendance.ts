import { create } from "zustand";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  CourseSchedule,
} from "../types/api";
import { attendanceService } from "../api/attendance";
import { userAttendanceService } from "../db/userAttendanceService";

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
  checkForConflicts: ({
    hour,
    day,
    month,
    year,
  }: {
    hour: number;
    day: number;
    month: number;
    year: number;
  }) => boolean | void;
  addSubjectAttendance?: (
    subjectId: number | string,
    year: number,
    month: number,
    day: number,
    hour: number,
    attendance: "present" | "absent" | "none"
  ) => Promise<void>;
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

  checkForConflicts: ({ hour, day, month, year }) => {
    const courseSchedule = get().courseSchedule;
    if (!courseSchedule) return false;

    const subjects = Array.from(courseSchedule.values()).flat();
    for (const subject of subjects) {
      if (
        subject.day === day &&
        subject.hour === hour &&
        subject.month === month &&
        subject.year === year
      ) {
        return true; // Conflict found
      }
    }
    return false; // No conflicts found
  },

  addSubjectAttendance: async (
    subjectId: string | number,
    year: number,
    month: number,
    day: number,
    hour: number,
    attendance: "present" | "absent" | "none"
  ) => {
    try {
      const dataFromMap = get().courseSchedule?.get(subjectId.toString())||[];
      // await userAttendanceService.insertAttendanceByUser({
      //   subjectId: subjectId.toString(),
      //   year,
      //   month,
      //   day,
      //   hour,
      //   attendance,
      // });
        const newData: CourseSchedule = {
          id: 0, // This will be set by the database
          subject_id: subjectId.toString(),
          year,
          month,
          day,
          hour,
          user_attendance: attendance,
          teacher_attendance: null,
          final_attendance: null,
          is_entered_by_student: 1,
          is_entered_by_professor: 0,
          is_conflict: 0,
          is_user_override: 0,
        };
        const updatedData = [...dataFromMap, newData];
        await userAttendanceService.insertAttendanceByUser({
          subjectId: subjectId.toString(),
          year,
          month,
          day,
          hour,
          attendance,
        });
        const newMap = new Map(get().courseSchedule);
        newMap.set(subjectId.toString(), updatedData);
        set({ courseSchedule: newMap });
    } catch (error) {
      console.error("Error adding subject attendance:", error);
    }
  },

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
