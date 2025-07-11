import { ATTENDANCE_THRESHOLDS } from '../constants/config';

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const getAttendanceStatus = (percentage: number): 'safe' | 'warning' | 'danger' => {
  if (percentage < ATTENDANCE_THRESHOLDS.DANGER) return 'danger';
  if (percentage < ATTENDANCE_THRESHOLDS.WARNING) return 'warning';
  return 'safe';
};

export const getStatusColor = (status: 'safe' | 'warning' | 'danger'): string => {
  switch (status) {
    case 'safe':
      return '#22c55e'; // green
    case 'warning':
      return '#f59e0b'; // yellow
    case 'danger':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const calculateClassesToAttend = (
  currentPercentage: number,
  totalClasses: number,
  targetPercentage: number = ATTENDANCE_THRESHOLDS.DANGER
): number => {
  if (currentPercentage >= targetPercentage) return 0;
  
  const attendedClasses = Math.round((currentPercentage / 100) * totalClasses);
  const requiredAttendedClasses = Math.ceil((targetPercentage / 100) * totalClasses);
  
  return Math.max(0, requiredAttendedClasses - attendedClasses);
};

export const calculateClassesCanMiss = (
  currentPercentage: number,
  totalClasses: number,
  targetPercentage: number = ATTENDANCE_THRESHOLDS.DANGER
): number => {
  if (currentPercentage <= targetPercentage) return 0;
  
  const attendedClasses = Math.round((currentPercentage / 100) * totalClasses);
  const minRequiredClasses = Math.ceil((targetPercentage / 100) * totalClasses);
  
  return Math.max(0, attendedClasses - minRequiredClasses);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const generateAcademicYears = (): Array<{ value: string; label: string }> => {
  const currentYear = new Date().getFullYear();
  const years = [{ value: '0', label: 'All Years' }];
  
  // Start from 2023-24 to current year + 1
  for (let year = 2023; year <= currentYear; year++) {
    const nextYear = year + 1;
    const value = `${year}-${nextYear.toString().slice(-2)}`;
    years.push({
      value,
      label: value
    });
  }
  
  return years;
};

export const generateSemesters = (): Array<{ value: string; label: string }> => {
  return [
    { value: '0', label: 'All Semesters' },
    { value: 'odd', label: 'Odd Semester' },
    { value: 'even', label: 'Even Semester' }
  ];
};

export const getDefaultAcademicYear = (): string => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-based month
  
  // Academic year typically starts in June/July
  if (currentMonth >= 6) {
    return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
};

export const getDefaultSemester = (): string => {
  const currentMonth = new Date().getMonth() + 1;
  
  // Odd semester: June-December, Even semester: January-May
  if (currentMonth >= 6) {
    return 'odd';
  } else {
    return 'even';
  }
};
