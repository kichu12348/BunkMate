import { database } from './database';

export interface AttendanceOverride {
  id?: number;
  subject_id: string;
  attendance: string | null; // 'P' for present, 'A' for absent
  year: number;
  month: number;
  day: number;
  hour: number;
  teacher_attendance: string | null;
  user_attendance: string | null;
  final_attendance: string | null;
  is_conflict: number; // 0 or 1
  is_user_override: number; // 0 or 1
  is_entered_by_professor: number; // 0 or 1
  is_entered_by_student: number; // 0 or 1
  last_teacher_update?: number;
  last_user_update?: number;
}

export interface ConflictResolution {
  id: number;
  resolution: 'accept_teacher' | 'keep_user';
}

class UserAttendanceService {
  private db = database.getDatabase();


  /**
   * Set user attendance for a specific session
   */
  async setUserAttendance(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    attendance: 'P' | 'A'
  ): Promise<void> {
    const now = Date.now();
    
    try {
      // First, check if record exists
      const existing = this.db.getFirstSync(
        `SELECT * FROM course_schedule 
         WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [subjectId, year, month, day, hour]
      ) as AttendanceOverride | null;

      if (existing) {
        // Update existing record
        const isConflict = existing.teacher_attendance && 
                          existing.teacher_attendance !== attendance;
        
        this.db.runSync(
          `UPDATE course_schedule 
           SET user_attendance = ?, 
               final_attendance = ?,
               is_user_override = 1,
               is_entered_by_student = 1,
               is_conflict = ?,
               last_user_update = ?,
               updated_at = ?
           WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
          [
            attendance, 
            attendance, // User attendance takes precedence
            isConflict ? 1 : 0,
            now,
            now,
            subjectId, 
            year, 
            month, 
            day, 
            hour
          ]
        );
      } else {
        // Create new record
        this.db.runSync(
          `INSERT INTO course_schedule 
           (subject_id, year, month, day, hour, user_attendance, final_attendance, 
            is_user_override, is_entered_by_student, is_conflict, last_user_update, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 0, ?, ?, ?)`,
          [subjectId, year, month, day, hour, attendance, attendance, now, now, now]
        );
      }
    } catch (error) {
      console.error('Error setting user attendance:', error);
      throw error;
    }
  }

  /**
   * Update teacher attendance and detect conflicts
   */
  async updateTeacherAttendance(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    attendance: string
  ): Promise<void> {
    const now = Date.now();
    
    try {
      // Check if record exists
      const existing = this.db.getFirstSync(
        `SELECT * FROM course_schedule 
         WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [subjectId, year, month, day, hour]
      ) as AttendanceOverride | null;

      if (existing) {
        // Check for conflict with user attendance
        const isConflict = existing.user_attendance && 
                          existing.user_attendance !== attendance &&
                          existing.is_user_override;
        
        // If user hasn't overridden or there's no conflict, use teacher attendance
        const finalAttendance = existing.is_user_override && !isConflict 
          ? existing.user_attendance 
          : attendance;

        this.db.runSync(
          `UPDATE course_schedule 
           SET teacher_attendance = ?, 
               final_attendance = ?,
               is_entered_by_professor = 1,
               is_conflict = ?,
               last_teacher_update = ?,
               updated_at = ?
           WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
          [
            attendance,
            finalAttendance,
            isConflict ? 1 : 0,
            now,
            now,
            subjectId,
            year,
            month,
            day,
            hour
          ]
        );
      } else {
        // Create new record with teacher attendance
        this.db.runSync(
          `INSERT INTO course_schedule 
           (subject_id, year, month, day, hour, teacher_attendance, final_attendance, 
            is_user_override, is_entered_by_professor, is_conflict, last_teacher_update, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, 0, ?, ?, ?)`,
          [subjectId, year, month, day, hour, attendance, attendance, now, now, now]
        );
      }
    } catch (error) {
      console.error('Error updating teacher attendance:', error);
      throw error;
    }
  }

  /**
   * Resolve attendance conflict
   */
  async resolveConflict(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    resolution: 'accept_teacher' | 'keep_user'
  ): Promise<void> {
    const now = Date.now();
    
    try {
      const existing = this.db.getFirstSync(
        `SELECT * FROM course_schedule 
         WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [subjectId, year, month, day, hour]
      ) as AttendanceOverride | null;

      if (!existing) {
        throw new Error('Attendance record not found');
      }

      const finalAttendance = resolution === 'accept_teacher' 
        ? existing.teacher_attendance 
        : existing.user_attendance;

      const isUserOverride = resolution === 'keep_user';

      this.db.runSync(
        `UPDATE course_schedule 
         SET final_attendance = ?,
             is_conflict = 0,
             is_user_override = ?,
             updated_at = ?
         WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [
          finalAttendance,
          isUserOverride ? 1 : 0,
          now,
          subjectId,
          year,
          month,
          day,
          hour
        ]
      );
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  /**
   * Get all conflicts for a subject
   */
  getConflicts(subjectId?: string): AttendanceOverride[] {
    try {
      const query = subjectId 
        ? `SELECT * FROM course_schedule WHERE is_conflict = 1 AND subject_id = ? ORDER BY year DESC, month DESC, day DESC, hour DESC`
        : `SELECT * FROM course_schedule WHERE is_conflict = 1 ORDER BY year DESC, month DESC, day DESC, hour DESC`;
      
      const params = subjectId ? [subjectId] : [];
      
      return this.db.getAllSync(query, params) as AttendanceOverride[];
    } catch (error) {
      console.error('Error getting conflicts:', error);
      return [];
    }
  }


  async insertAttendanceByUser({
    subjectId,
    year,
    month,
    day,
    hour,
    attendance,
    is_entered_by_student = 1,
  }: {
    subjectId: string | number;
    year: number;
    month: number;
    day: number;
    hour: number;
    attendance: 'present' | 'absent' | 'none';
    is_entered_by_student?: 0 | 1;
  }): Promise<void> {
    try {
      const checkIfExists = await this.db.getFirstAsync<AttendanceOverride>(
        `SELECT * FROM course_schedule
          WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [subjectId.toString(), year, month, day, hour]
      ) as AttendanceOverride | null;

      if (checkIfExists) {
        // Update existing record
        await this.db.runAsync(
          `UPDATE course_schedule 
           SET user_attendance = ?, 
               final_attendance = ?,
               is_user_override = 1,
               is_entered_by_student = 1,
               updated_at = ?
           WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
          [
            attendance,
            attendance, // User attendance takes precedence
            Date.now(),
            subjectId.toString(),
            year,
            month,
            day,
            hour
          ]
        );
      } else {
        // Insert new record
        await this.db.runAsync(
          `INSERT INTO course_schedule 
           (subject_id, year, month, day, hour, user_attendance, final_attendance, 
            is_user_override, is_entered_by_student, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
          [
            subjectId.toString(),
            year,
            month,
            day,
            hour,
            attendance,
            is_entered_by_student,
            Date.now(),
            Date.now()
          ]
        );
      }
    } catch (error) {
      console.error('Error inserting attendance by user:', error);
      throw error;
    }

  }

  /**
   * Get attendance for a specific session
   */
  getAttendance(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): AttendanceOverride | null {
    try {
      return this.db.getFirstSync(
        `SELECT * FROM course_schedule 
         WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [subjectId, year, month, day, hour]
      ) as AttendanceOverride | null;
    } catch (error) {
      console.error('Error getting attendance:', error);
      return null;
    }
  }

  /**
   * Get all attendance records for a subject
   */
  getSubjectAttendance(subjectId: string): AttendanceOverride[] {
    try {
      return this.db.getAllSync(
        `SELECT * FROM course_schedule 
         WHERE subject_id = ? 
         ORDER BY year DESC, month DESC, day DESC, hour DESC`,
        [subjectId]
      ) as AttendanceOverride[];
    } catch (error) {
      console.error('Error getting subject attendance:', error);
      return [];
    }
  }

  /**
   * Calculate attendance statistics including user overrides
   */
  calculateAttendanceStats(subjectId: string): {
    total: number;
    present: number;
    absent: number;
    percentage: number;
    conflicts: number;
    userOverrides: number;
  } {
    try {
      const records = this.getSubjectAttendance(subjectId);
      
      const stats = records.reduce(
        (acc, record) => {
          acc.total++;
          
          if (record.final_attendance === 'P') {
            acc.present++;
          } else if (record.final_attendance === 'A') {
            acc.absent++;
          }
          
          if (record.is_conflict) {
            acc.conflicts++;
          }
          
          if (record.is_user_override) {
            acc.userOverrides++;
          }
          
          return acc;
        },
        { total: 0, present: 0, absent: 0, conflicts: 0, userOverrides: 0 }
      );

      const percentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

      return {
        ...stats,
        percentage,
      };
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      return { total: 0, present: 0, absent: 0, percentage: 0, conflicts: 0, userOverrides: 0 };
    }
  }

  /**
   * Delete user attendance override
   */
  async deleteUserOverride(
    subjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): Promise<void> {
    const now = Date.now();
    
    try {
      const existing = this.db.getFirstSync(
        `SELECT * FROM course_schedule 
         WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
        [subjectId, year, month, day, hour]
      ) as AttendanceOverride | null;

      if (!existing) return;

      if (existing.teacher_attendance) {
        // Reset to teacher attendance
        this.db.runSync(
          `UPDATE course_schedule 
           SET user_attendance = NULL,
               final_attendance = ?,
               is_user_override = 0,
               is_conflict = 0,
               last_user_update = NULL,
               updated_at = ?
           WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
          [
            existing.teacher_attendance,
            now,
            subjectId,
            year,
            month,
            day,
            hour
          ]
        );
      } else {
        // Delete record entirely if no teacher attendance
        this.db.runSync(
          `DELETE FROM course_schedule 
           WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?`,
          [subjectId, year, month, day, hour]
        );
      }
    } catch (error) {
      console.error('Error deleting user override:', error);
      throw error;
    }
  }

  /**
   * Check if there's a time conflict for a specific hour/day across all subjects
   */
  checkTimeConflict(
    excludeSubjectId: string,
    year: number,
    month: number,
    day: number,
    hour: number
  ): boolean {
    try {
      const conflictingRecord = this.db.getFirstSync(
        `SELECT * FROM course_schedule 
         WHERE year = ? AND month = ? AND day = ? AND hour = ? 
         AND subject_id != ?
         AND (teacher_attendance IS NOT NULL OR user_attendance IS NOT NULL)`,
        [year, month, day, hour, excludeSubjectId]
      ) as AttendanceOverride | null;
      
      return !!conflictingRecord;
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return false;
    }
  }
}

export const userAttendanceService = new UserAttendanceService();
