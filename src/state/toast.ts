import { create } from "zustand";
import type { ToastState } from "../types/toast";

let timeOutId: NodeJS.Timeout | null = null;

export const useToastStore = create<ToastState>((set) => ({
  title: null,
  message: null,
  isVisible: false,
  buttons: [],
  showToast: ({ title, message, buttons, delay = 3000 }) => {
    if (timeOutId) {
      clearTimeout(timeOutId);
      timeOutId = null;
    }
    set({ message, isVisible: true, buttons, title });
    timeOutId = setTimeout(() => set({ isVisible: false }), delay);
  },

  hideToast: () => {
    set({ isVisible: false });
    if (timeOutId) {
      clearTimeout(timeOutId);
      timeOutId = null;
    }
  },
}));
