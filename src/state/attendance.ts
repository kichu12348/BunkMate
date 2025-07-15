import { create } from "zustand";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  CourseSchedule,
} from "../types/api";
import { attendanceService } from "../api/attendance";
import { database } from "../db/database";
import { AttendanceDatabase } from "../utils/attendanceDatabase";


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
  }) => Promise<boolean>;
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

  checkForConflicts: async ({
    hour,
    day,
    month,
    year,
  }: {
    hour: number;
    day: number;
    month: number;
    year: number;
  }) => {
    try {
      const courseSchedule = get().courseSchedule;
      if (!courseSchedule) return false;

      // Get all subject IDs from the course schedule
      const allSubjectIds = Array.from(courseSchedule.keys());

      // Check in memory course schedule first for any existing entries at this time
      const subjects = Array.from(courseSchedule.values()).flat();
      for (const subject of subjects) {
        if (
          subject.day === day &&
          subject.hour === hour &&
          subject.month === month &&
          subject.year === year
        ) {
          return true; // Conflict found in course schedule
        }
      }

      // Check database for manual attendance entries that might conflict
      const { hasConflict } = await AttendanceDatabase.checkTimeSlotConflictWithSubjects(
        year, month, day, hour, allSubjectIds
      );

      return hasConflict;
    } catch (error) {
      console.error("Error checking for conflicts:", error);
      return false;
    }
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
      // Get all subject IDs for conflict checking
      const courseSchedule = get().courseSchedule;
      const allSubjectIds = courseSchedule ? Array.from(courseSchedule.keys()) : [];

      // Check if record already exists
      const existingRecord = await AttendanceDatabase.getAttendanceRecord(
        subjectId.toString(),
        year,
        month,
        day,
        hour
      );

      let attendanceRecord: CourseSchedule;
      
      if (existingRecord) {
        // Update existing record
        attendanceRecord = {
          ...existingRecord,
          user_attendance: attendance === "present" ? "present" : attendance === "absent" ? "absent" : null,
          final_attendance: attendance === "present" ? "present" : attendance === "absent" ? "absent" : null,
          is_entered_by_student: 1,
          is_user_override: 1,
          updated_at: Date.now(),
          last_user_update: Date.now(),
        };
        
        // Check for conflicts if teacher attendance exists
        if (attendanceRecord.teacher_attendance && 
            attendanceRecord.teacher_attendance !== attendanceRecord.user_attendance) {
          attendanceRecord.is_conflict = 1;
          attendanceRecord.final_attendance = null; // Clear final until resolved
        } else {
          attendanceRecord.is_conflict = 0;
        }
      } else {
        // Check for time slot conflicts before creating new record
        const { hasConflict, conflictingSubject } = await AttendanceDatabase.checkTimeSlotConflictWithSubjects(
          year, month, day, hour, allSubjectIds, subjectId.toString()
        );
        
        if (hasConflict) {
          throw new Error(`Time slot conflict: Subject ${conflictingSubject} already has attendance for this time slot`);
        }

        // Create new record
        attendanceRecord = {
          id: 0,
          subject_id: subjectId.toString(),
          year,
          month,
          day,
          hour,
          user_attendance: attendance === "present" ? "present" : attendance === "absent" ? "absent" : null,
          teacher_attendance: null,
          final_attendance: attendance === "present" ? "present" : attendance === "absent" ? "absent" : null,
          is_entered_by_student: 1,
          is_entered_by_professor: 0,
          is_conflict: 0,
          is_user_override: 1,
          created_at: Date.now(),
          updated_at: Date.now(),
          last_user_update: Date.now(),
        };
      }

      // Update in-memory course schedule first (for immediate UI update)
      const dataFromMap = courseSchedule?.get(subjectId.toString()) || [];
      const existingIndex = dataFromMap.findIndex(
        item => item.year === year && item.month === month && 
                item.day === day && item.hour === hour
      );
      
      let updatedData: CourseSchedule[];
      if (existingIndex >= 0) {
        // Update existing entry
        updatedData = [...dataFromMap];
        updatedData[existingIndex] = attendanceRecord;
      } else {
        // Add new entry
        updatedData = [...dataFromMap, attendanceRecord];
      }
      
      const newMap = new Map(courseSchedule);
      newMap.set(subjectId.toString(), updatedData);
      set({ courseSchedule: newMap });

      // Store in database in background (don't await for better performance)
      AttendanceDatabase.saveAttendanceRecord(
        subjectId.toString(),
        year,
        month,
        day,
        hour,
        attendanceRecord
      ).catch(error => {
        console.error("Background database save failed:", error);
      });
    } catch (error) {
      console.error("Error adding subject attendance:", error);
      throw error;
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
