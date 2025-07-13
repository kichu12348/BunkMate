import { create } from "zustand";
import { surveysService, Survey } from "../api/surveys";

interface SurveysState {
  surveys: Survey[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Filter states
  filterType: "all" | "pending" | "completed" | "expired";

  // Actions
  fetchSurveys: (forceRefresh?: boolean) => Promise<void>;
  refreshSurveys: () => Promise<void>;
  setFilter: (filter: "all" | "pending" | "completed" | "expired") => void;
  getFilteredSurveys: () => Survey[];
  getSurveyById: (id: number) => Survey | null;
  markSurveyCompleted: (surveyId: number) => void;
  setError: (error: string | null) => void;
  clearSurveys: () => void;
  removeSurvey: (surveyId: number) => void;
}

export const useSurveysStore = create<SurveysState>()((set, get) => ({
  surveys: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  filterType: "all",

  fetchSurveys: async (forceRefresh = false) => {
    const state = get();

    if (!forceRefresh && state.surveys.length > 0 && state.lastUpdated) {
      const timeDiff = Date.now() - state.lastUpdated.getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (timeDiff < fiveMinutes) {
        return; // Use cached data if less than 5 minutes old
      }
    }

    set({ isLoading: true, error: null });

    try {
      const surveys = await surveysService.fetchSurveys();

      set({
        surveys,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch surveys",
        isLoading: false,
      });
    }
  },

  refreshSurveys: async () => {
    await get().fetchSurveys(true);
  },

  setFilter: (filter) => {
    set({ filterType: filter });
  },

  getFilteredSurveys: () => {
    const { surveys, filterType } = get();
    const now = new Date();

    switch (filterType) {
      case "pending":
        return surveys.filter((survey) => {
          const endDate = new Date(survey.end_at);
          const hasCompleted = survey.pivot.end_at !== null;
          return !hasCompleted && endDate > now;
        });

      case "completed":
        return surveys.filter((survey) => survey.pivot.end_at !== null);

      case "expired":
        return surveys.filter((survey) => {
          const endDate = new Date(survey.end_at);
          const hasCompleted = survey.pivot.end_at !== null;
          return !hasCompleted && endDate <= now;
        });

      case "all":
      default:
        return surveys;
    }
  },

  getSurveyById: (id: number) => {
    const { surveys } = get();
    return surveys.find((survey) => survey.id === id) || null;
  },

  markSurveyCompleted: (surveyId: number) => {
    const { surveys } = get();
    const updatedSurveys = surveys.map((survey) =>
      survey.id === surveyId
        ? {
            ...survey,
            pivot: { ...survey.pivot, end_at: new Date().toISOString() },
          }
        : survey
    );

    set({ surveys: updatedSurveys });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  removeSurvey: (surveyId: number) => {
    const { surveys } = get();
    const updatedSurveys = surveys.filter((survey) => survey.id !== surveyId);
    set({ surveys: updatedSurveys });
  },

  clearSurveys: () => {
    set({
      surveys: [],
      lastUpdated: null,
      error: null,
      filterType: "all",
    });
  },
}));
