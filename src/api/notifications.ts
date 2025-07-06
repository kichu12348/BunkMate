import axios, { AxiosInstance } from "axios";
import { API_CONFIG } from "../constants/config";
import { kvHelper } from "../kv/kvStore";

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data?: string;
  read_at: string | null;
  created_at: string;
  updated_at?: string;
}


export interface MarkNotificationReadRequest {
  notification_id: number;
}

class NotificationsService {
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
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await this.api.get(API_CONFIG.ENDPOINTS.NOTIFICATIONS);
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  async markAsRead(notificationId: number): Promise<void> {}

  async markAllAsRead(): Promise<void> {}

  async deleteNotification(notificationId: number): Promise<void> {}
}

export const notificationsService = new NotificationsService();
