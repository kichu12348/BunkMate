import { ThemeColors } from "../types/theme";

export const lightTheme: ThemeColors = {
  background: "#f8f5f2",
  surface: "#ffffff",
  text: "#3d405b",
  textSecondary: "#8d99ae",
  primary: "#5d8bf4",
  secondary: "#8a70d6",
  accent: "#f97316",
  error: "#e57373",
  danger: "#e57373",
  warning: "#f4b740",
  success: "#34d399",
  border: "#e2e2e2",
  shadow: "#00000010",
  info: "#5d8bf4",
};

export const darkTheme: ThemeColors = {
  background: "#0f172a",
  surface: "#1e293b",
  text: "#f1f5f9",
  textSecondary: "#94a3b8",
  accent: "#818cf8",
  primary: "#60a5fa",
  secondary: "#8b5cf6",
  danger: "#f87171",
  warning: "#fbbf24",
  success: "#4ade80",
  border: "#334155",
  shadow: "#00000040",
  error: "#f87171",
  info: "#60a5fa",
};

export const THEME_STORAGE_KEY = "bunkmate_theme_mode";
