export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL+"/api/v1/Xcr45_salt",
  API_VERSION: 'v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/login',
      LOOKUP: '/login/lookup',
      USER:'/user'
    },
    ATTENDANCE: {
      DETAILED: '/attendancereports/student/detailed',
      SUMMARY: '/attendancereports/student/summary',
    },
    INSTITUTIONS: '/institutions',
    COURSES: '/courses',
    SUBJECTS: '/subjects',
    NOTIFICATIONS: '/user/notifications',
    MY_PROFILE: '/myprofile',
    SET:{
        DEFAULT_YEAR:"/user/setting/default_academic_year",
        DEFAULT_SEMESTER:"/user/setting/default_semester", 
    },
    SURVEY:{
      GET:'/studfbsurveys'
    }
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
  NAME: 'BunkMate',
  VERSION: '1.0.0',
  DESCRIPTION: 'Track your attendance and stay above 75%',
};
