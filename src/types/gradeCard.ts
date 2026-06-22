export type Semester = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";

interface Course {
  course: string;
  credits: string;
  grade: string;
  code?: string;
  monthYear?: string; // Optional, only available in the grade card view
}

export interface GradeCardResponse {
  semester: Semester;
  sgpa: string;
  totalCredits?: string; // Optional, only available in the grade card view
  earnedCredits?: string; // Optional, only available in the grade card view
  courses: Course[];
}

export interface GradeCardLoginResponse {
  sessionCookie: string;
  messages: string;
}

export interface GradeCardTokenResponse {
  csrfToken: string;
}
