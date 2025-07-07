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
} from "../types/api";
import { daysAttended } from "../utils/daysAttended";

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
        { year: number; month: number; day: number; hour: number; attendance?: string }[]
      >
    ) => void
  ): Promise<AttendanceDetailedResponse> {
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedData = await attendanceCache.getCachedAttendanceData();
      const cachedSchedule = await attendanceCache.getCachedCourseSchedule();
      
      if (cachedData && cachedSchedule && setCourseSchedule) {
        setCourseSchedule(cachedSchedule);
        return cachedData;
      } else if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response: AxiosResponse<AttendanceApiResponse> =
        await this.api.post(API_CONFIG.ENDPOINTS.ATTENDANCE.DETAILED, {});
        
      const courseSchedule = daysAttended(response.data);
      
      // Cache the course schedule
      await attendanceCache.cacheCourseSchedule(courseSchedule);
      
      if (setCourseSchedule) {
        setCourseSchedule(courseSchedule);
      }
      
      const transformedData = this.transformAttendanceResponse(response.data);

      // Cache the attendance data
      await attendanceCache.cacheAttendanceData(transformedData);

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
}

export const attendanceService = new AttendanceService();
