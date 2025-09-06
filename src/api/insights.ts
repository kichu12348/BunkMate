import axios from "axios";
const API_URL = process.env.EXPO_PUBLIC_INSIGHTS_URL;
import { API_CONFIG, INSIGHTS_LOGGED_CODE } from "../constants/config";
import { kvHelper } from "../kv/kvStore";

export async function logInsight(title: string) {
  try {
    const insightsLogged = kvHelper.getInsightsLogged();
    if (insightsLogged && insightsLogged.startsWith(INSIGHTS_LOGGED_CODE)) return;
    const formated_title=title.split(" ").join("_");
    const code = `${INSIGHTS_LOGGED_CODE}${formated_title}`;
    await axios.post(`${API_URL}${API_CONFIG.ENDPOINTS.INSIGHTS.LOG}`, {
      title,
      code,
    });
    kvHelper.setInsightsLogged(code);
  } catch (error) {
    console.error("Error logging insight:", error);
  }
}
