import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG } from '../constants/config';
import { kvHelper } from '../kv/kvStore';
import { Institution, Course, Subject, ApiError } from '../types/api';

class InstitutionService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = kvHelper.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await kvHelper.clearAuthToken();
        }
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: any): ApiError {
    if (error.response?.data) {
      return {
        error: error.response.data.error || 'API Error',
        message: error.response.data.message || error.message,
        status_code: error.response.status,
      };
    }

    return {
      error: 'Network Error',
      message: error.message || 'Something went wrong',
      status_code: 0,
    };
  }

  async fetchInstitutions(): Promise<Institution[]> {
    try {
      const response: AxiosResponse<Institution[]> = await this.api.get(
        API_CONFIG.ENDPOINTS.INSTITUTIONS
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async fetchCourses(): Promise<Course[]> {
    try {
      const response: AxiosResponse<Course[]> = await this.api.get(
        API_CONFIG.ENDPOINTS.COURSES
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async fetchSubjects(): Promise<Subject[]> {
    try {
      const response: AxiosResponse<Subject[]> = await this.api.get(
        API_CONFIG.ENDPOINTS.SUBJECTS
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const institutionService = new InstitutionService();
