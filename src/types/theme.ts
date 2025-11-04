export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  primary: string;
  secondary: string;
  danger: string;
  warning: string;
  success: string;
  border: string;
  shadow: string;
  error: string;
  info: string;
  overlay: string;
  loaderColors: string[];
}

export interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  initializeTheme: (appearance: "light" | "dark") => Promise<void>;
}
