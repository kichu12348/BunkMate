import { create } from "zustand";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  CourseSchedule,
} from "../types/api";
import { attendanceService } from "../api/attendance";
import { AttendanceDatabase } from "../utils/attendanceDatabase";

interface AttendanceState {
  data: AttendanceDetailedResponse | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  courseSchedule: Map<string, CourseSchedule[]> | null;
  hasInitFetched: boolean;

  // Actions
  fetchAttendance: (forceRefresh?: boolean) => Promise<void>;
  initFetchAttendance: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
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
    conflict: {
      subject_id: string;
      year: number;
      month: number;
      day: number;
      hour: number;
    },
    resolution: "accept_teacher" | "keep_user"
  ) => Promise<void>;

  clearAttendanceData: () => void;
}

let requestId=0;
let latestRequestId=0;

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  courseSchedule: null,
  hasInitFetched: false,

  fetchAttendance: async () => {
    set({ isLoading: true, error: null });
    const currentId = ++requestId;
    latestRequestId = currentId;

    try {
      // 1. Fetch data from the simplified API service.
      const { transformedData, courseSchedule: apiSchedule } =
        await attendanceService.fetchAttendanceDetailed();
      if (currentId !== latestRequestId) return; // prevents old fetch from overwriting state

      // 2. Get ONLY manual records from the local database.
      const manualRecords =
        await AttendanceDatabase.getAllManualAttendanceRecords();

      // 3. Perform a deep merge of the fresh API schedule and the stored manual records.
      const mergedSchedule = new Map(apiSchedule); // Start with the fresh API data as the base.

      // Iterate over each subject that has manual records.
      for (const [subjectId, manualSubjectRecords] of manualRecords.entries()) {
        const apiSubjectRecords = mergedSchedule.get(subjectId) || [];

        // For each manual record, find its counterpart in the API data.
        for (const manualRecord of manualSubjectRecords) {
          const apiRecordIndex = apiSubjectRecords.findIndex(
            (apiRecord) =>
              apiRecord.year === manualRecord.year &&
              apiRecord.month === manualRecord.month &&
              apiRecord.day === manualRecord.day &&
              apiRecord.hour === manualRecord.hour
          );

          if (apiRecordIndex > -1) {
            // A record from the teacher exists for this exact time slot. MERGE them.
            const teacherRecord = apiSubjectRecords[apiRecordIndex];
            const teacherAtt = teacherRecord.teacher_attendance;
            const userAtt = manualRecord.user_attendance;

            // Combine data, prioritizing the structure from the API record but overriding with user data.
            const mergedRecord = {
              ...teacherRecord,
              ...manualRecord,
            };

            // Explicitly detect the conflict.
            if (teacherAtt && userAtt && teacherAtt !== userAtt) {
              mergedRecord.is_conflict = 1;
              mergedRecord.final_attendance = null; // Nullify final attendance to force a resolution.
            } else {
              mergedRecord.is_conflict = 0;
              // If no conflict, final attendance is the user's entry, or falls back to the teacher's.
              mergedRecord.final_attendance = userAtt || teacherAtt;
            }
            // Replace the original API record with our new, correctly merged record.
            apiSubjectRecords[apiRecordIndex] = mergedRecord;
          } else {
            // This manual record has no corresponding API record, so it's a new entry.
            apiSubjectRecords.push(manualRecord);
          }
        }
        // Update the schedule map with the fully merged records for the subject.
        mergedSchedule.set(subjectId, apiSubjectRecords);
      }

      // // 3. Merge the API schedule with your manual records.
      // const mergedSchedule = new Map(apiSchedule);
      // for (const [subjectId, records] of manualRecords.entries()) {
      //   const existingRecords = mergedSchedule.get(subjectId) || [];
      //   // This is a simplified placeholder for your detailed merge logic.
      //   // Your existing merge logic can be pasted here.
      //   const updatedRecords = [...existingRecords, ...records].sort(
      //     (a, b) => a.day - b.day
      //   );
      //   mergedSchedule.set(subjectId, updatedRecords);
      // }

      // 4. Set the state correctly.
      set({
        data: transformedData, 
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

  initFetchAttendance: async () => {
    if (get().hasInitFetched) return;
    try {
      await get().fetchAttendance();
      set({ hasInitFetched: true });
    } catch (error) {
      console.error("Error during initial attendance fetch:", error);
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
      const { hasConflict } =
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
      // This part is correct: delete the record from the persistent key-value store.
      await AttendanceDatabase.deleteAttendanceRecord(
        subjectId,
        year,
        month,
        day,
        hour
      );

      // This section is the fix: perform an immutable update on the in-memory state.
      set((state) => {
        if (!state.courseSchedule) return {};

        const newSchedule = new Map(state.courseSchedule);
        const subjectRecords = newSchedule.get(subjectId);
        if (!subjectRecords)
          return {
            courseSchedule: newSchedule,
          };

        // Create a new array using .map() and .filter() to ensure immutability.
        const updatedSubjectRecords = subjectRecords
          .map((record) => {
            // Find the record we need to "delete" or "revert".
            if (
              record.year === year &&
              record.month === month &&
              record.day === day &&
              record.hour === hour
            ) {
              // If the record has teacher data, it was a merged conflict.
              if (record.is_entered_by_professor) {
                // Return a NEW object with the user's data removed, reverting it to the teacher's version.
                return {
                  ...record,
                  user_attendance: null,
                  is_conflict: 0,
                  is_user_override: 0,
                  is_entered_by_student: 0,
                  final_attendance: record.teacher_attendance,
                  last_user_update: null,
                };
              } else {
                // This was a student-only record. Return null to remove it.
                return null;
              }
            }
            // For all other records, return them unchanged.
            return record;
          })
          .filter((record) => record !== null); // Filter out any records that were marked for deletion.

        if (updatedSubjectRecords.length > 0) {
          newSchedule.set(subjectId, updatedSubjectRecords);
        } else {
          // If no records are left for the subject, remove the subject from the map.
          newSchedule.delete(subjectId);
        }

        // Return the new map, triggering a UI update.
        return { courseSchedule: newSchedule };
      });
    } catch (error: any) {
      console.error("[STORE] Error in deleteManualAttendance:", error);
      throw new Error("Failed to delete attendance record.");
    }
  },

  resolveConflict: async (conflict, resolution) => {
    // --- STEP 1: Update the in-memory state for an instant UI change ---
    set((state) => {
      // Create a new Map to guarantee the state change is detected.
      const newSchedule = new Map(state.courseSchedule);
      const subjectRecords = newSchedule.get(conflict.subject_id);

      // Safety check: If for some reason the records aren't in memory, do nothing.
      if (!subjectRecords)
        return {
          courseSchedule: newSchedule,
        };

      // Create a new array of records using .map() to ensure immutability.
      const updatedRecords = subjectRecords.map((record) => {
        // Find the specific record that matches the conflict.
        if (
          record.year === conflict.year &&
          record.month === conflict.month &&
          record.day === conflict.day &&
          record.hour === conflict.hour
        ) {
          if (resolution === "accept_teacher") {
            // Revert the record to its "teacher-only" state.
            const newRecord = {
              ...record,
              is_conflict: 0,
              is_user_override: 0,
              is_entered_by_student: 0,
              is_entered_by_professor: 1,
              user_attendance: null,
              final_attendance: record.attendance,
              teacher_attendance: record.attendance,
              last_user_update: null,
            };

            return newRecord;
          }
          // else { // 'keep_user'
          //   // Resolve the conflict by keeping the user's data.
          //   return {
          //     ...record,
          //     is_conflict: 0,
          //     final_attendance: record.user_attendance, // Use user's attendance
          //     updated_at: Date.now(),
          //   };
          // }
        }
        // Return all other records unchanged.
        return record;
      });

      // Update the new map with the new array of records.
      newSchedule.set(conflict.subject_id, updatedRecords);

      // Return the new state object. This WILL trigger the UI update.
      return { courseSchedule: newSchedule };
    });
    // get().refreshCourseSchedule(); // Refresh the course schedule to ensure it's up-to-date in memory.

    // --- STEP 2: Perform the permanent database operation AFTER the UI updates ---
    try {
      if (resolution === "accept_teacher") {
        // As you requested: REMOVE the student's record from the database.
        await AttendanceDatabase.deleteAttendanceRecord(
          conflict.subject_id,
          conflict.year,
          conflict.month,
          conflict.day,
          conflict.hour
        );
      }
      // else { // 'keep_user'
      //   // If keeping the user's record, we must SAVE the resolved state back to the database.
      //   const resolvedRecord = {
      //       ...conflict,
      //       is_conflict: 0,
      //       final_attendance: conflict.user_attendance
      //   };
      //   await AttendanceDatabase.saveAttendanceRecord(
      //     resolvedRecord.subject_id,
      //     resolvedRecord.year,
      //     resolvedRecord.month,
      //     resolvedRecord.day,
      //     resolvedRecord.hour,
      //     resolvedRecord
      //   );
      // }
    } catch (error) {
      console.error("Error persisting conflict resolution:", error);
      throw new Error("Failed to resolve conflict in the database.");
    }
  },
  clearAttendanceData: () => {
    set({
      data: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      courseSchedule: null,
      hasInitFetched: false,
    });
  }
}));
