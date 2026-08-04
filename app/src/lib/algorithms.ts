// الخوارزميات المرجعية — hadith-sot/09-business-logic-rules.md
// ملاحظة: التعليقات المعلَّمة [FIX] تشير إلى فجوات كُشفت في review/ وحُسمت هنا مؤقتاً.
import type { RecordingView, AppSettings } from "./types";

/**
 * ALG-001 — اختيار التسجيل الافتراضي بثلاث طبقات.
 * [FIX ALG-C-01] الطبقة 1 كانت بلا كاسر تعادل. المعتمد هنا: الأحدث رفعاً (created_at DESC)
 *                 اتساقاً مع EC-008 المطبَّق على الطبقة 3.
 * [FIX ALG-C-02] كاسر التعادل مطبَّق صراحةً في الطبقات الثلاث، لا في الطبقة 3 وحدها.
 */
export function pickDefaultRecording(list: RecordingView[]): RecordingView | null {
  const visible = list.filter((r) => !r.is_hidden);
  if (visible.length === 0) return null;

  const byLikesThenNewest = (a: RecordingView, b: RecordingView) =>
    b.likes_count - a.likes_count ||
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  // الطبقة 1: مفضّلة المستخدم الشخصية ⭐
  const mine = visible.filter((r) => r.favorited_by_me);
  if (mine.length) return [...mine].sort(byLikesThenNewest)[0];

  // الطبقة 2: المعتمد من المشرف ✅
  const verified = visible.filter((r) => r.is_verified);
  if (verified.length) return [...verified].sort(byLikesThenNewest)[0];

  // الطبقة 3: الأكثر إعجاباً، ثم الأحدث
  return [...visible].sort(byLikesThenNewest)[0];
}

/** ALG-002 — العتبات النسبية للبلاغات. عتبة = max(الحد الأدنى المطلق، النشطون × النسبة) */
export function reportThresholds(activeUsers: number, s: AppSettings) {
  return {
    alert: Math.max(s.report_alert_min, Math.ceil(activeUsers * s.report_alert_ratio)),
    hide: Math.max(s.report_hide_min, Math.ceil(activeUsers * s.report_hide_ratio)),
  };
}

/** ALG-002 — تقييم حالة تسجيل بناءً على عدد البلاغات المفتوحة */
export function evaluateReportState(openReports: number, activeUsers: number, s: AppSettings) {
  const t = reportThresholds(activeUsers, s);
  // [FIX] الوثيقة لم تحسم >= أم >. المعتمد: >= (بلوغ العتبة يكفي).
  if (openReports >= t.hide) return { level: "hidden" as const, ...t };
  if (openReports >= t.alert) return { level: "alert" as const, ...t };
  return { level: "ok" as const, ...t };
}

/**
 * ALG-003 — عداد الاستماع الذكي.
 * [FIX ALG-C-05] الوثيقة تناقضت بين "5 ثوانٍ متواصلة" و"مؤقّت تراكمي".
 *                 المعتمد هنا: تراكمي، ويُصفَّر عند التقديم السريع (seek) لمنع التلاعب.
 */
export class ListenCounter {
  private accumulated = 0;
  private counted = false;
  constructor(private thresholdSeconds: number) {}
  tick(deltaSeconds: number): boolean {
    if (this.counted) return false;
    this.accumulated += deltaSeconds;
    if (this.accumulated >= this.thresholdSeconds) { this.counted = true; return true; }
    return false;
  }
  onSeek() { if (!this.counted) this.accumulated = 0; }
  reset() { this.accumulated = 0; this.counted = false; }
  get progress() { return Math.min(this.accumulated / this.thresholdSeconds, 1); }
  get hasCounted() { return this.counted; }
}

/** ALG-005 — تحديد معدل الرفع */
export function checkRateLimit(uploadTimestamps: string[], perHour: number) {
  const hourAgo = Date.now() - 3600_000;
  const recent = uploadTimestamps.filter((t) => new Date(t).getTime() > hourAgo);
  return {
    allowed: recent.length < perHour,
    remaining: Math.max(perHour - recent.length, 0),
    retryAfterMinutes: recent.length >= perHour && recent.length > 0
      ? Math.ceil((new Date(recent[0]).getTime() + 3600_000 - Date.now()) / 60000)
      : 0,
  };
}

/** ALG-006 — شارة «الأفضل مجتمعياً» منفصلة تماماً عن ⭐ الشخصية وعن ✅ الاعتماد */
export function isCommunityBest(r: { likes_count: number }, minLikes: number) {
  return r.likes_count >= minLikes;
}
