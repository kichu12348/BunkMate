import { create } from "zustand";

interface AttendanceBaseState {
  attendanceBase: number;
  setAttendanceBase: (attendanceBase: number) => void;
}

let timeoutId: NodeJS.Timeout | null = null;

export const useAttendanceBaseStore = create<AttendanceBaseState>((set) => ({
  attendanceBase: 75,
  setAttendanceBase: (attendanceBase: number) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      set({ attendanceBase });
    }, 500);
  },
}));
