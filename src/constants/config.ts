export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL + "/api/v1/Xcr45_salt",
  API_VERSION: "v1",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/login",
      LOOKUP: "/login/lookup",
      USER: "/user",
      RESET: {
        OPTIONS: "/password/reset/options",
        REQUEST: "/password/reset/request",
        VERIFY: "/password/reset",
      },
    },
    ATTENDANCE: {
      DETAILED: "/attendancereports/student/detailed",
      SUMMARY: "/attendancereports/student/summary",
    },
    INSTITUTIONS: "/institutions",
    COURSES: "/courses",
    SUBJECTS: "/subjects",
    NOTIFICATIONS: "/user/notifications",
    MY_PROFILE: "/myprofile",
    EXAMS_AND_ASSIGNMENTS: {
      GET: "/exams",
      GET_QUESTIONS: (id: string) =>
        `/exams/${id}/examquestions?from_view_score=true`,
      GET_ANSWERS: (id: string) => `/exams/${id}/institutionuser/examanswers`,
      GET_Q_GROUPS: (id: string) => `/examorquestiongroups?exam_id=${id}`,
    },
    SET: {
      DEFAULT_YEAR: "/user/setting/default_academic_year",
      DEFAULT_SEMESTER: "/user/setting/default_semester",
    },
    SURVEY: {
      GET: "/studfbsurveys",
    },
    INSIGHTS: {
      LOG: "/insights",
    },
  },
  TIMEOUT: 60000, // 60 seconds
  RETRY_ATTEMPTS: 3,
};

export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  ATTENDANCE_TTL: 10 * 60 * 1000, // 10 minutes
  LONG_TTL: 60 * 60 * 1000, // 1 hour
};

export const ATTENDANCE_THRESHOLDS = {
  DANGER: 75,
  WARNING: 80,
  SAFE: 85,
};

export const APP_CONFIG = {
  NAME: "BunkMate",
  VERSION: "2.0.1",
  DESCRIPTION: "Track your attendance and stay above 75%",
};

import { Easing } from "react-native-reanimated";

export const TAB_BAR_HEIGHT = 80;
export const TIMING_CONFIG = {
  duration: 200,
  easing: Easing.inOut(Easing.ease),
};

export const AUTH_ACCESS_TOKEN = "access_token";
export const SUBSCRIPTION_MODAL_SHOWN = "subscription_modal_shown";
export const THEME_MODE = "mode";
export const INSIGHTS_LOGGED = "insights_logged";
export const INSIGHTS_LOGGED_CODE = "ABCD_12348_";
export const PFP_URL = "pfp_url";
export const WEBSOCKET_TIMEOUT = 3000;

export const CHAT_CONFIG = {
  GET_MESSAGES: (
    offset: number,
    limit: number,
    API_BASE_URL: string,
  ): string => {
    return `${API_BASE_URL}/get-messages/${offset}/${limit}`;
  },
};
