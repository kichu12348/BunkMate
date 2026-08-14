import axios, { AxiosError } from "axios";
import { UPDATE_API_CONFIG } from "../constants/config";
import type { AppVersion, AppVersionError } from "../types/update";

export async function getAppVersion(): Promise<AppVersion | AppVersionError> {
  try {
    const response = await axios.get<AppVersion | AppVersionError>(
      UPDATE_API_CONFIG.VERSION,
    );
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      return (
        error.response?.data || { success: false, message: "Unknown error" }
      );
    }
    return { success: false, message: "Unknown error" };
  }
}
