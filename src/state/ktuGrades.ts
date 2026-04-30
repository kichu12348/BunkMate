import { create } from "zustand";
import {
  loginToKtuScraper,
  getGradeCardToken,
  getGradeCard,
  isTimesUp,
} from "../api/ktuScraper";
import {
  upsertLogin,
  getLogin,
  upsertGradeCache,
  getGradeCache,
  deleteLogin,
} from "../db/KtuScrapDb";
import type { Semester, GradeCardResponse } from "../types/gradeCard";

// ── Types ────────────────────────────────────────────────────────

interface KtuGradeState {
  // Credentials (pre-filled from cache)
  username: string;
  password: string;
  credentialsLoaded: boolean;
  // true when the DB already has saved creds for this account
  hasSavedCredentials: boolean;

  // The BunkMate account this KTU session belongs to
  accountId: number | null;
  // The ktu_login row id for the current account (for grade cache FK)
  ktuLoginId: number | null;

  // Session (whether we have a live KTU session right now)
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  loginError: string | null;

  // Grade data
  selectedSemester: Semester;
  gradeCard: GradeCardResponse | null;
  isFetching: boolean;
  fetchError: string | null;
  fromCache: boolean;
  isOld: boolean;

  // Actions
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  setSelectedSemester: (s: Semester) => void;
  loadCachedCredentials: (accountId: number) => Promise<void>;
  /** Manual login — only needed when there are no saved credentials */
  manualLogin: () => Promise<void>;
  /** Fetch grades: cache → auto-login → network → cache result */
  fetchGrades: () => Promise<void>;
  /** Refresh grades: skip cache, auto-login if needed → network */
  refreshGrades: () => Promise<void>;
  /** Forget saved credentials and go back to the login form */
  disconnectKtu: () => void;
}

// ── Ephemeral session state (not reactive) ───────────────────────

let _sessionCookie: string | null = null;
let _csrfToken: string | null = null;
let _sessionStart: number | null = null;
let _isProcessing = false;

function resetSession() {
  _sessionCookie = null;
  _csrfToken = null;
  _sessionStart = null;
  _isProcessing = false;
}

function hasActiveSession(): boolean {
  return (
    !!_sessionCookie &&
    !!_csrfToken &&
    _sessionStart !== null &&
    !isTimesUp(_sessionStart)
  );
}

// ── Helpers ──────────────────────────────────────────────────────

/** Perform KTU login + grab CSRF token. Mutates module-level session vars. */
async function doLogin(uname: string, pwd: string) {
  const loginRes = await loginToKtuScraper(uname, pwd);
  _sessionCookie = loginRes.sessionCookie;

  const tokenRes = await getGradeCardToken(loginRes.sessionCookie);
  _csrfToken = tokenRes.csrfToken;
  _sessionStart = Date.now();
}

/** Ensure we have a live session, auto-logging-in with saved creds if needed. */
async function ensureSession(
  set: (s: Partial<KtuGradeState>) => void,
  get: () => KtuGradeState,
): Promise<boolean> {
  if (hasActiveSession()) return true;

  const { username, password } = get();
  const uname = username.trim();
  const pwd = password.trim();

  if (!uname || !pwd) {
    set({ loginError: "No saved credentials. Please log in." });
    return false;
  }

  set({ isLoggingIn: true, loginError: null });
  try {
    await doLogin(uname, pwd);
    set({ isLoggedIn: true, isLoggingIn: false });
    return true;
  } catch (e: any) {
    resetSession();
    set({
      isLoggedIn: false,
      isLoggingIn: false,
      loginError: e?.message || "Auto-login failed. Please try again.",
    });
    return false;
  }
}

// ── Store ────────────────────────────────────────────────────────

const useKtuGradeStore = create<KtuGradeState>((set, get) => ({
  // ── Initial state ──────────────────────────────────────────────
  username: "",
  password: "",
  credentialsLoaded: false,
  hasSavedCredentials: false,

  accountId: null,
  ktuLoginId: null,

  isLoggedIn: false,
  isLoggingIn: false,
  loginError: null,

  selectedSemester: "1",
  gradeCard: null,
  isFetching: false,
  fetchError: null,
  fromCache: false,
  isOld: false,

  // ── Setters ────────────────────────────────────────────────────
  setUsername: (v) => set({ username: v }),
  setPassword: (v) => set({ password: v }),
  setSelectedSemester: (s) =>
    set({
      selectedSemester: s,
      gradeCard: null,
      fetchError: null,
      fromCache: false,
    }),

  // ── Load cached credentials from DB ────────────────────────────
  loadCachedCredentials: async (accountId) => {
    const prev = get().accountId;
    if (prev !== null && prev !== accountId) {
      // Account switched — invalidate everything
      resetSession();
      set({
        isLoggedIn: false,
        gradeCard: null,
        fetchError: null,
        loginError: null,
        fromCache: false,
        ktuLoginId: null,
        hasSavedCredentials: false,
        username: "",
        password: "",
      });
    }

    set({ accountId });

    try {
      const cached = await getLogin({ accountId });
      if (cached) {
        set({
          username: cached.username,
          password: cached.password,
          ktuLoginId: cached.id,
          hasSavedCredentials: true,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ credentialsLoaded: true });
    }
  },

  // ── Manual login (only when no saved credentials) ──────────────
  manualLogin: async () => {
    const { username, password, accountId } = get();
    const uname = username.trim();
    const pwd = password.trim();

    if (!uname || !pwd) {
      set({ loginError: "Username and password are required." });
      return;
    }
    if (_isProcessing) return;

    _isProcessing = true;
    set({ isLoggingIn: true, loginError: null });

    try {
      await doLogin(uname, pwd);
      set({ isLoggedIn: true, hasSavedCredentials: true });

      // Persist credentials for next time
      if (accountId) {
        try {
          const row = await upsertLogin({
            accountId,
            username: uname,
            password: pwd,
          });
          if (row) set({ ktuLoginId: row.id });
        } catch {
          // non-fatal
        }
      }
    } catch (e: any) {
      set({
        loginError: e?.message || "Login failed. Check your credentials.",
      });
    } finally {
      _isProcessing = false;
      set({ isLoggingIn: false });
    }
  },

  // ── Fetch grades (cache → auto-login → network → cache) ───────
  fetchGrades: async () => {
    if (_isProcessing) return;
    const { selectedSemester, ktuLoginId } = get();
    const semNum = parseInt(selectedSemester, 10);

    set({ isFetching: true, fetchError: null, fromCache: false });
    // 1. Try cache
    if (ktuLoginId) {
      try {
        const cached = await getGradeCache({
          loginId: ktuLoginId,
          semester: semNum,
        });
        if (cached) {
          set({
            gradeCard: cached.data,
            fromCache: true,
            isFetching: false,
            isOld: cached.isOld,
          });
          return;
        }
      } catch {
        // cache miss — fall through
      }
    }

    // 2. Ensure we have an active session (auto-login if expired/missing)
    _isProcessing = true;
    const ok = await ensureSession(set, get);
    if (!ok) {
      _isProcessing = false;
      set({ isFetching: false });
      return;
    }

    // 3. Fetch from network
    try {
      const result = await getGradeCard({
        sessionCookie: _sessionCookie!,
        csrfToken: _csrfToken!,
        semester: selectedSemester,
      });
      set({ gradeCard: result, isOld: false });

      // Save to cache (best-effort, skip empty / unavailable results)
      const loginId = get().ktuLoginId;
      if (loginId) {
        if (result.courses.length >= 1 && result.sgpa !== "Not Available") {
          try {
            await upsertGradeCache({
              loginId,
              semester: semNum,
              grades: result,
            });
          } catch {
            // non-fatal
          }
        }
      }
    } catch {
      resetSession();
      set({
        isLoggedIn: false,
        fetchError: "Could not fetch grade card. Please try again.",
      });
    } finally {
      _isProcessing = false;
      set({ isFetching: false });
    }
  },

  // ── Refresh grades (bypass cache, auto-login → network) ────────
  refreshGrades: async () => {
    if (_isProcessing) return;
    const { selectedSemester } = get();

    _isProcessing = true;
    set({ isFetching: true, fetchError: null, fromCache: false });

    const ok = await ensureSession(set, get);
    if (!ok) {
      _isProcessing = false;
      set({ isFetching: false });
      return;
    }

    try {
      const result = await getGradeCard({
        sessionCookie: _sessionCookie!,
        csrfToken: _csrfToken!,
        semester: selectedSemester,
      });
      set({ gradeCard: result });

      const loginId = get().ktuLoginId;
      if (loginId) {
        try {
          await upsertGradeCache({
            loginId,
            semester: parseInt(selectedSemester, 10),
            grades: result,
          });
        } catch {
          // non-fatal
        }
      }
    } catch {
      resetSession();
      set({
        isLoggedIn: false,
        fetchError: "Could not fetch grade card. Please try again.",
      });
    } finally {
      _isProcessing = false;
      set({ isFetching: false });
    }
  },

  // ── Disconnect KTU (forget saved creds, back to login form) ────
  disconnectKtu: () => {
    const { accountId } = get();
    resetSession();

    // Delete from DB (fire-and-forget)
    if (accountId) {
      deleteLogin({ accountId }).catch(() => {});
    }

    set({
      username: "",
      password: "",
      hasSavedCredentials: false,
      isLoggedIn: false,
      isLoggingIn: false,
      loginError: null,
      selectedSemester: "1",
      gradeCard: null,
      isFetching: false,
      fetchError: null,
      fromCache: false,
      ktuLoginId: null,
      // Keep accountId — still the same BunkMate account
    });
  },
}));

export default useKtuGradeStore;
