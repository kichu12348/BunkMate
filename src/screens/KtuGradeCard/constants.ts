import { Semester } from "../../types/gradeCard";

export const SEMESTERS: { label: string; value: Semester }[] = [
  { label: "S1", value: "1" },
  { label: "S2", value: "2" },
  { label: "S3", value: "3" },
  { label: "S4", value: "4" },
  { label: "S5", value: "5" },
  { label: "S6", value: "6" },
  { label: "S7", value: "7" },
  { label: "S8", value: "8" },
];

export const GRADE_COLORS: Record<string, string> = {
  S: "#22c55e",
  "A+": "#4ade80",
  A: "#86efac",
  "B+": "#facc15",
  B: "#fb923c",
  C: "#f87171",
  P: "#60a5fa",
  F: "#ef4444",
  FE: "#ef4444",
  AB: "#9ca3af",
};

export function gradeColor(grade: string, fallback: string): string {
  return GRADE_COLORS[grade?.toUpperCase()] ?? fallback;
}
