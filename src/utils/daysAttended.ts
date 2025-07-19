import { normalizeAttendance } from "./helpers";
import type { CourseSchedule } from "../types/api";
interface AttendanceType {
  id: number;
  name: string;
  code: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface AttendanceRecord {
  course: number | null;
  attendance: number | null;
  marked_by: number | null;
}

export interface DailyAttendance {
  [sessionId: string]: AttendanceRecord;
}

export interface AttendanceApiResponse {
  courses: Record<string, Course>;
  attendanceTypes: Record<string, AttendanceType>;
  studentAttendanceData: Record<string, DailyAttendance>;
}

interface HourAttendance extends Course {
  attendance?: string;
}

function getHourAttendance(
  hourData: AttendanceRecord | undefined,
  courseData: Map<number, Course>,
  attendanceTypes: Record<string, AttendanceType>
): HourAttendance | null {
  if (hourData?.course && hourData.attendance) {
    const course = courseData.get(hourData.course);

    if (course) {
      return {
        ...course,
        attendance: normalizeAttendance(
          attendanceTypes[hourData.attendance.toString()]?.name
        ),
      };
    }
  }
  return null;
}

// --- New type for the function's output structure ---
// Extend CourseSchedule to include 'attendance'
type CourseScheduleEntry = CourseSchedule & { attendance?: string };

export function daysAttended(
  data: AttendanceApiResponse
): Map<string, CourseScheduleEntry[]> {
  const { studentAttendanceData, courses, attendanceTypes } = data;

  const sessionToHourMap: Record<string, number> = {
    "261": 1,
    "262": 2,
    "263": 3,
    "264": 4,
    "265": 5,
    "266": 6,
  };
  const sessionIds = Object.keys(sessionToHourMap);

  const courseData = new Map<number, Course>(
    Object.values(courses).map((course) => [course.id, course])
  );

  const courseSchedule = Object.entries(studentAttendanceData).reduce(
    (acc, [dateString, dailyRecord]) => {
      const year = parseInt(dateString.slice(0, 4), 10);
      const month = parseInt(dateString.slice(4, 6), 10);
      const day = parseInt(dateString.slice(6, 8), 10);

      for (const sessionId of sessionIds) {
        const hourRecord = dailyRecord[sessionId];
        const hourAttendance = getHourAttendance(
          hourRecord,
          courseData,
          attendanceTypes
        );

        if (hourAttendance) {
          const courseIdStr = hourAttendance.id.toString();
          const schedule = acc.get(courseIdStr);
          const now = Date.now();

          const newEntry: CourseScheduleEntry = {
            id: 0, // Will be set by database
            subject_id: hourAttendance.id.toString(),
            day: day,
            hour: sessionToHourMap[sessionId],
            month: month,
            year: year,
            final_attendance: hourAttendance.attendance || "Absent",
            teacher_attendance: hourAttendance.attendance || null,
            user_attendance: null,
            is_conflict: 0,
            is_user_override: 0,
            is_entered_by_professor: 1, // Since this comes from professor's data
            is_entered_by_student: 0,
            created_at: now,
            updated_at: now,
            last_teacher_update: now,
            last_user_update: null,
            attendance: hourAttendance.attendance, // Additional field from the extended type
          };

          if (schedule) {
            schedule.push(newEntry);
          } else {
            acc.set(courseIdStr, [newEntry]);
          }
        }
      }
      return acc;
    },
    new Map<string, CourseScheduleEntry[]>()
  );

  // Sort schedules once at the end (no change here)
  for (const schedule of courseSchedule.values()) {
    schedule.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (a.month !== b.month) return a.month - b.month;
      if (a.day !== b.day) return a.day - b.day;
      return a.hour - b.hour;
    });
  }
  return courseSchedule;
}
