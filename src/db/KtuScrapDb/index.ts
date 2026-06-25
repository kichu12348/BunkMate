import { database } from "../database";
import type { GradeCardResponse } from "../../types/gradeCard";

// ── Types ────────────────────────────────────────────────────────

export interface KtuLogin {
  id: number;
  account_id: number;
  username: string;
  password: string;
}

interface GradeCache {
  login_id: number;
  semester: number;
  grades: string; // JSON-stringified GradeCardResponse
  created_at: string;
}

// ── Login CRUD ───────────────────────────────────────────────────

export async function upsertLogin({
  accountId,
  username,
  password,
}: {
  accountId: number;
  username: string;
  password: string;
}): Promise<KtuLogin | null> {
  const db = database.getDatabase();
  // UNIQUE constraint on account_id allows INSERT OR REPLACE to
  // update existing credentials when the account already has a row.
  const result = await db.getFirstAsync<KtuLogin>(
    `INSERT INTO ktu_login (account_id, username, password)
     VALUES (?, ?, ?)
     ON CONFLICT(account_id) DO UPDATE SET username = excluded.username, password = excluded.password
     RETURNING *`,
    [accountId, username, password],
  );
  return result ?? null;
}

export async function getLogin({
  accountId,
}: {
  accountId: number;
}): Promise<KtuLogin | null> {
  const db = database.getDatabase();
  const result = await db.getFirstAsync<KtuLogin>(
    `SELECT * FROM ktu_login WHERE account_id = ?`,
    [accountId],
  );
  return result ?? null;
}

export async function deleteLogin({
  accountId,
}: {
  accountId: number;
}): Promise<void> {
  const db = database.getDatabase();
  await db.runAsync(`DELETE FROM ktu_login WHERE account_id = ?`, [accountId]);
}

// ── Grade Cache CRUD ─────────────────────────────────────────────

export async function upsertGradeCache({
  loginId,
  semester,
  grades,
}: {
  loginId: number;
  semester: number;
  grades: GradeCardResponse;
}): Promise<void> {
  const db = database.getDatabase();
  await db.runAsync(
    `INSERT INTO grade_cache (login_id, semester, grades, created_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(login_id, semester) DO UPDATE SET grades = excluded.grades, created_at = CURRENT_TIMESTAMP`,
    [loginId, semester, JSON.stringify(grades)],
  );
}

export async function getGradeCache({
  loginId,
  semester,
}: {
  loginId: number;
  semester: number;
}): Promise<{
  data: GradeCardResponse;
  isOld: boolean;
} | null> {
  const db = database.getDatabase();
  const result = await db.getFirstAsync<GradeCache>(
    `SELECT * FROM grade_cache WHERE login_id = ? AND semester = ?`,
    [loginId, semester],
  );
  if (!result) return null;
  try {
    const createdAt = new Date(result.created_at);
    const isOld = Date.now() - createdAt.getTime() > 2592000000; // 30 days old
    const data = JSON.parse(result.grades);
    return { data, isOld };
  } catch {
    return null;
  }
}