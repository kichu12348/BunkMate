import axios from "axios";
import type { Message } from "../types/api";
import { CHAT_CONFIG } from "../constants/config";

export const API_BASE_URL = process.env.EXPO_PUBLIC_INSIGHTS_URL!;

export const getMessages = async (
  offset: number,
  limit: number,
): Promise<{ messages: Message[] }> => {
  const response = await axios.get<{ messages: Message[] }>(
    CHAT_CONFIG.GET_MESSAGES(offset, limit, API_BASE_URL),
  );
  return response.data;
};

export const getGifs = async () => {
  const baseUrl = CHAT_CONFIG.TENOR_API_URL;
  const apiKey = CHAT_CONFIG.TENOR_API_KEY;

  const url = `${baseUrl}/featured?key=${apiKey}&limit=30`;
  const response = await axios.get(url);
  return response.data;
};

export const getGifsByQuery = async (query: string) => {
  const baseUrl = CHAT_CONFIG.TENOR_API_URL;
  const apiKey = CHAT_CONFIG.TENOR_API_KEY;

  const url = `${baseUrl}/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=30`;
  const response = await axios.get(url);
  return response.data;
};
