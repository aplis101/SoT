"use client";
import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { Recording, Report, ContentReport, AppSettings, RecordingView, Profile } from "./types";
import {
  MOCK_RECORDINGS, MOCK_LIKES, MOCK_FAVORITES, MOCK_REPORTS, MOCK_CONTENT_REPORTS,
  MOCK_SETTINGS, MOCK_PROFILES, CURRENT_USER_ID, ADMIN_USER_ID,
} from "./mock-data";
import { evaluateReportState, isCommunityBest } from "./algorithms";

const STORAGE_KEY = "hadith-prototype-state-v1";

type Pair = { recording_id: string; user_id: string };

export interface AppState {
  sessionUserId: string | null;
  viewAsAdmin: boolean;
  profiles: Profile[];
  recordings: Recording[];
  likes: Pair[];
  favorites: Pair[];
  reports: Report[];
  contentReports: ContentReport[];
  settings: AppSettings;
  uploadTimestamps: string[];
  toast: { id: number; text: string; kind: "ok" | "err" | "info" } | null;
}

const initialState: AppState = {
  sessionUserId: null,
  viewAsAdmin: false,
  profiles: MOCK_PROFILES,
  recordings: MOCK_RECORDINGS,
  likes: MOCK_LIKES,
  favorites: MOCK_FAVORITES,
  reports: MOCK_REPORTS,
  contentReports: MOCK_CONTENT_REPORTS,
  settings: MOCK_SETTINGS,
  uploadTimestamps: [],
  toast: null,
};

type Action =
  | { type: "LOAD"; payload: Partial<AppState> }
  | { type: "LOGIN"; asAdmin: boolean }
  | { type: "LOGOUT" }
  | { type: "TOGGLE_LIKE"; recordingId: string }
  | { type: "TOGGLE_FAVORITE"; recordingId: string }
  | { type: "COUNT_LISTEN"; recordingId: string }
  | { type: "ADD_RECORDING"; recording: Recording }
  | { type: "DELETE_RECORDING"; recordingId: string }
  | { type: "SUBMIT_REPORT"; report: Report }
  | { type: "SUBMIT_CONTENT_REPORT"; report: ContentReport }
  | { type: "RESOLVE_REPORT"; reportId: string; status: Report["status"] }
  | { type: "RESOLVE_CONTENT_REPORT"; reportId: string; status: Report["status"] }
  | { type: "SET_VERIFIED"; recordingId: string; value: boolean }
  | { type: "SET_HIDDEN"; recordingId: string; value: boolean }
  | { type: "UPDATE_SETTING"; key: keyof AppSettings; value: number | boolean }
  | { type: "TOAST"; text: string; kind?: "ok" | "err" | "info" }
  | { type: "CLEAR_TOAST" };

/** ALG-002 — يعيد تقييم الإخفاء التلقائي بعد كل تغيّر في البلاغات. */
function applyAutoHide(state: AppState): AppState {
  const activeUsers = state.profiles.filter((p) => {
    if (!p.last_active_at) return false;
    const days = (Date.now() - new Date(p.last_active_at).getTime()) / 86400_000;
    return days <= state.settings.active_users_window_days;
  }).length;

  const recordings = state.recordings.map((r) => {
    const open = state.reports.filter((x) => x.recording_id === r.id && x.status === "open").length;
    const { level } = evaluateReportState(open, activeUsers, state.settings);
    // الإخفاء التلقائي يرفع is_hidden فقط؛ لا يعيده تلقائياً إن أزاله المشرف يدوياً بعد الحل.
    if (level === "hidden" && !r.is_hidden) return { ...r, is_hidden: true };
    if (level !== "hidden" && r.is_hidden && open === 0) return { ...r, is_hidden: false };
    return r;
  });
  return { ...state, recordings };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "LOAD":
      return { ...state, ...action.payload };
    case "LOGIN":
      return { ...state, sessionUserId: action.asAdmin ? ADMIN_USER_ID : CURRENT_USER_ID, viewAsAdmin: action.asAdmin };
    case "LOGOUT":
      return { ...state, sessionUserId: null, viewAsAdmin: false };

    case "TOGGLE_LIKE": {
      const uid = state.sessionUserId!;
      const has = state.likes.some((l) => l.recording_id === action.recordingId && l.user_id === uid);
      const likes = has
        ? state.likes.filter((l) => !(l.recording_id === action.recordingId && l.user_id === uid))
        : [...state.likes, { recording_id: action.recordingId, user_id: uid }];
      // DB-02: العدّاد يُصان مع كل تغيّر (يقابل المشغّل trg_likes_count)
      const recordings = state.recordings.map((r) =>
        r.id === action.recordingId ? { ...r, likes_count: Math.max(r.likes_count + (has ? -1 : 1), 0) } : r
      );
      return { ...state, likes, recordings };
    }

    case "TOGGLE_FAVORITE": {
      const uid = state.sessionUserId!;
      const has = state.favorites.some((f) => f.recording_id === action.recordingId && f.user_id === uid);
      const favorites = has
        ? state.favorites.filter((f) => !(f.recording_id === action.recordingId && f.user_id === uid))
        : [...state.favorites, { recording_id: action.recordingId, user_id: uid }];
      return { ...state, favorites };
    }

    case "COUNT_LISTEN":
      return {
        ...state,
        recordings: state.recordings.map((r) =>
          r.id === action.recordingId ? { ...r, listens_count: r.listens_count + 1 } : r
        ),
      };

    case "ADD_RECORDING": {
      // ALG-004: تسجيل واحد لكل طالب لكل حديث — الاستبدال يزيل القديم
      const filtered = state.recordings.filter(
        (r) => !(r.hadith_id === action.recording.hadith_id && r.user_id === action.recording.user_id)
      );
      const removed = state.recordings.filter(
        (r) => r.hadith_id === action.recording.hadith_id && r.user_id === action.recording.user_id
      );
      const removedIds = new Set(removed.map((r) => r.id));
      return {
        ...state,
        recordings: [...filtered, action.recording],
        likes: state.likes.filter((l) => !removedIds.has(l.recording_id)),
        favorites: state.favorites.filter((f) => !removedIds.has(f.recording_id)),
        reports: state.reports.filter((r) => !removedIds.has(r.recording_id)),
        uploadTimestamps: [...state.uploadTimestamps, action.recording.created_at],
      };
    }

    case "DELETE_RECORDING":
      return {
        ...state,
        recordings: state.recordings.filter((r) => r.id !== action.recordingId),
        likes: state.likes.filter((l) => l.recording_id !== action.recordingId),
        favorites: state.favorites.filter((f) => f.recording_id !== action.recordingId),
        reports: state.reports.filter((r) => r.recording_id !== action.recordingId),
      };

    case "SUBMIT_REPORT":
      return applyAutoHide({ ...state, reports: [...state.reports, action.report] });
    case "SUBMIT_CONTENT_REPORT":
      return { ...state, contentReports: [...state.contentReports, action.report] };
    case "RESOLVE_REPORT":
      return applyAutoHide({
        ...state,
        reports: state.reports.map((r) => (r.id === action.reportId ? { ...r, status: action.status } : r)),
      });
    case "RESOLVE_CONTENT_REPORT":
      return {
        ...state,
        contentReports: state.contentReports.map((r) => (r.id === action.reportId ? { ...r, status: action.status } : r)),
      };

    case "SET_VERIFIED":
      return {
        ...state,
        recordings: state.recordings.map((r) =>
          r.id === action.recordingId
            ? { ...r, is_verified: action.value, verified_by: action.value ? ADMIN_USER_ID : null }
            : r
        ),
      };
    case "SET_HIDDEN":
      return {
        ...state,
        recordings: state.recordings.map((r) => (r.id === action.recordingId ? { ...r, is_hidden: action.value } : r)),
      };
    case "UPDATE_SETTING":
      return applyAutoHide({ ...state, settings: { ...state.settings, [action.key]: action.value } as AppSettings });

    case "TOAST":
      return { ...state, toast: { id: Date.now(), text: action.text, kind: action.kind ?? "ok" } };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    default:
      return state;
  }
}

const Ctx = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  me: Profile | null;
  isAdmin: boolean;
  viewsFor: (hadithId: string) => RecordingView[];
  activeUsersCount: number;
} | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "LOAD", payload: JSON.parse(raw) });
    } catch { /* تجاهل */ }
    // رابط عرض مباشر ?as=student | ?as=admin — يُطبَّق بعد تحميل الحالة المحفوظة
    // حتى لا تُلغيه. مفيد للعرض والمشاركة؛ يُحذف عند ربط Google OAuth الحقيقي.
    try {
      const as = new URLSearchParams(window.location.search).get("as");
      if (as === "student" || as === "admin") {
        dispatch({ type: "LOGIN", asAdmin: as === "admin" });
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch { /* تجاهل */ }
  }, []);

  useEffect(() => {
    try {
      const { toast, ...persist } = state;
      void toast;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch { /* تجاهل */ }
  }, [state]);

  const value = useMemo(() => {
    const me = state.profiles.find((p) => p.id === state.sessionUserId) ?? null;
    const isAdmin = me?.role === "admin";
    const activeUsersCount = state.profiles.filter((p) => {
      if (!p.last_active_at) return false;
      return (Date.now() - new Date(p.last_active_at).getTime()) / 86400_000 <= state.settings.active_users_window_days;
    }).length;

    const viewsFor = (hadithId: string): RecordingView[] =>
      state.recordings
        .filter((r) => r.hadith_id === hadithId)
        .filter((r) => !r.is_hidden || isAdmin || r.user_id === state.sessionUserId)
        .map((r) => ({
          ...r,
          display_name: state.profiles.find((p) => p.id === r.user_id)?.display_name ?? "طالب",
          file_url: "/" + r.file_path,
          liked_by_me: state.likes.some((l) => l.recording_id === r.id && l.user_id === state.sessionUserId),
          favorited_by_me: state.favorites.some((f) => f.recording_id === r.id && f.user_id === state.sessionUserId),
          is_community_best: isCommunityBest(r, state.settings.community_best_min_likes),
        }));

    return { state, dispatch, me, isAdmin, viewsFor, activeUsersCount };
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}
