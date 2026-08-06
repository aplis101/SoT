"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { Modal, Button, inputCls } from "./ui";
import { getDiagnostics, snapshotContext, clearDiagnostics } from "@/lib/diagnostics";

const KINDS = [
  { v: "bug" as const,     label: "عطل — شيء لا يعمل",           icon: "🐞" },
  { v: "content" as const, label: "خطأ في نصّ أو ترجمة",          icon: "📖" },
  { v: "idea" as const,    label: "اقتراح تحسين",                 icon: "💡" },
  { v: "other" as const,   label: "شيء آخر",                      icon: "✉️" },
];

/**
 * F009 — بلاغ عن مشكلة في المنصة.
 *
 * متاح في كل صفحة. يرفق السياق التقني تلقائياً، ويعرضه للمستخدم قبل الإرسال
 * حتى يعرف بالضبط ما الذي يُرسَل عنه — لا صندوق أسود.
 *
 * `errorStack` يُمرَّر حين يأتي البلاغ من شاشة الانهيار.
 */
export default function ReportProblem({
  open, onClose, errorStack,
}: { open: boolean; onClose: () => void; errorStack?: string }) {
  const { state, dispatch } = useStore();
  const [kind, setKind] = useState<(typeof KINDS)[number]["v"]>(errorStack ? "bug" : "bug");
  const [message, setMessage] = useState("");
  const [attach, setAttach] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  // [FIX SEC-09] رفض حدّ المعدل ليس عطلاً — يُعرض داخل النموذج بنبرة هادئة
  // لا كتوست أحمر يوحي بانهيار، والنصّ يبقى في الحقل فلا يفقد المستخدم كتابته.
  const [notice, setNotice] = useState<string | null>(null);

  const diags = getDiagnostics();
  const ctx = snapshotContext();

  const submit = async () => {
    if (message.trim().length < 5) return;
    setBusy(true);
    setNotice(null);
    try {
      await getRepo().submitBugReport({
        user_id: state.sessionUserId,
        kind,
        message: message.trim(),
        ...(attach ? ctx : { page_url: ctx.page_url, user_agent: null, viewport: null, app_version: ctx.app_version }),
        diagnostics: attach ? diags : null,
        error_stack: attach ? (errorStack ?? null) : null,
      });
      clearDiagnostics();
      setDone(true);
      setMessage("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "تعذّر إرسال البلاغ — حاول لاحقاً.";
      // نميّز الرفض المقصود (حدّ المعدل/تكرار) عن العطل الحقيقي بـname لا بنصّ
      // الرسالة — النصّ عربي قابل للتغيير، والاسم عقد ثابت (RateLimitError).
      if (e instanceof Error && e.name === "RateLimitError") {
        setNotice(msg);
      } else if (/وصل قبل قليل|الحدّ الأقصى|حدّها في هذه الساعة/.test(msg)) {
        setNotice(msg);   // الوضع الوهمي يرمي Error عادياً بالنصّ نفسه
      } else {
        dispatch({ type: "TOAST", kind: "err", text: msg });
      }
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setDone(false); setShowDetails(false); setNotice(null); onClose(); };

  return (
    <Modal open={open} onClose={close} title="أبلغ عن مشكلة">
      {done ? (
        <div className="space-y-4 py-4 text-center">
          <div className="text-4xl" aria-hidden>✅</div>
          <p className="font-semibold text-stone-800">وصل بلاغك. شكراً لك.</p>
          <p className="text-[13px] text-stone-500">
            يستطيع مشرف المادة رؤيته الآن، وتستطيع أنت متابعة حالته من صفحة «ملفي».
          </p>
          <Button onClick={close} className="w-full">إغلاق</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {errorStack && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
              حدث عطل في الصفحة. وصفك لما كنت تفعله قبله يختصر علينا وقتاً طويلاً.
            </p>
          )}

          {notice && (
            <p role="status" className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[13px] text-sky-900">
              {notice}
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-stone-700">نوع البلاغ</legend>
            {KINDS.map((k) => (
              <label
                key={k.v}
                className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
              >
                <input type="radio" name="bugkind" checked={kind === k.v} onChange={() => setKind(k.v)} />
                <span aria-hidden>{k.icon}</span> {k.label}
              </label>
            ))}
          </fieldset>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">ماذا حدث؟ *</span>
            <textarea
              rows={4}
              maxLength={2000}
              className={inputCls}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="مثال: ضغطت «سجّل صوتك» فلم يفتح شيء. أستخدم هاتف أندرويد."
            />
            <span className="text-xs text-stone-500">
              {message.trim().length < 5 ? "٥ أحرف على الأقل" : `${message.length}/2000`}
            </span>
          </label>

          {/* الشفافية: نُري المستخدم بالضبط ما سيُرسل */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
            <label className="flex items-start gap-2 text-[13px]">
              <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="mt-1" />
              <span>
                <b>أرفق معلومات تقنية</b> تساعد على الإصلاح
                <span className="block text-[11px] text-stone-500">
                  المسار الحالي · نوع المتصفح · حجم الشاشة · آخر <span className="nums">{diags.length}</span> رسالة خطأ.
                  لا نرسل ما كتبته في أي حقل آخر، ولا موقعك.
                </span>
              </span>
            </label>

            {attach && (
              <>
                <button
                  type="button"
                  onClick={() => setShowDetails((s) => !s)}
                  className="mt-2 text-[12px] text-primary hover:underline"
                >
                  {showDetails ? "إخفاء ما سيُرسل" : "أرِني بالضبط ما سيُرسل"}
                </button>
                {showDetails && (
                  <pre className="latin mt-2 max-h-40 overflow-auto rounded-lg bg-stone-900 p-2 text-[10px] leading-relaxed text-stone-200">
{JSON.stringify({ ...ctx, diagnostics: diags, error_stack: errorStack ?? null }, null, 1)}
                  </pre>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={close} className="flex-1" disabled={busy}>إلغاء</Button>
            <Button onClick={submit} className="flex-1" disabled={busy || message.trim().length < 5}>
              {busy ? "جارٍ الإرسال…" : "إرسال البلاغ"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
