export interface LoginLookupRequest {
  username: string;
}

export interface LoginLookupResponse {
  usernames: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
  stay_logged_in?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  mobile: string;
  settings: {
    default_institutionUser: number;
    default_institute: number;
    default_academic_year: string;
    default_semester: string;
  };
}

export interface UserProfile {
  first_name: string;
  last_name: string;
  user:User;
}

export interface StudentProfile {
  id: number;
  student_id: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'O';
  address?: string;
  academic_year: string;
  academic_semester: string;
  institution: number;
  course: number;
}

export interface Institution {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  is_active: boolean;
}

export interface Course {
  id: number;
  si_no: number;
  name: string;
  code: string;
  start_year: null;
  end_year: null;
  institution_id: number;
  usersubgroup_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  academic_year: string;
  academic_semester: string;
  pre_requisites: null;
  ltp_credits: null;
  reference_docs: null;
  text_books: null;
  course_type_id: number;
  course_category_id: null;
  deleted_at: null;
  enable_laboratory: null;
}

export interface Session {
  id: number;
  name: string;
  time_from: null;
  time_to: null;
  view_order: string;
  institution_id: number;
  deleted_at: null;
  created_at: string | null;
  updated_at: string;
  type: null;
}

export interface AttendanceType {
  id: number;
  name: string;
  code: string;
  color: string;
  view_order: string;
  positive_report_value: number;
  institution_id: number;
  deleted_at: null;
  created_at: null;
  updated_at: string | null;
}

export interface AttendanceRecord {
  course: number | null;
  attendance: number | null;
  marked_by: number | null;
}

export interface DailyAttendance {
  [sessionId: string]: AttendanceRecord;
}

export interface AttendanceApiResponse {
  courses: Record<string, Course>;
  sessions: Record<string, Session>;
  attendanceTypes: Record<string, AttendanceType>;
  studentAttendanceData: Record<string, DailyAttendance>;
}

export interface Notification {
  id: string;
  type: string;
  data: string;
  read_at: string | null;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  credits: number;
  course: number;
  semester: string;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: number;
  student: number;
  subject: number;
  course: number | null;
  attendance: number | null;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  marked_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceDetailedResponse {
  total_subjects: number;
  overall_percentage: number;
  subjects: SubjectAttendance[];
}

export interface SubjectAttendance {
  subject: Subject;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  last_updated: string;
  status: 'safe' | 'warning' | 'danger';
}

export interface ApiError {
  error: string;
  message: string;
  status_code: number;
}

export interface CacheMetadata {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface SetDefaultYearRequest {
  default_academic_year: string; // "0" or "2024-25" format
}

export interface SetDefaultSemesterRequest {
  default_semester: string; // "0", "odd", or "even"
}

export interface AcademicYear {
  value: string;
  label: string;
}

export interface Semester {
  value: string;
  label: string;
}
