import axios, { AxiosInstance, AxiosResponse } from "axios";
import { API_CONFIG } from "../constants/config";
import { kvHelper } from "../kv/kvStore";
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  ApiError, 
  UserProfile
} from "../types/api";

class AuthService {
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
      async (config) => {
        const token = await kvHelper.getAuthToken();
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
          // Token expired, clear it
          await kvHelper.clearAuthToken();
        }
        return Promise.reject(this.handleApiError(error));
      }
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

  async lookupUsername(username: string): Promise<{ users: string[] }> {
    try {
      const response: AxiosResponse<{ users: string[] }> = await this.api.post(
        API_CONFIG.ENDPOINTS.AUTH.LOOKUP,
        { username }
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response: AxiosResponse<LoginResponse> = await this.api.post(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        {
          username: credentials.username,
          password: credentials.password,
          stay_logged_in: credentials.stay_logged_in ?? true
        }
      );

      // Store the token
      await kvHelper.setAuthToken(response.data.access_token);

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response: AxiosResponse<UserProfile> = await this.api.get(
        API_CONFIG.ENDPOINTS.MY_PROFILE
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async logout(): Promise<void> {
    await kvHelper.clearAuthToken();
  }

  async refreshToken(): Promise<string | null> {
    const access_token = await kvHelper.getAuthToken();
    if (!access_token) {
      return null; // No token to refresh
    }
    return access_token; // Return the current token
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await kvHelper.getAuthToken();
    return !!token;
  }

  async getCurrentToken(): Promise<string | null> {
    return await kvHelper.getAuthToken();
  }

  async setDefaultYear(year: string): Promise<void> {
    try {
      await this.api.post(API_CONFIG.ENDPOINTS.SET.DEFAULT_YEAR, {
        default_academic_year: year
      });
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async setDefaultSemester(semester: string): Promise<void> {
    try {
      await this.api.post(API_CONFIG.ENDPOINTS.SET.DEFAULT_SEMESTER, {
        default_semester: semester
      });
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
}

export const authService = new AuthService();
