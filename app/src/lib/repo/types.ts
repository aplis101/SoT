/**
 * عقد طبقة البيانات — نقطة الفصل الوحيدة بين الواجهة ومصدر البيانات.
 *
 * أي صفحة أو مكوّن يتعامل مع هذا العقد فقط، فلا يعرف إن كانت البيانات
 * وهمية محلية أم قادمة من Supabase. التبديل يتم بمتغيّر بيئة واحد.
 */
import type {
  Collection, Book, Chapter, Hadith, WordDefinition, TakhrijReference, BugReport, BugReportInput,
  Recording, Report, ContentReport, AppSettings, Profile,
} from "../types";

/** المحتوى المرجعي — للقراءة فقط من الواجهة (يُستورد بدور الخدمة) */
export interface ContentSnapshot {
  collections: Collection[];
  books: Book[];
  chapters: Chapter[];
  hadiths: Hadith[];
  wordDefinitions: WordDefinition[];
  takhrij: TakhrijReference[];
}

/** حالة التفاعل — تتغيّر باستمرار */
export interface InteractionSnapshot {
  profiles: Profile[];
  recordings: Recording[];
  likes: { recording_id: string; user_id: string }[];
  favorites: { recording_id: string; user_id: string }[];
  reports: Report[];
  contentReports: ContentReport[];
  settings: AppSettings;
}

export interface Repo {
  readonly kind: "mock" | "supabase";

  /**
   * يُستدعى مرة عند الإقلاع — **الهرمية فقط** (مجموعات/كتب/أبواب ≈ 800 صف).
   *
   * [FIX PERF-01] كان يجلب الأحاديث كلها أيضاً. مع 35,798 حديثاً صار ذلك
   * ~60 ميجابايت في كل فتحة للتطبيق ⇒ بطء شديد على الهاتف واستنفاد حصة
   * Egress (5GB) خلال ~80 زيارة. الأحاديث تُجلب الآن عند الحاجة فقط.
   */
  loadContent(): Promise<ContentSnapshot>;
  loadInteractions(): Promise<InteractionSnapshot>;

  /** أحاديث كتاب واحد — تُستدعى عند فتح صفحة الكتاب */
  loadHadithsForBook(bookId: number): Promise<Hadith[]>;
  /** حديث واحد بتفاصيله — تُستدعى عند فتح صفحة الحديث */
  loadHadith(hadithId: string): Promise<{
    hadith: Hadith | null;
    words: WordDefinition[];
    takhrij: TakhrijReference[];
  }>;

  // ---- المصادقة (F007 / UC-001) ----
  getSessionUserId(): Promise<string | null>;
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;

  // ---- التفاعل (F005) ----
  toggleLike(recordingId: string, on: boolean): Promise<void>;
  toggleFavorite(recordingId: string, on: boolean): Promise<void>;
  countListen(recordingId: string): Promise<void>;

  // ---- التسجيلات (F004) ----
  uploadRecording(input: {
    hadithId: string;
    blob: Blob;
    durationSeconds: number;
  }): Promise<Recording>;
  deleteRecording(recordingId: string): Promise<void>;

  // ---- البلاغات (F006) ----
  submitReport(r: Omit<Report, "id" | "created_at" | "status">): Promise<void>;
  submitContentReport(r: Omit<ContentReport, "id" | "created_at" | "status">): Promise<void>;
  resolveReport(id: string, status: Report["status"]): Promise<void>;
  resolveContentReport(id: string, status: Report["status"]): Promise<void>;

  // ---- الإشراف (F008) ----
  setVerified(recordingId: string, value: boolean): Promise<void>;
  setHidden(recordingId: string, value: boolean): Promise<void>;
  updateSetting(key: keyof AppSettings, value: number | boolean): Promise<void>;

  // ---- إدخال المحتوى العلمي (المشرف) ----
  upsertWordDefinition(w: Omit<WordDefinition, "id"> & { id?: number }): Promise<WordDefinition>;
  deleteWordDefinition(id: number): Promise<void>;
  upsertTakhrij(t: Omit<TakhrijReference, "id"> & { id?: number }): Promise<TakhrijReference>;
  deleteTakhrij(id: number): Promise<void>;
  updateHadithExplanation(hadithId: string, explanation: string | null): Promise<void>;
  renameBook(bookId: number, nameAr: string): Promise<void>;

  // ---- بلاغات المنصة (F009) ----
  /** متاح للزائر أيضاً — إن انهارت المنصة قبل الدخول فلا بد أن يبقى الإبلاغ ممكناً */
  submitBugReport(r: BugReportInput): Promise<void>;
  loadBugReports(): Promise<BugReport[]>;
  updateBugReport(id: string, patch: { status?: BugReport["status"]; admin_note?: string }): Promise<void>;

  /** رابط تشغيل صالح لملف صوتي (موقّع في Supabase) */
  audioUrl(filePath: string): Promise<string>;

  // ---- البحث (F010) ----
  /**
   * بحث نصّي في اللغات الثلاث دفعةً واحدة — لا يحتاج المستخدم أن يخبرنا بلغته.
   * العربي يُطبَّع قبل المطابقة (حذف التشكيل، توحيد الألف والياء والتاء المربوطة)
   * فمن يكتب «انما الاعمال» يجد «إنَّمَا الأَعْمَالُ». تفصيله في 09-search.sql.
   */
  searchHadiths(query: string, opts?: SearchOptions): Promise<SearchResult[]>;
}

export interface SearchOptions {
  /** slug المجموعة للتصفية، أو undefined للبحث في الكل */
  collection?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: string;
  chapterId: number;
  bookId: number;
  collectionSlug: string;
  hadithNumber: number;
  matnAr: string;
  isnadAr: string | null;
  translationEn: string | null;
  translationId: string | null;
  bookName: { ar: string; en: string | null; id: string | null };
  collectionName: { ar: string; en: string | null; id: string | null };
  /** مقتطف فيه <mark> حول مواضع التطابق — نصّ مطبَّع بلا تشكيل */
  snippet: string;
  rank: number;
}
