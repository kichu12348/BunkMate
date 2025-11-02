import { ThemeColors } from "../types/theme";

export const loaderColorsLight = [
  "#0f172a", // Deep Navy
  "#334155", // Slate Blue
  "#64748b", // Cool Gray-Blue
  "#2563eb", // Bright Blue
  "#059669", // Emerald
  "#f59e0b", // Golden Amber
  "#ef4444", // Vibrant Red
  "#8b5cf6"  // Violet
];

export const loaderColorsDark = [
  "#f8fafc", // Off-White
  "#94a3b8", // Cool Silver
  "#38bdf8", // Sky Blue
  "#60a5fa", // Blue Glow
  "#34d399", // Mint Green
  "#facc15", // Yellow Bright
  "#fb7185", // Coral Pink
  "#c084fc"  // Soft Lavender
];


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
  loaderColors: loaderColorsLight,
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
  loaderColors: loaderColorsDark,
};

export const THEME_STORAGE_KEY = "bunkmate_theme_mode";
