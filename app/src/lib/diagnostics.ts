/**
 * جمع سياق تقني للبلاغات — F009.
 *
 * الفكرة: حين يقول الطالب «الموقع لا يعمل» يكون البلاغ بلا قيمة تشخيصية.
 * هذا الملف يلتقط آخر الأخطاء تلقائياً فيصل البلاغ ومعه ما يكفي للإصلاح.
 *
 * حدود الخصوصية — مقصودة وصارمة:
 *   ✓ نلتقط: رسائل أخطاء الطرفية، الوعود المرفوضة، المسار، المتصفح، حجم الشاشة.
 *   ✗ لا نلتقط: ما يكتبه المستخدم في الحقول، ولا محتوى الصفحة، ولا الموقع
 *     الجغرافي، ولا أي بيانات شخصية عدا معرّفه إن كان مسجّلاً.
 * وهذا معلَن حرفياً للمستخدم في نموذج البلاغ قبل الإرسال.
 */

export interface DiagEntry {
  t: string;                       // وقت الحدث ISO
  level: "error" | "warn" | "unhandled";
  msg: string;
}

const MAX = 25;                    // سقف الحلقة — لا نراكم بلا حد
const buffer: DiagEntry[] = [];
let installed = false;

function push(level: DiagEntry["level"], parts: unknown[]) {
  const msg = parts
    .map((p) => {
      if (p instanceof Error) return `${p.name}: ${p.message}`;
      if (typeof p === "string") return p;
      try { return JSON.stringify(p); } catch { return String(p); }
    })
    .join(" ")
    .slice(0, 500);                // لا نضخّم البلاغ برسالة عملاقة
  buffer.push({ t: new Date().toISOString(), level, msg });
  if (buffer.length > MAX) buffer.shift();
}

/** يُركَّب مرة واحدة عند الإقلاع */
export function installDiagnostics() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const origError = console.error;
  console.error = (...args: unknown[]) => { push("error", args); origError(...args); };

  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => { push("warn", args); origWarn(...args); };

  window.addEventListener("error", (e) => push("error", [e.message, e.filename, `:${e.lineno}`]));
  window.addEventListener("unhandledrejection", (e) => push("unhandled", [e.reason]));
}

export function getDiagnostics(): DiagEntry[] {
  return [...buffer];
}

export function clearDiagnostics() {
  buffer.length = 0;
}

/** لقطة السياق التي تُرفق بالبلاغ */
export function snapshotContext() {
  if (typeof window === "undefined") {
    return { page_url: null, user_agent: null, viewport: null, app_version: APP_VERSION };
  }
  return {
    page_url: window.location.pathname + window.location.search,
    user_agent: navigator.userAgent.slice(0, 300),
    viewport: `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio ?? 1}x`,
    app_version: APP_VERSION,
  };
}

/** يُحدَّث يدوياً عند كل إصدار — يربط البلاغ بنسخة الكود */
export const APP_VERSION = "1.2.0";
