import { database } from "./database";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  CacheMetadata,
  CourseSchedule,
} from "../types/api";
import { CACHE_CONFIG, ATTENDANCE_THRESHOLDS } from "../constants/config";

export class AttendanceCache {
  private db = database.getDatabase();

  // Generic cache functions
  async setCache(
    key: string,
    data: any,
    ttl: number = CACHE_CONFIG.DEFAULT_TTL
  ): Promise<void> {
    const now = Date.now();
    const expiresAt = now + ttl;
    const serializedData = JSON.stringify(data);

    this.db.runSync(
      "INSERT OR REPLACE INTO cache (key, data, timestamp, expires_at) VALUES (?, ?, ?, ?)",
      [key, serializedData, now, expiresAt]
    );
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    const now = Date.now();

    const result = this.db.getFirstSync(
      "SELECT data, expires_at FROM cache WHERE key = ? AND expires_at > ?",
      [key, now]
    ) as { data: string; expires_at: number } | null;

    if (!result) {
      // Clean up expired entries
      this.cleanupExpiredCache();
      return null;
    }

    try {
      return JSON.parse(result.data) as T;
    } catch (error) {
      console.error(`Error parsing cached data for key ${key}:`, error);
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    this.db.runSync("DELETE FROM cache WHERE key = ?", [key]);
  }

  async clearCache(): Promise<void> {
    this.db.runSync("DELETE FROM cache");
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    this.db.runSync("DELETE FROM cache WHERE expires_at <= ?", [now]);
  }

  // Attendance-specific caching
  async cacheAttendanceData(data: AttendanceDetailedResponse): Promise<void> {
    const now = Date.now();

    // Clear existing data
    this.db.runSync("DELETE FROM attendance_subjects");
    this.db.runSync("DELETE FROM attendance_summary");

    // Cache summary
    this.db.runSync(
      "INSERT INTO attendance_summary (total_subjects, overall_percentage, last_updated, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [
        data.total_subjects,
        data.overall_percentage,
        new Date().toISOString(),
        now,
        now,
      ]
    );

    // Cache subjects
    for (const subject of data.subjects) {
      const status = this.getAttendanceStatus(subject.percentage);

      this.db.runSync(
        "INSERT INTO attendance_subjects (subject_id, subject_name, subject_code, total_classes, attended_classes, percentage, last_updated, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          subject.subject.id,
          subject.subject.name,
          subject.subject.code,
          subject.total_classes,
          subject.attended_classes,
          subject.percentage,
          subject.last_updated,
          status,
          now,
          now,
        ]
      );
    }

    // Also cache in generic cache with TTL
    await this.setCache(
      "attendance_detailed",
      data,
      CACHE_CONFIG.ATTENDANCE_TTL
    );
  }

  async getCachedAttendanceData(): Promise<AttendanceDetailedResponse | null> {
    // Try generic cache first (respects TTL)
    const cachedData = await this.getCache<AttendanceDetailedResponse>(
      "attendance_detailed"
    );
    if (cachedData) return cachedData;

    // Fallback to structured cache (no TTL, but more persistent)
    const summary = this.db.getFirstSync(
      "SELECT total_subjects, overall_percentage, last_updated FROM attendance_summary ORDER BY created_at DESC LIMIT 1"
    ) as {
      total_subjects: number;
      overall_percentage: number;
      last_updated: string;
    } | null;

    if (!summary) return null;

    const subjects = this.db.getAllSync(`
      SELECT subject_id, subject_name, subject_code, total_classes, attended_classes, percentage, last_updated, status
      FROM attendance_subjects 
      ORDER BY subject_name
    `) as Array<{
      subject_id: number;
      subject_name: string;
      subject_code: string;
      total_classes: number;
      attended_classes: number;
      percentage: number;
      last_updated: string;
      status: string;
    }>;

    const mappedSubjects: SubjectAttendance[] = subjects.map((s) => ({
      subject: {
        id: s.subject_id,
        name: s.subject_name,
        code: s.subject_code,
        credits: 0, // Not cached
        course: 0, // Not cached
        semester: "", // Not cached
        is_active: true,
      },
      total_classes: s.total_classes,
      attended_classes: s.attended_classes,
      percentage: s.percentage,
      last_updated: s.last_updated,
      status: s.status as "safe" | "warning" | "danger",
    }));

    return {
      total_subjects: summary.total_subjects,
      overall_percentage: summary.overall_percentage,
      subjects: mappedSubjects,
    };
  }

  private getAttendanceStatus(
    percentage: number
  ): "safe" | "warning" | "danger" {
    if (percentage < ATTENDANCE_THRESHOLDS.DANGER) return "danger";
    if (percentage < ATTENDANCE_THRESHOLDS.WARNING) return "warning";
    return "safe";
  }

  async getSubjectAttendance(
    subjectId: number
  ): Promise<SubjectAttendance | null> {
    const result = this.db.getFirstSync(
      "SELECT * FROM attendance_subjects WHERE subject_id = ?",
      [subjectId]
    ) as any;

    if (!result) return null;

    return {
      subject: {
        id: result.subject_id,
        name: result.subject_name,
        code: result.subject_code,
        credits: 0,
        course: 0,
        semester: "",
        is_active: true,
      },
      total_classes: result.total_classes,
      attended_classes: result.attended_classes,
      percentage: result.percentage,
      last_updated: result.last_updated,
      status: result.status,
    };
  }

  async clearAttendanceCache(): Promise<void> {
    this.db.runSync("DELETE FROM attendance_subjects");
    this.db.runSync("DELETE FROM attendance_summary");
    await this.deleteCache("attendance_detailed");
  }

  // Course schedule caching methods
  async cacheCourseSchedule(
    courseSchedule: Map<
      string,
      {
        year: number;
        month: number;
        day: number;
        hour: number;
        attendance?: string;
      }[]
    >
  ): Promise<void> {
    const now = Date.now();

    // Update teacher attendance data while preserving user overrides
    for (const [subjectId, scheduleEntries] of courseSchedule.entries()) {
      for (const entry of scheduleEntries) {
        // Check if record exists
        const existing = this.db.getFirstSync(
          "SELECT user_attendance, is_user_override FROM course_schedule WHERE subject_id = ? AND year = ? AND month = ? AND day = ? AND hour = ?",
          [subjectId, entry.year, entry.month, entry.day, entry.hour]
        ) as {
          user_attendance: string | null;
          is_user_override: number;
        } | null;

        if (existing) {
          // Update teacher attendance and check for conflicts
          const isConflict =
            existing.user_attendance &&
            existing.user_attendance !== entry.attendance &&
            existing.is_user_override;

          const finalAttendance =
            existing.is_user_override && !isConflict
              ? existing.user_attendance
              : entry.attendance || null;

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
              entry.attendance || null,
              finalAttendance,
              isConflict ? 1 : 0,
              now,
              now,
              subjectId,
              entry.year,
              entry.month,
              entry.day,
              entry.hour,
            ]
          );
        } else {
          // Create new record with teacher attendance
          this.db.runSync(
            `INSERT INTO course_schedule 
             (subject_id, year, month, day, hour, teacher_attendance, final_attendance, 
              is_user_override, is_entered_by_professor, is_conflict, last_teacher_update, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, 0, ?, ?, ?)`,
            [
              subjectId,
              entry.year,
              entry.month,
              entry.day,
              entry.hour,
              entry.attendance || null,
              entry.attendance || null,
              now,
              now,
              now,
            ]
          );
        }
      }
    }

    // Also cache in generic cache with TTL
    const scheduleData = Object.fromEntries(courseSchedule);
    await this.setCache(
      "course_schedule",
      scheduleData,
      CACHE_CONFIG.ATTENDANCE_TTL
    );
  }

  async getCachedCourseSchedule(
    subjectId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string,CourseSchedule[]> | null> {
    // Try generic cache first (respects TTL) only if no filters are applied
    // const cachedData = await this.getCache<
    //   Record<
    //     string,
    //     CourseSchedule[]
    //   >
    // >("course_schedule");
    // if (cachedData && !subjectId && !startDate && !endDate) {
    //   return new Map(Object.entries(cachedData));
    // }

    // Fallback to structured cache with user overrides and optional filtering
    try {
      let query = `SELECT * FROM course_schedule`;
      const params: any[] = [];
      const conditions: string[] = [];

      if (subjectId) {
        conditions.push(`subject_id = ?`);
        params.push(subjectId);
      }

      if (startDate) {
        conditions.push(`(year > ? OR (year = ? AND month > ?) OR (year = ? AND month = ? AND day >= ?))`);
        params.push(
          startDate.getFullYear() - 1,
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate()
        );
      }

      if (endDate) {
        conditions.push(`(year < ? OR (year = ? AND month < ?) OR (year = ? AND month = ? AND day <= ?))`);
        params.push(
          endDate.getFullYear() + 1,
          endDate.getFullYear(),
          endDate.getMonth() + 2,
          endDate.getFullYear(),
          endDate.getMonth() + 1,
          endDate.getDate()
        );
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY subject_id, year, month, day, hour`;

      const scheduleRows = this.db.getAllSync(query, params) as Array<CourseSchedule>;
      if (scheduleRows.length === 0) return null;

      const courseSchedule = new Map<string,CourseSchedule[]>();

      for (const row of scheduleRows) {
        // Keep the numeric values (0/1) as they are stored in the database
        const entry: CourseSchedule = {
          id: row.id,
          subject_id: row.subject_id,
          year: row.year,
          month: row.month,
          day: row.day,
          hour: row.hour,
          final_attendance: row.final_attendance,
          teacher_attendance: row.teacher_attendance,
          user_attendance: row.user_attendance,
          is_user_override: row.is_user_override,
          is_entered_by_professor: row.is_entered_by_professor,
          is_conflict: row.is_conflict,
          last_teacher_update: row.last_teacher_update,
          is_entered_by_student: row.is_entered_by_student,
          last_user_update: row.last_user_update,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };

        if (courseSchedule.has(row.subject_id)) {
          courseSchedule.get(row.subject_id)!.push(entry);
        } else {
          courseSchedule.set(row.subject_id, [entry]);
        }
      }

      return courseSchedule;
    } catch (error) {
      console.error("Error retrieving cached course schedule:", error);
      return null;
    }
  }

  async clearCourseScheduleCache(): Promise<void> {
    this.db.runSync("DELETE FROM course_schedule");
    await this.deleteCache("course_schedule");
  }
}

export const attendanceCache = new AttendanceCache();
