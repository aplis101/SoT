/**
 * تنفيذ العقد على البيانات الوهمية المحلية.
 *
 * القراءة تُرجع بيانات mock-data.ts. الكتابة لا تفعل شيئاً هنا لأن المخزن
 * (store.tsx) يطبّق التغيير محلياً ويحفظه في localStorage — فتبقى التجربة
 * كاملة بلا خادم. عند التبديل إلى Supabase يصبح المخزن متفائلاً (optimistic)
 * ويستدعي الطبقة الحقيقية بعد كل تغيير.
 */
import type { Repo, ContentSnapshot, InteractionSnapshot, SearchResult } from "./types";
import type { Recording, WordDefinition, TakhrijReference, BugReport } from "../types";
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

  async loadHadithsForBook(bookId) {
    const ids = MOCK_CHAPTERS.filter((c) => c.book_id === bookId).map((c) => c.id);
    return MOCK_HADITHS.filter((h) => ids.includes(h.chapter_id))
      .sort((a, b) => a.hadith_number - b.hadith_number);
  },

  async loadHadith(hadithId) {
    return {
      hadith: MOCK_HADITHS.find((h) => h.id === hadithId) ?? null,
      words: MOCK_WORD_DEFINITIONS.filter((w) => w.hadith_id === hadithId),
      takhrij: MOCK_TAKHRIJ.filter((t) => t.hadith_id === hadithId),
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
    return { ...w, id: w.id ?? Math.floor(Date.now() % 2147483647) } as WordDefinition;
  },
  deleteWordDefinition: noop,
  async upsertTakhrij(t): Promise<TakhrijReference> {
    return { ...t, id: t.id ?? Math.floor(Date.now() % 2147483647) } as TakhrijReference;
  },
  deleteTakhrij: noop,
  updateHadithExplanation: noop,
  renameBook: noop,

  // في الوضع الوهمي نطبع البلاغ في الطرفية بدل إرساله — ليبقى النموذج قابلاً للتجربة
  async submitBugReport(r) { console.info("[mock] bug report:", r); },
  async loadBugReports(): Promise<BugReport[]> { return []; },
  updateBugReport: noop,

  async audioUrl(filePath) { return "/" + filePath; },

  // بحث وهمي بنفس منطق التطبيع العربي المستعمل في Postgres، حتى يبقى سلوك
  // الوضعين متطابقاً ولا يفاجئنا الفرق عند التبديل.
  async searchHadiths(query, opts = {}) {
    const norm = (t: string) =>
      (t ?? "")
        .replace(/[ً-ْـۖ-ۭ]/g, "")
        .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي")
        .replace(/ة/g, "ه").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
        .replace(/\s+/g, " ").trim();

    const q = norm(query);
    if (q.length < 2) return [];
    const terms = q.split(" ").filter(Boolean);

    const out: SearchResult[] = [];
    for (const h of MOCK_HADITHS) {
      const hay = norm(`${h.matn_ar} ${h.isnad_ar ?? ""} ${h.translation_en ?? ""} ${h.translation_id ?? ""}`);
      const hits = terms.filter((t) => hay.includes(t)).length;
      if (hits === 0) continue;

      const chapter = MOCK_CHAPTERS.find((c) => c.id === h.chapter_id);
      const book = MOCK_BOOKS.find((b) => b.id === chapter?.book_id);
      const coll = MOCK_COLLECTIONS.find((c) => c.id === book?.collection_id);
      const matn = norm(h.matn_ar);
      const at = matn.indexOf(terms[0]);
      const from = Math.max(0, at - 40);

      out.push({
        id: h.id, chapterId: h.chapter_id, bookId: book?.id ?? 0,
        collectionSlug: coll?.slug ?? "", hadithNumber: Number(h.hadith_number),
        matnAr: h.matn_ar, isnadAr: h.isnad_ar ?? null,
        translationEn: h.translation_en ?? null, translationId: h.translation_id ?? null,
        bookName: { ar: book?.name_ar ?? "", en: book?.name_en ?? null, id: book?.name_id ?? null },
        collectionName: { ar: coll?.name_ar ?? "", en: coll?.name_en ?? null, id: coll?.name_id ?? null },
        snippet: (from > 0 ? "…" : "") + matn.slice(from, from + 120) + "…",
        rank: hits / terms.length,
      });
    }
    out.sort((a, b) => b.rank - a.rank);
    const off = opts.offset ?? 0;
    return out.slice(off, off + (opts.limit ?? 30));
  },
};
