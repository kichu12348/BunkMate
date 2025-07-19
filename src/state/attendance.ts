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
  markManualAttendance: (params: {
    subjectId: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    attendance: "present" | "absent";
  }) => Promise<void>;

  deleteManualAttendance: (params: {
    subjectId: string;
    year: number;
    month: number;
    day: number;
    hour: number;
  }) => Promise<void>;

  resolveConflict: (
    conflict: CourseSchedule,
    resolution: "accept_teacher" | "keep_user"
  ) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  courseSchedule: null,

  fetchAttendance: async () => {
    set({ isLoading: true, error: null });

    try {
      // 1. Fetch data from the simplified API service.
      const { transformedData, courseSchedule: apiSchedule } =
        await attendanceService.fetchAttendanceDetailed();

      // 2. Get ONLY manual records from the local database.
      const manualRecords =
        await AttendanceDatabase.getAllManualAttendanceRecords();

      // 3. Merge the API schedule with your manual records.
      const mergedSchedule = new Map(apiSchedule);
      for (const [subjectId, records] of manualRecords.entries()) {
        const existingRecords = mergedSchedule.get(subjectId) || [];
        // This is a simplified placeholder for your detailed merge logic.
        // Your existing merge logic can be pasted here.
        const updatedRecords = [...existingRecords, ...records].sort(
          (a, b) => a.day - b.day
        );
        mergedSchedule.set(subjectId, updatedRecords);
      }

      // 4. Set the state correctly.
      // This fixes the TypeScript error.
      set({
        data: transformedData, // Set `data` to the AttendanceDetailedResponse
        courseSchedule: mergedSchedule,
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
    // The refresh action simply calls the main fetch function.
    await get().fetchAttendance();
  },

  // This function will now work correctly.
  getSubjectAttendance: (subjectId: number) => {
    const data = get().data;
    if (!data) return null;
    return (
      data.subjects.find((subject) => subject.subject.id === subjectId) || null
    );
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

  // getSubjectAttendance: (subjectId: number) => {
  //   const data = get().data;
  //   if (!data) return null;

  //   return (
  //     data.subjects.find((subject) => subject.subject.id === subjectId) || null
  //   );
  // },

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
      const { hasConflict } =
        await AttendanceDatabase.checkTimeSlotConflictWithSubjects(
          year,
          month,
          day,
          hour,
          allSubjectIds
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
      const allSubjectIds = courseSchedule
        ? Array.from(courseSchedule.keys())
        : [];

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
          user_attendance:
            attendance === "present"
              ? "present"
              : attendance === "absent"
              ? "absent"
              : null,
          final_attendance:
            attendance === "present"
              ? "present"
              : attendance === "absent"
              ? "absent"
              : null,
          is_entered_by_student: 1,
          is_user_override: 1,
          updated_at: Date.now(),
          last_user_update: Date.now(),
        };

        // Check for conflicts if teacher attendance exists
        if (
          attendanceRecord.teacher_attendance &&
          attendanceRecord.teacher_attendance !==
            attendanceRecord.user_attendance
        ) {
          attendanceRecord.is_conflict = 1;
          attendanceRecord.final_attendance = null; // Clear final until resolved
        } else {
          attendanceRecord.is_conflict = 0;
        }
      } else {
        // Check for time slot conflicts before creating new record
        const { hasConflict, conflictingSubject } =
          await AttendanceDatabase.checkTimeSlotConflictWithSubjects(
            year,
            month,
            day,
            hour,
            allSubjectIds,
            subjectId.toString()
          );

        if (hasConflict) {
          throw new Error(
            `Time slot conflict: Subject ${conflictingSubject} already has attendance for this time slot`
          );
        }

        // Create new record
        attendanceRecord = {
          id: 0,
          subject_id: subjectId.toString(),
          year,
          month,
          day,
          hour,
          user_attendance:
            attendance === "present"
              ? "present"
              : attendance === "absent"
              ? "absent"
              : null,
          teacher_attendance: null,
          final_attendance:
            attendance === "present"
              ? "present"
              : attendance === "absent"
              ? "absent"
              : null,
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
        (item) =>
          item.year === year &&
          item.month === month &&
          item.day === day &&
          item.hour === hour
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
      ).catch((error) => {
        console.error("Background database save failed:", error);
      });
    } catch (error) {
      console.error("Error adding subject attendance:", error);
      throw error;
    }
  },
  markManualAttendance: async ({
    subjectId,
    year,
    month,
    day,
    hour,
    attendance,
  }) => {
    try {
      // Conflict checking logic remains the same
      const allSubjectIds = Array.from(get().courseSchedule?.keys() || []);
      const { hasConflict, conflictingSubject } =
        await AttendanceDatabase.checkTimeSlotConflictWithSubjects(
          year,
          month,
          day,
          hour,
          allSubjectIds,
          subjectId
        );

      if (hasConflict) {
        throw new Error(
          `Time slot conflict: Attendance is already marked for another subject at this time.`
        );
      }

      // Prepare the record to be saved
      const existingRecord = await AttendanceDatabase.getAttendanceRecord(
        subjectId,
        year,
        month,
        day,
        hour
      );
      const recordToSave: CourseSchedule = {
        ...(existingRecord || {
          id: 0, // DB will auto-increment
          subject_id: subjectId,
          year,
          month,
          day,
          hour,
          is_entered_by_student: 1,
          created_at: Date.now(),
          teacher_attendance: null,
          is_conflict: 0,
          is_entered_by_professor: 0,
        }),
        user_attendance: attendance,
        final_attendance: attendance,
        is_user_override: 1,
        updated_at: Date.now(),
        last_user_update: Date.now(),
      };

      // Step 1: Save the record to the database
      await AttendanceDatabase.saveAttendanceRecord(
        subjectId,
        year,
        month,
        day,
        hour,
        recordToSave
      );

      // Step 2: Fetch the record back from the DB to ensure we have the definitive version
      const savedRecord = await AttendanceDatabase.getAttendanceRecord(
        subjectId,
        year,
        month,
        day,
        hour
      );
      if (!savedRecord) {
        throw new Error("Failed to save and retrieve the updated record.");
      }

      // Step 3: Directly and surgically update the in-memory state
      set((state) => {
        const newSchedule = new Map(state.courseSchedule);
        const subjectRecords = newSchedule.get(subjectId) || [];

        const recordIndex = subjectRecords.findIndex(
          (r) =>
            r.year === year &&
            r.month === month &&
            r.day === day &&
            r.hour === hour
        );

        if (recordIndex > -1) {
          subjectRecords[recordIndex] = savedRecord;
        } else {
          subjectRecords.push(savedRecord);
        }

        newSchedule.set(subjectId, [...subjectRecords]); 
        return { courseSchedule: newSchedule };
      });
    } catch (error: any) {
      console.error("Error in markManualAttendance:", error);
      throw error;
    }
  },

  deleteManualAttendance: async ({ subjectId, year, month, day, hour }) => {
    try {
      await AttendanceDatabase.deleteAttendanceRecord(
        subjectId,
        year,
        month,
        day,
        hour
      );
      set((state) => {
        if (!state.courseSchedule) return {};
        
        const newSchedule = new Map(state.courseSchedule);
        const subjectRecords = newSchedule.get(subjectId) || [];

        const updatedSubjectRecords = subjectRecords.filter(
          (record) =>
            !(
              record.year === year &&
              record.month === month &&
              record.day === day &&
              record.hour === hour
            )
        );

        if (updatedSubjectRecords.length > 0) {
          newSchedule.set(subjectId, updatedSubjectRecords);
        } else {
          newSchedule.delete(subjectId);
        }
        return { courseSchedule: newSchedule };
      });
    } catch (error: any) {
      console.error("[STORE] Error in deleteManualAttendance:", error);
      throw new Error("Failed to delete attendance record.");
    }
  },

  resolveConflict: async (conflict, resolution) => {
    try {
      await AttendanceDatabase.resolveConflict(
        conflict.subject_id,
        conflict.year,
        conflict.month,
        conflict.day,
        conflict.hour,
        resolution
      );
      await get().refreshCourseSchedule();
      get().refreshAttendance();
    } catch (error) {
      console.error("Error resolving conflict:", error);
      throw new Error("Failed to resolve attendance conflict.");
    }
  },
}));
