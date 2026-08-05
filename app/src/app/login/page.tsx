"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card } from "@/components/ui";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/config";
import { getRepo, isLive } from "@/lib/repo";

/** PAGE-001 / UC-001 — تسجيل الدخول */
export default function LoginPage() {
  const { dispatch } = useStore();
  const [busy, setBusy] = useState<"student" | "admin" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const live = isLive();

  const demoSignIn = (asAdmin: boolean) => {
    setBusy(asAdmin ? "admin" : "student");
    setTimeout(() => { dispatch({ type: "LOGIN", asAdmin }); setBusy(null); }, 400);
  };

  const googleSignIn = async () => {
    setBusy("google"); setError(null);
    try {
      await getRepo().signInWithGoogle();
      // المتصفح ينتقل إلى Google ثم يعود إلى /auth/callback
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر بدء تسجيل الدخول.");
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-sm flex-col items-center justify-center gap-6 text-center">
      <div>
        <div className="mb-3 text-5xl" aria-hidden>☾</div>
        <h1 className="text-2xl font-bold text-stone-900">منصة الحديث الشريف التفاعلية</h1>
        <p className="mt-2 text-sm text-stone-500">استمع، سجّل، وأتقن ضبط نطق الحديث مع زملائك.</p>
      </div>

      <Card className="w-full space-y-3 p-5">
        {live ? (
          <>
            <Button onClick={googleSignIn} disabled={!!busy} className="w-full">
              {busy === "google" ? "جارٍ التحويل إلى Google…" : "الدخول بحساب Google"}
            </Button>
            <p className="text-[11px] leading-relaxed text-stone-500">
              نستخدم حساب Google للتحقق من هويتك فقط. لا نطّلع على كلمة مرورك، ولا نقرأ بريدك.
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-stone-500">
              وضع البيانات الوهمية — المصادقة الحقيقية تعمل عند ضبط <code className="latin">DATA_SOURCE=supabase</code>.
            </p>
            <Button onClick={() => demoSignIn(false)} disabled={!!busy} className="w-full">
              {busy === "student" ? "جارٍ الدخول…" : "الدخول كطالب"}
            </Button>
            <Button onClick={() => demoSignIn(true)} disabled={!!busy} variant="outline" className="w-full">
              {busy === "admin" ? "جارٍ الدخول…" : "الدخول كمشرف"}
            </Button>
          </>
        )}

        {ALLOWED_EMAIL_DOMAIN && (
          <p className="text-[11px] text-stone-400">
            مقصور على بريد النطاق: <span className="latin">{ALLOWED_EMAIL_DOMAIN}</span>
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</p>
        )}
      </Card>

      <p className="max-w-xs text-[11px] leading-relaxed text-stone-400">
        بدخولك توافق على أن تسجيلاتك الصوتية ستكون <b>مسموعة لكل من أنشأ حساباً في المنصة</b> — والتسجيل فيها
        مفتوح للجميع — ويظهر اسمك بجانبها. ويمكنك حذفها نهائياً في أي وقت من صفحة «ملفي».
      </p>
    </div>
  );
}
