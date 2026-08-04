"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card } from "@/components/ui";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/config";

/** PAGE-001 / UC-001 — تسجيل الدخول */
export default function LoginPage() {
  const { dispatch } = useStore();
  const [busy, setBusy] = useState<"student" | "admin" | null>(null);

  const signIn = (asAdmin: boolean) => {
    setBusy(asAdmin ? "admin" : "student");
    setTimeout(() => { dispatch({ type: "LOGIN", asAdmin }); setBusy(null); }, 500);
  };

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-sm flex-col items-center justify-center gap-6 text-center">
      <div>
        <div className="mb-3 text-5xl" aria-hidden>☾</div>
        <h1 className="text-2xl font-bold text-stone-900">منصة الحديث الشريف التفاعلية</h1>
        <p className="mt-2 text-sm text-stone-500">استمع، سجّل، وأتقن ضبط نطق الحديث مع زملائك.</p>
      </div>

      <Card className="w-full space-y-3 p-5">
        <p className="text-xs text-stone-500">
          المصادقة الحقيقية عبر Google OAuth ستُفعَّل عند ربط Supabase. الآن اختر هوية تجريبية:
        </p>
        <Button onClick={() => signIn(false)} disabled={!!busy} className="w-full">
          {busy === "student" ? "جارٍ الدخول…" : "الدخول كطالب"}
        </Button>
        <Button onClick={() => signIn(true)} disabled={!!busy} variant="outline" className="w-full">
          {busy === "admin" ? "جارٍ الدخول…" : "الدخول كمشرف"}
        </Button>
        {ALLOWED_EMAIL_DOMAIN && (
          <p className="text-[11px] text-stone-400">مقصور على بريد النطاق: <span className="latin">{ALLOWED_EMAIL_DOMAIN}</span></p>
        )}
      </Card>

      <p className="max-w-xs text-[11px] leading-relaxed text-stone-400">
        بدخولك توافق على أن تسجيلاتك الصوتية ستكون مسموعة لزملائك في المقرر ولمشرف المادة، ويمكنك حذفها في أي وقت.
      </p>
    </div>
  );
}
