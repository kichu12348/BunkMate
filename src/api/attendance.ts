import axios, { AxiosInstance, AxiosResponse } from "axios";
import { API_CONFIG, ATTENDANCE_THRESHOLDS } from "../constants/config";
import { kvHelper } from "../kv/kvStore";
import { attendanceCache } from "../db/attendanceCache";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  AttendanceApiResponse,
  Course,
  Session,
  AttendanceType,
  DailyAttendance,
  ApiError,
  CourseSchedule
} from "../types/api";
import { daysAttended } from "../utils/daysAttended";
import { AttendanceDatabase } from "../utils/attendanceDatabase";

class AttendanceService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await kvHelper.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          kvHelper.clearAuthToken();
        }
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): ApiError {
    if (error.response?.data) {
      return {
        error: error.response.data.error || "API Error",
        message: error.response.data.message || error.message,
        status_code: error.response.status,
      };
    }

    return {
      error: "Network Error",
      message: error.message || "Something went wrong",
      status_code: 0,
    };
  }

  async fetchAttendanceDetailed(
    forceRefresh: boolean = false,
    setCourseSchedule?: (
      courseSchedule: Map<
        string,
        CourseSchedule[]
      >
    ) => void
  ): Promise<AttendanceDetailedResponse> {
    // Check cache first unless force refresh
    // if (!forceRefresh) {
    //   const cachedData = await attendanceCache.getCachedAttendanceData();
    //   const cachedSchedule = await attendanceCache.getCachedCourseSchedule();
      
    //   if (cachedData && cachedSchedule && setCourseSchedule) {
    //     setCourseSchedule(cachedSchedule);
    //     return cachedData;
    //   } else if (cachedData) {
    //     return cachedData;
    //   }
    // }

    try {
      const response: AxiosResponse<AttendanceApiResponse> =
        await this.api.post(API_CONFIG.ENDPOINTS.ATTENDANCE.DETAILED, {});
        
      const courseSchedule = daysAttended(response.data);
      
      // Get manual attendance records from database
      const manualRecords = await AttendanceDatabase.getAllManualAttendanceRecords();
      
      // Merge manual records with API data
      const mergedCourseSchedule = this.mergeCourseScheduleWithManualRecords(courseSchedule, manualRecords);
      
      // Cache the course schedule
      // await attendanceCache.cacheCourseSchedule(mergedCourseSchedule);
      
      if (setCourseSchedule) {
        setCourseSchedule(mergedCourseSchedule);
      }
      
      const transformedData = this.transformAttendanceResponse(response.data);

      // Cache the attendance data
      // await attendanceCache.cacheAttendanceData(transformedData);

      return transformedData;
    } catch (error) {
      // If API fails, try to return cached data as fallback
      const cachedData = await attendanceCache.getCachedAttendanceData();
      const cachedSchedule = await attendanceCache.getCachedCourseSchedule();
      
      if (cachedData && cachedSchedule && setCourseSchedule) {
        setCourseSchedule(cachedSchedule);
        return cachedData;
      } else if (cachedData) {
        return cachedData;
      }

      throw this.handleApiError(error);
    }
  }

  private transformAttendanceResponse(
    apiData: AttendanceApiResponse
  ): AttendanceDetailedResponse {
    const subjects: SubjectAttendance[] = [];

    // Process each course to calculate attendance
    Object.values(apiData.courses).forEach((course) => {
      const courseAttendance = this.calculateCourseAttendance(
        course,
        apiData.studentAttendanceData,
        apiData.sessions,
        apiData.attendanceTypes
      );

      if (courseAttendance) {
        subjects.push(courseAttendance);
      }
    });

    // Calculate overall percentage
    const totalClasses = subjects.reduce(
      (sum, subject) => sum + subject.total_classes,
      0
    );
    const totalAttended = subjects.reduce(
      (sum, subject) => sum + subject.attended_classes,
      0
    );
    const overallPercentage =
      totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;

    return {
      total_subjects: subjects.length,
      overall_percentage: overallPercentage,
      subjects,
    };
  }

  private calculateCourseAttendance(
    course: Course,
    studentData: Record<string, DailyAttendance>,
    sessions: Record<string, Session>,
    attendanceTypes: Record<string, AttendanceType>
  ): SubjectAttendance | null {
    let totalClasses = 0;
    let attendedClasses = 0;

    // Process each day's attendance for this course
    Object.values(studentData).forEach((dailyData) => {
      Object.entries(dailyData).forEach(([sessionId, attendance]) => {
        if (attendance.course === course.id) {
          totalClasses++;

          // Check if attendance is positive (present)
          if (attendance.attendance) {
            const attendanceType =
              attendanceTypes[attendance.attendance.toString()];
            if (attendanceType && attendanceType.positive_report_value > 0) {
              attendedClasses++;
            }
          }
        }
      });
    });

    // Skip courses with no attendance data
    if (totalClasses === 0) {
      return null;
    }

    const percentage =
      totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

    return {
      subject: {
        id: course.id,
        name: course.name,
        code: course.code,
        credits: 0, // Not available in API
        course: course.id,
        semester: course.academic_semester,
        is_active: course.deleted_at === null,
      },
      total_classes: totalClasses,
      attended_classes: attendedClasses,
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      last_updated: course.updated_at,
      status: this.getAttendanceStatus(percentage),
    };
  }

  private getAttendanceStatus(
    percentage: number
  ): "safe" | "warning" | "danger" {
    if (percentage < ATTENDANCE_THRESHOLDS.DANGER) return "danger";
    if (percentage < ATTENDANCE_THRESHOLDS.WARNING) return "warning";
    return "safe";
  }

  private calculateOverallPercentage(subjects: SubjectAttendance[]): number {
    if (subjects.length === 0) return 0;

    const totalClasses = subjects.reduce(
      (sum, subject) => sum + subject.total_classes,
      0
    );
    const totalAttended = subjects.reduce(
      (sum, subject) => sum + subject.attended_classes,
      0
    );

    return totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 0;
  }

  async fetchAttendanceSummary(): Promise<{
    overall_percentage: number;
    total_subjects: number;
  }> {
    try {
      const response: AxiosResponse<any> = await this.api.post(
        API_CONFIG.ENDPOINTS.ATTENDANCE.SUMMARY,
        {}
      );

      return {
        overall_percentage: response.data.overall_percentage || 0,
        total_subjects: response.data.total_subjects || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  async getSubjectAttendance(
    subjectId: number
  ): Promise<SubjectAttendance | null> {
    // First check cache
    const cachedSubject = await attendanceCache.getSubjectAttendance(subjectId);
    if (cachedSubject) {
      return cachedSubject;
    }

    // If not in cache, fetch full data and return specific subject
    try {
      const fullData = await this.fetchAttendanceDetailed();
      return fullData.subjects.find((s) => s.subject.id === subjectId) || null;
    } catch (error) {
      console.error("Error fetching subject attendance:", error);
      return null;
    }
  }

  async clearAttendanceCache(): Promise<void> {
    await attendanceCache.clearCache();
    await attendanceCache.clearCourseScheduleCache();
  }

  /**
   * Merge course schedule from API with manual attendance records from database
   */
  private mergeCourseScheduleWithManualRecords(
    apiSchedule: Map<string, CourseSchedule[]>,
    manualRecords: Map<string, CourseSchedule[]>
  ): Map<string, CourseSchedule[]> {
    const mergedSchedule = new Map(apiSchedule);
    
    // Iterate through manual records
    for (const [subjectId, records] of manualRecords.entries()) {
      const existingRecords = mergedSchedule.get(subjectId) || [];
      
      for (const manualRecord of records) {
        // Check if there's an existing record for the same time slot
        const existingIndex = existingRecords.findIndex(
          existing => 
            existing.year === manualRecord.year &&
            existing.month === manualRecord.month &&
            existing.day === manualRecord.day &&
            existing.hour === manualRecord.hour
        );
        
        if (existingIndex >= 0) {
          // Merge with existing record (manual data takes precedence for user fields)
          const existing = existingRecords[existingIndex];
          
          // Helper function to get timestamp as number
          const getTimestamp = (value: string | number | undefined): number => {
            if (typeof value === 'string') return parseInt(value, 10) || 0;
            return value || 0;
          };
          
          // Detect conflicts by comparing teacher vs user attendance
          const detectConflict = (record: CourseSchedule): number => {
            // If the record was manually resolved (is_conflict was explicitly set to 0), respect that
            if (manualRecord.is_conflict === 0 && manualRecord.final_attendance) {
              return 0; // Don't override resolved conflicts
            }
            
            const teacherAtt = record.teacher_attendance;
            const userAtt = record.user_attendance;
            
            if (!teacherAtt || !userAtt) return 0;
            
            // Normalize attendance values for comparison
            const normalizeAttendance = (att: string) => {
              const normalized = att.toLowerCase();
              if (normalized === "present" || normalized === "p") return "present";
              if (normalized === "absent" || normalized === "a") return "absent";
              return normalized;
            };
            
            const teacherNormalized = normalizeAttendance(teacherAtt);
            const userNormalized = normalizeAttendance(userAtt);
            
            return teacherNormalized !== userNormalized ? 1 : 0;
          };
          
          const mergedRecord = {
            ...existing,
            user_attendance: manualRecord.user_attendance || existing.user_attendance,
            final_attendance: manualRecord.final_attendance || existing.final_attendance,
            is_entered_by_student: Math.max(manualRecord.is_entered_by_student || 0, existing.is_entered_by_student || 0),
            is_user_override: manualRecord.is_user_override || existing.is_user_override,
            last_user_update: Math.max(
              getTimestamp(manualRecord.last_user_update), 
              getTimestamp(existing.last_user_update)
            ),
            updated_at: Math.max(
              getTimestamp(manualRecord.updated_at), 
              getTimestamp(existing.updated_at)
            ),
          };
          
          // Set conflict flag based on actual data comparison
          mergedRecord.is_conflict = detectConflict(mergedRecord);
          
          existingRecords[existingIndex] = mergedRecord;
        } else {
          // Add new manual record, but first check for conflicts
          const detectConflict = (record: CourseSchedule): number => {
            // If the record was manually resolved (is_conflict was explicitly set to 0), respect that
            if (record.is_conflict === 0 && record.final_attendance) {
              return 0; // Don't override resolved conflicts
            }
            
            const teacherAtt = record.teacher_attendance;
            const userAtt = record.user_attendance;
            
            if (!teacherAtt || !userAtt) return 0;
            
            // Normalize attendance values for comparison
            const normalizeAttendance = (att: string) => {
              const normalized = att.toLowerCase();
              if (normalized === "present" || normalized === "p") return "present";
              if (normalized === "absent" || normalized === "a") return "absent";
              return normalized;
            };
            
            const teacherNormalized = normalizeAttendance(teacherAtt);
            const userNormalized = normalizeAttendance(userAtt);
            
            return teacherNormalized !== userNormalized ? 1 : 0;
          };
          
          // Set conflict flag for the manual record
          const recordWithConflict = {
            ...manualRecord,
            is_conflict: detectConflict(manualRecord)
          };
          
          existingRecords.push(recordWithConflict);
        }
      }
      
      mergedSchedule.set(subjectId, existingRecords);
    }
    
    return mergedSchedule;
  }

  async getCachedCourseSchedule(): Promise<Map<string, CourseSchedule[]> | null> {
    const cachedSchedule = await attendanceCache.getCachedCourseSchedule();
    
    if (cachedSchedule) {
      // Get manual attendance records and merge them
      const manualRecords = await AttendanceDatabase.getAllManualAttendanceRecords();
      return this.mergeCourseScheduleWithManualRecords(cachedSchedule, manualRecords);
    }
    
    // If no cached schedule, return manual records only
    const manualRecords = await AttendanceDatabase.getAllManualAttendanceRecords();
    return manualRecords.size > 0 ? manualRecords : null;
  }
}

export const attendanceService = new AttendanceService();
