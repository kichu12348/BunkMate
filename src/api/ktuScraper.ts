import axios from "axios";
import { KTU_SCRAPER_CONFIG } from "../constants/config";
import type {
  GradeCardResponse,
  GradeCardLoginResponse,
  GradeCardTokenResponse,
  Semester,
} from "../types/gradeCard";

const client = axios.create({
  baseURL: KTU_SCRAPER_CONFIG.BASE_URL,
});

export async function loginToKtuScraper(
  username: string,
  password: string,
): Promise<GradeCardLoginResponse> {
  try {
    if (
      !username ||
      !password ||
      username.trim() === "" ||
      password.trim() === ""
    ) {
      throw new Error("Username and password are required");
    }
    const response = await client.post<GradeCardLoginResponse>(
      KTU_SCRAPER_CONFIG.login,
      {
        username: username.trim(),
        password: password.trim(),
      },
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to login to KTU Scraper");
  }
}

export async function getGradeCardToken(
  sessionCookie: string,
): Promise<GradeCardTokenResponse> {
  try {
    const response = await client.post<GradeCardTokenResponse>(
      KTU_SCRAPER_CONFIG.getCsrfToken,
      { sessionCookie },
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to get grade card token");
  }
}

export async function getGradeCard({
  sessionCookie,
  csrfToken,
  semester,
}: {
  sessionCookie: string;
  csrfToken: string;
  semester: Semester;
}): Promise<GradeCardResponse> {
  try {
    const response = await client.post<GradeCardResponse>(
      KTU_SCRAPER_CONFIG.getGradeCard,
      {
        sessionCookie,
        csrfToken,
        semester,
      },
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to get grade card");
  }
}

export function isTimesUp(startTime: number): boolean {
  const currentTime = Date.now();
  return currentTime - startTime > KTU_SCRAPER_CONFIG.timeLimit;
}
