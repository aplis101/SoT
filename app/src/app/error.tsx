"use client";
import { useEffect, useState } from "react";
import ReportProblem from "@/components/ReportProblem";
import { Button, Card } from "@/components/ui";

/**
 * حدّ الأخطاء (Error Boundary) — F009.
 *
 * بدل شاشة بيضاء تُفزع الطالب، نعرض رسالة مفهومة ونعرض عليه إرسال بلاغ
 * مرفقاً به أثر الخطأ (stack) تلقائياً. الطالب لا يعرف ما «الـstack»،
 * لكن إرساله يختصر علينا التشخيص كلياً.
 */
export default function ErrorPage({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    // يُسجَّل في الطرفية فيلتقطه diagnostics تلقائياً
    console.error("[app-error]", error.message, error.digest ?? "", error.stack ?? "");
  }, [error]);

  const stack = [
    error.message,
    error.digest ? `digest: ${error.digest}` : "",
    (error.stack ?? "").slice(0, 1500),
  ].filter(Boolean).join("\n");

  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center gap-5 text-center">
      <div className="text-5xl" aria-hidden>😔</div>
      <div>
        <h1 className="text-xl font-bold text-stone-900">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-sm text-stone-500">
          العطل من المنصة لا منك، ولم يضع شيء من تسجيلاتك.
        </p>
      </div>

      <Card className="w-full space-y-3 p-4">
        <Button onClick={reset} className="w-full">أعد المحاولة</Button>
        <Button variant="outline" onClick={() => setReportOpen(true)} className="w-full">
          أرسل بلاغاً بالخطأ
        </Button>
        <a href="/" className="block text-[13px] text-primary hover:underline">العودة للمكتبة</a>
      </Card>

      <details className="w-full text-right">
        <summary className="cursor-pointer text-[12px] text-stone-400">تفاصيل تقنية</summary>
        <pre className="latin mt-2 max-h-40 overflow-auto rounded-lg bg-stone-900 p-2 text-[10px] text-stone-200">
{stack}
        </pre>
      </details>

      <ReportProblem open={reportOpen} onClose={() => setReportOpen(false)} errorStack={stack} />
    </div>
  );
}
