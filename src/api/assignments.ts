import { API_CONFIG } from "../constants/config";
import axios, { AxiosInstance } from "axios";
import { kvHelper } from "../kv/kvStore";
import { ApiError } from "../types/api";
import { Answer, Question, QuestionGroup, SubjectAssignments } from "../types/assignments";

class AssignmentsAPI {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = kvHelper.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(this.handleApiError(error))
    );
  }

  private handleApiError(error: any): ApiError {
    if (error.response?.data) {
      return {
        error: error.response.data.error || "API Error",
        message: error.response.data.message || error.message,
        status_code: error.response.status,
      };
    }

    return {
      error: "Network Error",
      message: error.message || "Something went wrong",
      status_code: 0,
    };
  }

  async getAssignments(): Promise<SubjectAssignments[]> {
    try {
      const response = await this.api.get(
        API_CONFIG.ENDPOINTS.EXAMS_AND_ASSIGNMENTS.GET
      );
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getAssignmentDetails(id: string): Promise<{
    questions: Question[];
    answers: Answer[];
    questionGroups: QuestionGroup[];
  }> {
    try {
      const [qResponse, aResponse, qGroupResponse] = await Promise.all([
        this.api.get(
          API_CONFIG.ENDPOINTS.EXAMS_AND_ASSIGNMENTS.GET_QUESTIONS(id)
        ),
        this.api.get(
          API_CONFIG.ENDPOINTS.EXAMS_AND_ASSIGNMENTS.GET_ANSWERS(id)
        ),
        this.api.get(
          API_CONFIG.ENDPOINTS.EXAMS_AND_ASSIGNMENTS.GET_Q_GROUPS(id)
        ),
      ]);
      return {
        questions: qResponse.data,
        answers: aResponse.data,
        questionGroups: qGroupResponse.data,
      };
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

export default new AssignmentsAPI();
