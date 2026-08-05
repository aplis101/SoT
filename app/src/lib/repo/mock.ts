/**
 * تنفيذ العقد على البيانات الوهمية المحلية.
 *
 * القراءة تُرجع بيانات mock-data.ts. الكتابة لا تفعل شيئاً هنا لأن المخزن
 * (store.tsx) يطبّق التغيير محلياً ويحفظه في localStorage — فتبقى التجربة
 * كاملة بلا خادم. عند التبديل إلى Supabase يصبح المخزن متفائلاً (optimistic)
 * ويستدعي الطبقة الحقيقية بعد كل تغيير.
 */
import type { Repo, ContentSnapshot, InteractionSnapshot } from "./types";
import type { Recording, WordDefinition, TakhrijReference } from "../types";
import {
  MOCK_COLLECTIONS, MOCK_BOOKS, MOCK_CHAPTERS, MOCK_HADITHS,
  MOCK_WORD_DEFINITIONS, MOCK_TAKHRIJ, MOCK_PROFILES, MOCK_RECORDINGS,
  MOCK_LIKES, MOCK_FAVORITES, MOCK_REPORTS, MOCK_CONTENT_REPORTS, MOCK_SETTINGS,
} from "../mock-data";

const noop = async () => {};

export const mockRepo: Repo = {
  kind: "mock",

  async loadContent(): Promise<ContentSnapshot> {
    return {
      collections: MOCK_COLLECTIONS,
      books: MOCK_BOOKS,
      chapters: MOCK_CHAPTERS,
      hadiths: MOCK_HADITHS,
      wordDefinitions: MOCK_WORD_DEFINITIONS,
      takhrij: MOCK_TAKHRIJ,
    };
  },

  async loadInteractions(): Promise<InteractionSnapshot> {
    return {
      profiles: MOCK_PROFILES,
      recordings: MOCK_RECORDINGS,
      likes: MOCK_LIKES,
      favorites: MOCK_FAVORITES,
      reports: MOCK_REPORTS,
      contentReports: MOCK_CONTENT_REPORTS,
      settings: MOCK_SETTINGS,
    };
  },

  async getSessionUserId() { return null; },        // الجلسة يديرها المخزن محلياً
  async signInWithGoogle() {
    throw new Error("Google OAuth غير مفعّل في وضع البيانات الوهمية. استخدم أزرار الدخول التجريبية.");
  },
  signOut: noop,

  toggleLike: noop,
  toggleFavorite: noop,
  countListen: noop,

  async uploadRecording({ hadithId, durationSeconds }): Promise<Recording> {
    return {
      id: `r-${Math.random().toString(36).slice(2, 8)}`,
      hadith_id: hadithId,
      user_id: "u-001",
      file_path: `mock-audio/tone-${1 + Math.floor(Math.random() * 3)}.wav`,
      duration_seconds: Math.max(1, Math.round(durationSeconds)),
      file_size_bytes: Math.round(durationSeconds * 4000),
      codec: "opus",
      bitrate_kbps: 32,
      likes_count: 0,
      listens_count: 0,
      is_verified: false,
      is_hidden: false,
      verified_by: null,
      created_at: new Date().toISOString(),
    };
  },
  deleteRecording: noop,

  submitReport: noop,
  submitContentReport: noop,
  resolveReport: noop,
  resolveContentReport: noop,

  setVerified: noop,
  setHidden: noop,
  updateSetting: noop,

  async upsertWordDefinition(w): Promise<WordDefinition> {
    return { ...w, id: w.id ?? `w-${Math.random().toString(36).slice(2, 8)}` } as WordDefinition;
  },
  deleteWordDefinition: noop,
  async upsertTakhrij(t): Promise<TakhrijReference> {
    return { ...t, id: t.id ?? `t-${Math.random().toString(36).slice(2, 8)}` } as TakhrijReference;
  },
  deleteTakhrij: noop,
  updateHadithExplanation: noop,
  renameBook: noop,

  async audioUrl(filePath) { return "/" + filePath; },
};
