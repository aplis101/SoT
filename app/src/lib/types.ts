// أنواع البيانات — مشتقة من hadith-sot/04-database-schema.sql
export type UserRole = "student" | "admin";
export type HadithGrade = "sahih" | "hasan" | "daif";
export type ReportReason = "incorrect_recitation" | "poor_quality" | "inappropriate" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ContentErrorType = "tashkeel" | "translation" | "isnad" | "takhrij" | "other";

export interface Profile {
  id: string;
  display_name: string;
  role: UserRole;
  consent_given_at: string | null;
  last_active_at: string | null;
}

export interface Collection { id: number; slug: string; name_ar: string; name_id: string | null; name_en: string | null; sort_order: number; }
export interface Book { id: number; collection_id: number; name_ar: string; name_id: string | null; name_en: string | null; sort_order: number; }
export interface Chapter { id: number; book_id: number; name_ar: string; name_id: string | null; name_en: string | null; sort_order: number; }

export interface WordDefinition { id: number; hadith_id: string; word: string; definition_ar: string; definition_id: string | null; definition_en: string | null; }
export interface TakhrijReference { id: number; hadith_id: string; source_book: string; reference_number: string; }

export interface Hadith {
  id: string;
  chapter_id: number;
  hadith_number: number;
  isnad_ar: string;
  matn_ar: string;
  translation_id: string | null;
  translation_en: string | null;
  grade: HadithGrade;
  explanation: string | null;
  length_class: "short" | "long";
  source_api: string;
}

export interface Recording {
  id: string;
  hadith_id: string;
  user_id: string;
  file_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  codec: string;
  bitrate_kbps: number;
  likes_count: number;
  listens_count: number;
  is_verified: boolean;
  is_hidden: boolean;
  verified_by: string | null;
  created_at: string;
}

export interface Report {
  id: string; recording_id: string; reporter_id: string;
  reason: ReportReason; details: string | null; status: ReportStatus; created_at: string;
}
export interface ContentReport {
  id: string; hadith_id: string; reporter_id: string;
  error_type: ContentErrorType; description: string; status: ReportStatus; created_at: string;
}

export interface AppSettings {
  active_users_window_days: number;
  community_best_min_likes: number;
  listen_count_threshold_seconds: number;
  rate_limit_uploads_per_hour: number;
  report_alert_min: number;
  report_alert_ratio: number;
  report_hide_min: number;
  report_hide_ratio: number;
  upload_enabled: boolean;
}

/** التسجيل مع الحقول المشتقة للعرض — يقابل مخرجات get_recordings_for_hadith */
export interface RecordingView extends Recording {
  display_name: string;
  file_url: string;
  liked_by_me: boolean;
  favorited_by_me: boolean;
  is_community_best: boolean;
}
