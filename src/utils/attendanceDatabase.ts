import { database } from "../db/database";
import { CourseSchedule } from "../types/api";

export class AttendanceDatabase {
  /**
   * Get attendance record for a specific subject, date and hour
   */
  static async getAttendanceRecord(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): Promise<CourseSchedule | null> {
    try {
      const key = `${subjectId}-${year}-${month}-${day}-${hour}`;
      const recordData = await database.get(key);
      
      if (recordData) {
        return JSON.parse(recordData) as CourseSchedule;
      }
      
      return null;
    } catch (error) {
      console.error("Error getting attendance record:", error);
      return null;
    }
  }

  /**
   * Save attendance record to database
   */
  static async saveAttendanceRecord(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    record: CourseSchedule
  ): Promise<void> {
    try {
      const key = `${subjectId}-${year}-${month}-${day}-${hour}`;
      await database.set(key, JSON.stringify(record));
    } catch (error) {
      console.error("Error saving attendance record:", error);
      throw error;
    }
  }

  /**
   * Delete attendance record from database
   */
  static async deleteAttendanceRecord(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): Promise<void> {
    try {
      const key = `${subjectId}-${year}-${month}-${day}-${hour}`;
      await database.delete(key);
    } catch (error) {
      console.error("Error deleting attendance record:", error);
      throw error;
    }
  }

  /**
   * Check if attendance record exists in database
   */
  static async hasAttendanceRecord(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): Promise<boolean> {
    try {
      const key = `${subjectId}-${year}-${month}-${day}-${hour}`;
      return await database.has(key);
    } catch (error) {
      console.error("Error checking attendance record:", error);
      return false;
    }
  }

  /**
   * Get all attendance records for a subject on a specific date
   */
  static async getAttendanceRecordsForDate(
    subjectId: string,
    year: number,
    month: number,
    day: number
  ): Promise<CourseSchedule[]> {
    try {
      const records: CourseSchedule[] = [];
      
      // Check for records across all possible hours (1-12 typically)
      for (let hour = 1; hour <= 12; hour++) {
        const record = await this.getAttendanceRecord(subjectId, year, month, day, hour);
        if (record) {
          records.push(record);
        }
      }
      
      return records;
    } catch (error) {
      console.error("Error getting attendance records for date:", error);
      return [];
    }
  }

  /**
   * Check if a time slot is already occupied by any subject
   * This version takes a list of known subject IDs to check against
   */
  static async checkTimeSlotConflictWithSubjects(
    year: number,
    month: number,
    day: number,
    hour: number,
    allSubjectIds: string[],
    excludeSubjectId?: string
  ): Promise<{ hasConflict: boolean; conflictingSubject?: string }> {
    try {
      for (const subjectId of allSubjectIds) {
        if (excludeSubjectId && subjectId === excludeSubjectId) {
          continue; // Skip the subject we're trying to add attendance for
        }
        
        const record = await this.getAttendanceRecord(subjectId, year, month, day, hour);
        if (record && (record.user_attendance || record.teacher_attendance || record.final_attendance)) {
          return {
            hasConflict: true,
            conflictingSubject: subjectId
          };
        }
      }
      
      return { hasConflict: false };
    } catch (error) {
      console.error("Error checking time slot conflict:", error);
      return { hasConflict: false };
    }
  }

  /**
   * Check if a time slot is already occupied by any subject
   */
  static async checkTimeSlotConflict(
    year: number,
    month: number,
    day: number,
    hour: number,
    excludeSubjectId?: string
  ): Promise<{ hasConflict: boolean; conflictingSubject?: string }> {
    try {
      // Common subject ID patterns (you may need to adjust these based on your app's subject ID format)
      const commonSubjectIds = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
        '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
        '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'
      ];
      
      return await this.checkTimeSlotConflictWithSubjects(
        year, month, day, hour, commonSubjectIds, excludeSubjectId
      );
    } catch (error) {
      console.error("Error checking time slot conflict:", error);
      return { hasConflict: false };
    }
  }

  /**
   * Check for attendance conflicts across all subjects for a specific time slot
   */
  static async checkForConflicts(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): Promise<boolean> {
    try {
      // Check if this time slot is already occupied by another subject
      const { hasConflict } = await this.checkTimeSlotConflict(year, month, day, hour, subjectId);
      
      if (hasConflict) {
        return true;
      }
      
      // Also check if the current subject has a conflict flag set
      const record = await this.getAttendanceRecord(subjectId, year, month, day, hour);
      if (record && record.is_conflict === 1) {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking for conflicts:", error);
      return false;
    }
  }

  /**
   * Mark attendance manually with conflict checking
   */
  static async markAttendance(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    attendance: "Present" | "Absent",
    existingRecord?: CourseSchedule,
    allSubjectIds?: string[]
  ): Promise<CourseSchedule> {
    try {
      // Check for time slot conflicts before marking attendance
      if (allSubjectIds) {
        const { hasConflict, conflictingSubject } = await this.checkTimeSlotConflictWithSubjects(
          year, month, day, hour, allSubjectIds, subjectId
        );
        
        if (hasConflict) {
          throw new Error(`Time slot conflict: Subject ${conflictingSubject} already has attendance for ${hour}:00 on ${day}/${month}/${year}`);
        }
      }

      const attendanceValue = attendance === "Present" ? "present" : "absent";
      
      let record: CourseSchedule;
      
      if (existingRecord) {
        // Update existing record
        record = {
          ...existingRecord,
          user_attendance: attendanceValue,
          final_attendance: attendanceValue,
          is_entered_by_student: 1,
          is_user_override: 1,
          updated_at: Date.now(),
          last_user_update: Date.now(),
        };
        
        // Don't check for conflicts here - let the display logic handle it
        // Just mark that this was entered by student
        record.is_conflict = 0; // Reset conflict flag, will be calculated during display
      } else {
        // Create new record
        record = {
          id: 0,
          subject_id: subjectId,
          year,
          month,
          day,
          hour,
          user_attendance: attendanceValue,
          teacher_attendance: null,
          final_attendance: attendanceValue,
          is_entered_by_student: 1,
          is_entered_by_professor: 0,
          is_conflict: 0,
          is_user_override: 1,
          created_at: Date.now(),
          updated_at: Date.now(),
          last_user_update: Date.now(),
        };
      }

      await this.saveAttendanceRecord(subjectId, year, month, day, hour, record);
      return record;
    } catch (error) {
      console.error("Error marking attendance:", error);
      throw error;
    }
  }

  /**
   * Resolve attendance conflict
   */
  static async resolveConflict(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    resolution: "accept_teacher" | "keep_user"
  ): Promise<CourseSchedule> {
    try {
      const existingRecord = await this.getAttendanceRecord(subjectId, year, month, day, hour);
      
      if (!existingRecord) {
        throw new Error("No record found to resolve conflict");
      }

      const updatedRecord: CourseSchedule = {
        ...existingRecord,
        is_conflict: 0,
        updated_at: Date.now(),
      };

      if (resolution === "accept_teacher") {
        updatedRecord.final_attendance = updatedRecord.teacher_attendance;
        updatedRecord.is_user_override = 0;
      } else {
        updatedRecord.final_attendance = updatedRecord.user_attendance;
        updatedRecord.is_user_override = 1;
      }

      await this.saveAttendanceRecord(subjectId, year, month, day, hour, updatedRecord);
      return updatedRecord;
    } catch (error) {
      console.error("Error resolving conflict:", error);
      throw error;
    }
  }

  /**
   * Get all manual attendance records from database
   */
  static async getAllManualAttendanceRecords(): Promise<Map<string, CourseSchedule[]>> {
    try {
      const allKeys = await database.getAllKeys();
      const attendanceKeys = allKeys.filter(key => 
        key.includes('-') && key.split('-').length === 5
      );
      
      const recordsMap = new Map<string, CourseSchedule[]>();
      
      for (const key of attendanceKeys) {
        try {
          const recordData = await database.get(key);
          if (recordData) {
            const record = JSON.parse(recordData) as CourseSchedule;
            const subjectId = record.subject_id;
            
            if (!recordsMap.has(subjectId)) {
              recordsMap.set(subjectId, []);
            }
            
            recordsMap.get(subjectId)!.push(record);
          }
        } catch (parseError) {
          console.warn(`Failed to parse record for key ${key}:`, parseError);
        }
      }
      
      return recordsMap;
    } catch (error) {
      console.error("Error getting all manual attendance records:", error);
      return new Map();
    }
  }
}
