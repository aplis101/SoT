/**
 * تنفيذ العقد على Supabase الحقيقي.
 *
 * لا يُستخدم إلا عندما NEXT_PUBLIC_DATA_SOURCE=supabase ويكون المفتاحان حقيقيين.
 * كل الكتابة تمرّ عبر RLS (05-rls-policies.sql v1.1) أو عبر RPC بـSECURITY DEFINER.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../config";
import type { Repo, ContentSnapshot, InteractionSnapshot } from "./types";
import type {
  Recording, Report, ContentReport, AppSettings,
  WordDefinition, TakhrijReference, BugReport, BugReportInput,
} from "../types";

let _client: SupabaseClient | null = null;
function db(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE.url, SUPABASE.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return _client;
}

/** يرمي خطأً مقروءاً بالعربية بدل كائن Supabase الخام */
function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return (res.data ?? []) as T;
}

/** يجلب كل الصفوف على دفعات — يتجاوز حد Supabase الافتراضي (1000 صف) */
async function fetchAll<T>(table: string, columns = "*", pageSize = 1000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const res = await db().from(table).select(columns).range(from, from + pageSize - 1);
    const rows = check(res as never, `قراءة ${table}`) as T[];
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

export const supabaseRepo: Repo = {
  kind: "supabase",

  async loadContent(): Promise<ContentSnapshot> {
    // [FIX PERF-01] الهرمية فقط (~800 صف). الأحاديث تُجلب عند الحاجة.
    const [collections, books, chapters] = await Promise.all([
      fetchAll<ContentSnapshot["collections"][number]>("collections"),
      fetchAll<ContentSnapshot["books"][number]>("books"),
      fetchAll<ContentSnapshot["chapters"][number]>("chapters"),
    ]);
    return { collections, books, chapters, hadiths: [], wordDefinitions: [], takhrij: [] };
  },

  async loadHadithsForBook(bookId) {
    const ch = await db().from("chapters").select("id").eq("book_id", bookId);
    if (ch.error) throw new Error(`قراءة الأبواب: ${ch.error.message}`);
    const ids = (ch.data ?? []).map((c: { id: number }) => c.id);
    if (ids.length === 0) return [];
    const res = await db().from("hadiths").select("*").in("chapter_id", ids)
      .order("hadith_number", { ascending: true });
    if (res.error) throw new Error(`قراءة الأحاديث: ${res.error.message}`);
    return (res.data ?? []) as Awaited<ReturnType<Repo["loadHadithsForBook"]>>;
  },

  async loadHadith(hadithId) {
    const [h, w, t] = await Promise.all([
      db().from("hadiths").select("*").eq("id", hadithId).maybeSingle(),
      db().from("word_definitions").select("*").eq("hadith_id", hadithId),
      db().from("takhrij_references").select("*").eq("hadith_id", hadithId),
    ]);
    if (h.error) throw new Error(`قراءة الحديث: ${h.error.message}`);
    return {
      hadith: (h.data ?? null) as never,
      words: (w.data ?? []) as WordDefinition[],
      takhrij: (t.data ?? []) as TakhrijReference[],
    };
  },

  async loadInteractions(): Promise<InteractionSnapshot> {
    const [profiles, recordings, likes, favorites, reports, contentReports, settingsRows] =
      await Promise.all([
        fetchAll<InteractionSnapshot["profiles"][number]>("profiles"),
        fetchAll<Recording>("recordings"),
        fetchAll<{ recording_id: string; user_id: string }>("likes", "recording_id,user_id"),
        fetchAll<{ recording_id: string; user_id: string }>("favorite_recordings", "recording_id,user_id"),
        fetchAll<Report>("reports"),
        fetchAll<ContentReport>("content_reports"),
        fetchAll<{ key: string; value: unknown }>("app_settings", "key,value"),
      ]);

    const settings = Object.fromEntries(
      settingsRows.map((r) => [r.key, typeof r.value === "string" ? JSON.parse(r.value) : r.value])
    ) as unknown as AppSettings;

    return { profiles, recordings, likes, favorites, reports, contentReports, settings };
  },

  // ---------------------------------------------------------------- المصادقة
  async getSessionUserId() {
    const { data } = await db().auth.getSession();
    return data.session?.user.id ?? null;
  },

  async signInWithGoogle() {
    const { error } = await db().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) throw new Error(`تعذّر بدء تسجيل الدخول: ${error.message}`);
  },

  async signOut() {
    await db().auth.signOut();
  },

  // ---------------------------------------------------------------- التفاعل
  async toggleLike(recordingId, on) {
    const uid = await this.getSessionUserId();
    if (!uid) throw new Error("يلزم تسجيل الدخول.");
    const q = on
      ? db().from("likes").insert({ recording_id: recordingId, user_id: uid })
      : db().from("likes").delete().eq("recording_id", recordingId).eq("user_id", uid);
    const { error } = await q;
    // العدّاد يُصان بمشغّل trg_likes_count في قاعدة البيانات (إصلاح DB-02)
    if (error && !/duplicate key/i.test(error.message)) throw new Error(`الإعجاب: ${error.message}`);
  },

  async toggleFavorite(recordingId, on) {
    const uid = await this.getSessionUserId();
    if (!uid) throw new Error("يلزم تسجيل الدخول.");
    const q = on
      ? db().from("favorite_recordings").insert({ recording_id: recordingId, user_id: uid })
      : db().from("favorite_recordings").delete().eq("recording_id", recordingId).eq("user_id", uid);
    const { error } = await q;
    if (error && !/duplicate key/i.test(error.message)) throw new Error(`التفضيل: ${error.message}`);
  },

  async countListen(recordingId) {
    const uid = await this.getSessionUserId();
    if (!uid) return;
    // القيد الفريد (recording_id,user_id) يمنع التكرار؛ المشغّل يزيد listens_count
    await db().from("recording_listens").insert({ recording_id: recordingId, user_id: uid });
  },

  // ---------------------------------------------------------------- التسجيلات
  async uploadRecording({ hadithId, blob, durationSeconds }) {
    const uid = await this.getSessionUserId();
    if (!uid) throw new Error("يلزم تسجيل الدخول.");

    // [إصلاح FLW-02] نرفع الملف الجديد أولاً، ولا نحذف القديم إلا بعد نجاح الرفع.
    // النسخة الموصوفة في sys_uc_008 كانت تحذف قبل الرفع ⇒ فشل الرفع = فقدان تام.
    const path = `${uid}/${hadithId}/${crypto.randomUUID()}.webm`;
    const up = await db().storage.from(SUPABASE.bucket).upload(path, blob, {
      contentType: blob.type || "audio/webm",
      upsert: false,
    });
    if (up.error) throw new Error(`فشل الرفع: ${up.error.message}`);

    const old = await db()
      .from("recordings").select("id,file_path")
      .eq("hadith_id", hadithId).eq("user_id", uid).maybeSingle();

    const row = {
      hadith_id: hadithId,
      user_id: uid,
      file_path: path,
      duration_seconds: Math.max(1, Math.round(durationSeconds)),
      file_size_bytes: blob.size,
      codec: "opus",
      bitrate_kbps: 32,
    };

    const ins = await db().from("recordings").upsert(row, { onConflict: "hadith_id,user_id" }).select().single();
    if (ins.error) {
      await db().storage.from(SUPABASE.bucket).remove([path]); // تنظيف
      throw new Error(`تعذّر حفظ التسجيل: ${ins.error.message}`);
    }

    // الآن فقط نحذف الملف القديم
    if (old.data?.file_path && old.data.file_path !== path) {
      await db().storage.from(SUPABASE.bucket).remove([old.data.file_path]);
    }
    return ins.data as Recording;
  },

  async deleteRecording(recordingId) {
    const rec = await db().from("recordings").select("file_path").eq("id", recordingId).maybeSingle();
    const { error } = await db().from("recordings").delete().eq("id", recordingId);
    if (error) throw new Error(`تعذّر الحذف: ${error.message}`);
    if (rec.data?.file_path) await db().storage.from(SUPABASE.bucket).remove([rec.data.file_path]);
  },

  // ---------------------------------------------------------------- البلاغات
  async submitReport(r) {
    const { error } = await db().from("reports").insert(r);
    if (error) {
      if (/duplicate key/i.test(error.message)) throw new Error("سبق أن أبلغت عن هذا التسجيل.");
      throw new Error(`تعذّر إرسال البلاغ: ${error.message}`);
    }
  },
  async submitContentReport(r) {
    const { error } = await db().from("content_reports").insert(r);
    if (error) throw new Error(`تعذّر إرسال البلاغ: ${error.message}`);
  },
  async resolveReport(id, status) {
    const uid = await this.getSessionUserId();
    const { error } = await db().from("reports")
      .update({ status, resolved_by: uid, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(`تعذّر تحديث البلاغ: ${error.message}`);
  },
  async resolveContentReport(id, status) {
    const uid = await this.getSessionUserId();
    const { error } = await db().from("content_reports")
      .update({ status, resolved_by: uid, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(`تعذّر تحديث البلاغ: ${error.message}`);
  },

  // ---------------------------------------------------------------- الإشراف
  async setVerified(recordingId, value) {
    // عبر RPC بـSECURITY DEFINER (إصلاح DB-01) — يتحقق من is_admin() داخلياً
    const { error } = await db().rpc("verify_recording", {
      p_recording_id: recordingId, p_verified: value,
    });
    if (error) throw new Error(error.message.includes("FORBIDDEN") ? "غير مصرّح." : error.message);
  },
  async setHidden(recordingId, value) {
    const { error } = await db().rpc("set_recording_hidden", {
      p_recording_id: recordingId, p_hidden: value,
    });
    if (error) throw new Error(error.message.includes("FORBIDDEN") ? "غير مصرّح." : error.message);
  },
  async updateSetting(key, value) {
    const { error } = await db().from("app_settings")
      .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) throw new Error(`تعذّر حفظ الإعداد: ${error.message}`);
  },

  // ---------------------------------------------------------------- المحتوى العلمي
  async upsertWordDefinition(w) {
    const res = await db().from("word_definitions").upsert(w).select().single();
    if (res.error) throw new Error(`تعذّر حفظ الكلمة: ${res.error.message}`);
    return res.data as WordDefinition;
  },
  async deleteWordDefinition(id) {
    const { error } = await db().from("word_definitions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async upsertTakhrij(t) {
    const res = await db().from("takhrij_references").upsert(t).select().single();
    if (res.error) throw new Error(`تعذّر حفظ التخريج: ${res.error.message}`);
    return res.data as TakhrijReference;
  },
  async deleteTakhrij(id) {
    const { error } = await db().from("takhrij_references").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async updateHadithExplanation(hadithId, explanation) {
    const { error } = await db().from("hadiths")
      .update({ explanation: explanation, updated_at: new Date().toISOString() })
      .eq("id", hadithId);
    if (error) throw new Error(`تعذّر حفظ الشرح: ${error.message}`);
  },
  async renameBook(bookId, nameAr) {
    const { error } = await db().from("books").update({ name_ar: nameAr }).eq("id", bookId);
    if (error) throw new Error(`تعذّر تعديل اسم الكتاب: ${error.message}`);
  },

  // ---------------------------------------------------------------- بلاغات المنصة
  async submitBugReport(r: BugReportInput) {
    const { error } = await db().from("bug_reports").insert(r);
    if (error) throw new Error(`تعذّر إرسال البلاغ: ${error.message}`);
  },
  async loadBugReports() {
    const res = await db().from("bug_reports").select("*").order("created_at", { ascending: false }).limit(500);
    if (res.error) throw new Error(`قراءة البلاغات: ${res.error.message}`);
    return (res.data ?? []) as BugReport[];
  },
  async updateBugReport(id, patch) {
    const uid = await this.getSessionUserId();
    const { error } = await db().from("bug_reports")
      .update({ ...patch, resolved_by: uid, resolved_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(`تعذّر تحديث البلاغ: ${error.message}`);
  },

  // ---------------------------------------------------------------- التخزين
  async audioUrl(filePath) {
    // رابط موقّع صالح ساعة — يمنع الوصول المباشر بتخمين المسار (إصلاح REQ-01)
    const { data, error } = await db().storage.from(SUPABASE.bucket).createSignedUrl(filePath, 3600);
    if (error || !data) throw new Error(`تعذّر توليد رابط الصوت: ${error?.message ?? ""}`);
    return data.signedUrl;
  },
};
