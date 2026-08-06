import type { NextConfig } from "next";

/**
 * ترويسات الأمن — [FIX SEC-05]
 *
 * المراجعة الأمنية كشفت أن التطبيق كان يُقدَّم بلا أي ترويسة حماية، أي أنه
 * قابل للتأطير داخل موقع خبيث (clickjacking): يضع المهاجم صفحتنا في إطار
 * شفاف فوق زرّ يبدو بريئاً، فينقر الطالب على «احذف تسجيلي» وهو يظن أنه ينقر
 * غير ذلك. الترويسات أدناه دفاع رخيص وفعّال.
 *
 * سياسة CSP هنا مضبوطة على ما يحتاجه التطبيق فعلاً لا أكثر:
 *   - الخطوط من Google Fonts (12-design-system.md §4)
 *   - الاتصال بـSupabase (REST + Realtime + Storage)
 *   - blob: للصوت المسجَّل محلياً قبل رفعه
 * 'unsafe-inline' للأنماط لازم لأن Next.js يحقن أنماطاً مضمَّنة؛ ولا يُقبل
 * للنصوص البرمجية إلا في وضع التطوير حيث يحتاجه Turbopack.
 */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",          // لا يُؤطَّر إطلاقاً
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },              // للمتصفحات القديمة
  { key: "X-Content-Type-Options", value: "nosniff" },    // لا تخمين نوع الملف
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // الميكروفون مسموح لأصلنا فقط — والباقي مغلق: لا نحتاج موقعاً ولا كاميرا
  { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,   // لا تُفصح عن إطار العمل ونسخته
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
