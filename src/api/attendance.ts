import axios, { AxiosInstance, AxiosResponse } from "axios";
import { API_CONFIG, ATTENDANCE_THRESHOLDS } from "../constants/config";
import { kvHelper } from "../kv/kvStore";
import {
  AttendanceDetailedResponse,
  SubjectAttendance,
  AttendanceApiResponse,
  Course,
  AttendanceType,
  DailyAttendance,
  ApiError,
  CourseSchedule
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
        const token = kvHelper.getAuthToken();
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

  async fetchAttendanceDetailed(): Promise<{
    transformedData: AttendanceDetailedResponse;
    courseSchedule: Map<string, CourseSchedule[]>;
  }> {
    try {
      const response: AxiosResponse<AttendanceApiResponse> =
        await this.api.post(API_CONFIG.ENDPOINTS.ATTENDANCE.DETAILED, {});

      const courseSchedule = daysAttended(response.data);
      const transformedData = this.transformAttendanceResponse(response.data);
      
      return { transformedData, courseSchedule };

    } catch (error) {
      // If the API fails, there's no cache to fall back on.
      // The store will handle the error.
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
    attendanceTypes: Record<string, AttendanceType>
  ): SubjectAttendance | null {
    let totalClasses = 0;
    let attendedClasses = 0;

    // Process each day's attendance for this course
    Object.values(studentData).forEach((dailyData) => {
      Object.entries(dailyData).forEach(([_sessionId, attendance]) => {
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
}

export const attendanceService = new AttendanceService();
