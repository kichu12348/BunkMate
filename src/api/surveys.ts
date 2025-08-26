import axios, { AxiosInstance } from "axios";
import { API_CONFIG } from "../constants/config";
import { kvHelper } from "../kv/kvStore";


export interface SurveyPivot {
  student_id: number;
  stud_f_b_survey_id: number;
  end_at: string | null;
}

export interface UsergroupSettings {
  vision: string;
  mission: string;
  attainment_calculation_method: {
    boardexam: number;
    assessment: number;
    assignment: number;
  };
}

export interface Usergroup {
  id: number;
  name: string;
  description: string | null;
  code: string;
  affiliated_university: string;
  scheme: string;
  maingroup_id: number;
  start_year: string | null;
  end_year: string | null;
  institution_id: number;
  settings: UsergroupSettings;
  disable_manual_activity_name: number;
  created_by: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  programme_type_id: number;
}

export interface UserSubgroup {
  id: number;
  si_no: string;
  name: string;
  description: string | null;
  code: string;
  type: string | null;
  end_date: string | null;
  start_date: string | null;
  start_year: string;
  end_year: string;
  usergroup_id: number;
  institution_id: number;
  created_by: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  academic_year: string;
  academic_semester: string;
  usergroup?: Usergroup;
}

export interface Course {
  id: number;
  si_no: number;
  name: string;
  code: string;
  start_year: string | null;
  end_year: string | null;
  institution_id: number;
  usersubgroup_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  academic_year: string;
  academic_semester: string;
  pre_requisites: string | null;
  ltp_credits: string | null;
  reference_docs: string | null;
  text_books: string | null;
  course_type_id: number;
  course_category_id: string | null;
  deleted_at: string | null;
  enable_laboratory: string | null;
  usersubgroup?: UserSubgroup;
}

export interface Survey {
  id: number;
  name: string;
  summary: string | null;
  academic_year: string;
  start_at: string;
  end_at: string;
  time_required: string | null;
  grouping_tag: string | null;
  survey_type: "course_exit" | "student_feedback";
  survey_mode: "online";
  comment_feedback: number;
  hidden: number;
  is_anonymous: number;
  course_id: number | null;
  usersubgroup_id: number | null;
  institution_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  pivot: SurveyPivot;
  course: Course | null;
  usersubgroup: UserSubgroup | null;
}

interface StudentFeedbackSurveyAnswer {
  course_id: number | null;
  teacher_id: number | null;
  survey_question_id: number;
  survey_choice_id: number;
  answer: "" | string;
}

export type SurveyApiResponse = Survey[];

class SurveysService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = kvHelper.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          kvHelper.clearAuthToken();
        }
        return Promise.reject(error);
      }
    );
  }

  async fetchSurveys(): Promise<SurveyApiResponse> {
    try {
      const response = await this.api.get(API_CONFIG.ENDPOINTS.SURVEY.GET);
      return response.data;
    } catch (error) {
      console.error("Error fetching surveys:", error);
      throw error;
    }
  }

  async getSurveyDetail(surveyId: number): Promise<any> {
    try {
      const response = await this.api.get(
        `${API_CONFIG.ENDPOINTS.SURVEY.GET}/${surveyId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching survey detail:", error);
      throw error;
    }
  }

  async startSurvey(surveyId: number): Promise<any> {
    try {
      const response = await this.api.get(
        `${API_CONFIG.ENDPOINTS.SURVEY.GET}/${surveyId}/start`
      );
      return response.data;
    } catch (error) {
      console.error("Error starting survey:", error);
      throw error;
    }
  }

  async submitSurvey(
    surveyId: number,
    responses: StudentFeedbackSurveyAnswer[]
  ): Promise<void> {
    try {
      await this.api.post(
        `${API_CONFIG.ENDPOINTS.SURVEY.GET}/${surveyId}/studfbsurveyanswer`,
        { studfbsurveyanswers: responses }
      );
    } catch (error) {
      console.error("Error submitting survey:", error);
      throw error;
    }
  }

  async getSurveyDetails(surveyId: number): Promise<any> {
    try {
      const response = await this.api.get(`/surveys/${surveyId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching survey details:", error);
      throw error;
    }
  }
}

export const surveysService = new SurveysService();
