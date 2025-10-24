import axios from "axios";
import type { Message } from "../types/api";

export const API_BASE_URL = process.env.EXPO_PUBLIC_INSIGHTS_URL;

export const getMessages = async (
  offset: number,
  limit: number
): Promise<{ messages: Message[] }> => {
  const response = await axios.get<{ messages: Message[] }>(
    `${API_BASE_URL}/get-messages/${offset}/${limit}`
  );
  return response.data;
};
