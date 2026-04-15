import { create } from "zustand";
import { parseISO } from "date-fns";
import { DutyLeave } from "../types/dutyLeave";
import { DutyLeaveDatabase } from "../utils/dutyLeaveDatabase";

interface DutyLeaveState {
  dutyLeaves: DutyLeave[];
  isLoading: boolean;
  error: string | null;

  fetchDutyLeaves: () => Promise<void>;
  addDutyLeave: (leave: DutyLeave) => Promise<void>;
  deleteDutyLeave: (id: string) => Promise<void>;
  updateDutyLeave: (id: string, updates: Partial<DutyLeave>) => Promise<void>;
  clearError: () => void;
}

export const useDutyLeaveStore = create<DutyLeaveState>((set, get) => ({
  dutyLeaves: [],
  isLoading: false,
  error: null,

  fetchDutyLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const leaves = await DutyLeaveDatabase.getAllDutyLeaves();
      set({ dutyLeaves: leaves, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || "Failed to fetch duty leaves",
      });
    }
  },

  addDutyLeave: async (leave: DutyLeave) => {
    try {
      await DutyLeaveDatabase.saveDutyLeave(leave);
      set((state) => ({
        dutyLeaves: [leave, ...state.dutyLeaves].sort(
          (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to add duty leave" });
      throw error;
    }
  },

  deleteDutyLeave: async (id: string) => {
    try {
      await DutyLeaveDatabase.deleteDutyLeave(id);
      set((state) => ({
        dutyLeaves: state.dutyLeaves.filter((l) => l.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || "Failed to delete duty leave" });
      throw error;
    }
  },

  updateDutyLeave: async (id: string, updates: Partial<DutyLeave>) => {
    try {
      const currentLeaves = get().dutyLeaves;
      const leaveIndex = currentLeaves.findIndex((l) => l.id === id);
      if (leaveIndex === -1) return;

      const updatedLeave = { ...currentLeaves[leaveIndex], ...updates };
      await DutyLeaveDatabase.updateDutyLeave(updatedLeave);

      const newLeaves = [...currentLeaves];
      newLeaves[leaveIndex] = updatedLeave;
      newLeaves.sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
      );
      set({ dutyLeaves: newLeaves });
    } catch (error: any) {
      set({ error: error.message || "Failed to update duty leave" });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
