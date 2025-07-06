import { ThemeColors } from '../types/theme';

export const lightTheme: ThemeColors = {
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#1e293b',
  textSecondary: '#64748b',
  accent: '#5c67f2',
  primary: '#3b82f6',
  secondary: '#6366f1',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
  border: '#e2e8f0',
  shadow: '#00000010',
  error: '#ef4444',
  info: '#3b82f6',
};

export const darkTheme: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  accent: '#818cf8',
  primary: '#60a5fa',
  secondary: '#8b5cf6',
  danger: '#f87171',
  warning: '#fbbf24',
  success: '#4ade80',
  border: '#334155',
  shadow: '#00000040',
  error: '#f87171',
  info: '#60a5fa',
};

export const THEME_STORAGE_KEY = 'bunkmate_theme_mode';
