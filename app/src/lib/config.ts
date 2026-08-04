// نقطة التبديل الوحيدة بين البيانات الوهمية وSupabase الحقيقي.
export const DATA_SOURCE = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? "mock") as "mock" | "supabase";

export const SUPABASE = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://REPLACE-ME.supabase.co",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "REPLACE_ME_ANON_KEY",
  bucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? "recordings",
};

export const ALLOWED_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "";

/** true إذا كانت المفاتيح ما تزال تنكرية — يُستخدم لإظهار شريط التنبيه. */
export const IS_PLACEHOLDER_CONFIG =
  SUPABASE.url.includes("REPLACE-ME") || SUPABASE.anonKey.startsWith("REPLACE_ME");
