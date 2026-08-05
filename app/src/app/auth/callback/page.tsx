"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRepo } from "@/lib/repo";
import { EmptyState, Button } from "@/components/ui";

/**
 * وجهة عودة Google OAuth.
 *
 * Supabase يضع الجلسة في الرابط، وعميل supabase-js يلتقطها تلقائياً
 * (detectSessionInUrl: true). هنا ننتظر اكتمال ذلك ثم نوجّه للمكتبة.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const repo = getRepo();

    // خطأ صريح من Google/Supabase يعود في الـhash أو الـquery
    const params = new URLSearchParams(
      window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.search
    );
    const errDesc = params.get("error_description") ?? params.get("error");
    if (errDesc) {
      setError(decodeURIComponent(errDesc.replace(/\+/g, " ")));
      return;
    }

    // نحاول عدة مرات: التقاط الجلسة من الرابط غير فوري
    let tries = 0;
    const tick = async () => {
      if (cancelled) return;
      try {
        const uid = await repo.getSessionUserId();
        if (uid) { router.replace("/"); return; }
      } catch { /* نعيد المحاولة */ }
      if (++tries > 20) { setError("انتهت مهلة تسجيل الدخول. أعد المحاولة."); return; }
      setTimeout(tick, 400);
    };
    tick();

    return () => { cancelled = true; };
  }, [router]);

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="تعذّر إكمال تسجيل الدخول"
        hint={error}
        action={<Button onClick={() => router.replace("/login")}>العودة لصفحة الدخول</Button>}
      />
    );
  }

  return <EmptyState icon="⏳" title="جارٍ إكمال تسجيل الدخول…" hint="لحظات من فضلك." />;
}
