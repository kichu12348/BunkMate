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
  "#1e293b", // Deep Slate (base tone, replaces off-white)
  "#64748b", // Cool Steel (replaces silver, adds contrast)
  "#0ea5e9", // Vibrant Sky Blue (strong glow)
  "#3b82f6", // Electric Blue
  "#10b981", // Fresh Mint Glow
  "#eab308", // Golden Yellow (warmer pop)
  "#f43f5e", // Coral Red (deeper, more neon on dark)
  "#a855f7"  // Bright Lavender (keeps that soft energy)
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
  overlay: "#00000080",
  loaderColors: loaderColorsLight,
};

export const darkTheme: ThemeColors = {
  background: "#0f1117",      // deep navy-charcoal; feels premium, not flat black
  surface: "#181b24",         // slightly lighter for cards/surfaces, keeps depth
  text: "#f8f9fa",            // crisp but not pure white
  textSecondary: "#b0b7c3",   // soft cool tone, matches the light theme’s calm
  primary: "#6ea8fe",         // brightened version of light mode primary
  secondary: "#a58cff",       // keeps the lavender tone vibrant on dark
  accent: "#ff8b3d",          // rich orange pop — killer for CTA/hover
  error: "#ef5350",           // balanced red that doesn’t glare
  danger: "#ef5350",          // same tone for consistency
  warning: "#f4c04e",         // warm golden, readable and natural
  success: "#3ddc97",         // cool mint-green pop
  border: "#2a2d36",          // just enough separation without harsh contrast
  shadow: "#00000090",        // deeper shadow for real depth
  info: "#6ea8fe",            // same as primary
  overlay: "#000000B3",       // 70% opacity black for overlays
  loaderColors: loaderColorsDark,
};

export const THEME_STORAGE_KEY = "bunkmate_theme_mode";
