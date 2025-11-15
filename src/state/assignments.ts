import { create } from "zustand";
import AsiignmentsAPI from "../api/assignments";
import { AssignmentData, QA } from "../types/assignments";
import {
  formatAssignmentData,
  mergeQuestionsAndAnswers,
} from "../utils/assignement";

interface AssignmentState {
  assignments: Map<string, AssignmentData[]>;
  fetchAssignments: () => Promise<void>;
  fetchSpecificAssignment: (id: string) => Promise<{
    list: QA[];
    totalScore: number;
    totalMaxMarks: number;
  }>;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: new Map<string, AssignmentData[]>(),
  fetchAssignments: async () => {
    try {
      const data = await AsiignmentsAPI.getAssignments();

      const formattedData = formatAssignmentData(data);
      set({ assignments: formattedData });
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  },

  fetchSpecificAssignment: async (id) => {
    try {
      const { questions, answers, questionGroups } =
        await AsiignmentsAPI.getAssignmentDetails(id);
      return mergeQuestionsAndAnswers(questions, answers, questionGroups);
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    }
  },
}));
