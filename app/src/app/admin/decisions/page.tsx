"use client";

/**
 * PAGE-013 / F013 — لوحة القرارات والتذكيرات
 *
 * المشروع فيه بنود معلَّقة حقيقية موثَّقة في `18-open-tasks.md`: مصير التسجيلات
 * آخر الفصل، تدقيق الترجمة قبل الفتح للعموم، النسخ الاحتياطي… لكنها في ملفٍ
 * داخل مستودع لا يفتحه صاحب المنصة في يومه. **والقرار الذي لا يراه صاحبه لا
 * يُحسم، والملف الذي لا يُقرأ لا يُحدَّث — فيصير أرشيفاً لا أداة.**
 *
 * هذه الصفحة ليست بديلاً عن الوثيقة بل واجهةً لها: البنود مبذورة منها في
 * `22-governance.sql`، وما يُحسم هنا يُنقل إليها عند أول تحديث للمشروع.
 */

import { useCallback, useEffect, useState } from "react";
import { Card, Button, EmptyState, inputCls } from "@/components/ui";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import type { AdminDecision } from "@/lib/types";

const PRIORITY = {
  high:   { label: "عالية",  cls: "bg-red-50 text-red-700 border-red-200" },
  normal: { label: "متوسطة", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  low:    { label: "منخفضة", cls: "bg-stone-50 text-stone-600 border-stone-200" },
} as const;

const STATUS = { open: "معلَّق", done: "حُسم", dropped: "أُسقط" } as const;

export default function AdminDecisionsPage() {
  const { dispatch, isSuperadmin } = useStore();
  const [rows, setRows] = useState<AdminDecision[] | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", note: "", priority: "normal" as keyof typeof PRIORITY, due_on: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setRows(await getRepo().loadDecisions()); }
    catch (e) {
      dispatch({ type: "TOAST", kind: "err", text: e instanceof Error ? e.message : "تعذّر التحميل" });
      setRows([]);
    }
  }, [dispatch]);

  useEffect(() => { void load(); }, [load]);

  const save = async (patch: Partial<AdminDecision> & { title: string }) => {
    setBusy(true);
    try { await getRepo().upsertDecision(patch); await load(); }
    catch (e) { dispatch({ type: "TOAST", kind: "err", text: e instanceof Error ? e.message : "تعذّر الحفظ" }); }
    finally { setBusy(false); }
  };

  const setStatus = (d: AdminDecision, status: AdminDecision["status"]) =>
    save({ id: d.id, title: d.title, status });

  const remove = async (d: AdminDecision) => {
    setBusy(true);
    try {
      await getRepo().deleteDecision(d.id);
      dispatch({ type: "TOAST", text: "حُذف البند." });
      await load();
    } catch (e) {
      dispatch({ type: "TOAST", kind: "err", text: e instanceof Error ? e.message : "تعذّر الحذف" });
    } finally { setBusy(false); }
  };

  if (rows === null) return <EmptyState icon="⏳" title="جارٍ تحميل القرارات…" />;

  const open = rows.filter((r) => r.status === "open");
  const closed = rows.filter((r) => r.status !== "open");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex-1">
          <p className="font-semibold text-stone-800">
            <span className="nums">{open.length}</span> بنداً معلَّقاً
          </p>
          <p className="mt-0.5 text-[12px] text-stone-500">
            قرارات تشغيلية وتذكيرات. مصدرها الأول <span className="latin">18-open-tasks.md</span>،
            وما تحسمه هنا يُنقل إليها في أول تحديث.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding((s) => !s)}>{adding ? "إلغاء" : "+ بند جديد"}</Button>
      </Card>

      {adding && (
        <Card className="space-y-3 p-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">العنوان *</span>
            <input className={inputCls} value={draft.title} maxLength={200}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="مثال: مراجعة أذونات الطلاب قبل بداية الفصل" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">تفصيل</span>
            <textarea className={inputCls} rows={3} maxLength={2000} value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              placeholder="لماذا هذا البند مهم، وما الذي يتوقّف عليه." />
          </label>
          <div className="flex flex-wrap gap-3">
            <label className="space-y-1.5">
              <span className="block text-sm font-medium text-stone-700">الأولوية</span>
              <select className={inputCls} value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value as keyof typeof PRIORITY })}>
                {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-sm font-medium text-stone-700">موعد الاستحقاق (اختياري)</span>
              <input type="date" className={`${inputCls} nums`} value={draft.due_on}
                onChange={(e) => setDraft({ ...draft, due_on: e.target.value })} />
            </label>
          </div>
          <Button
            disabled={busy || draft.title.trim().length < 3}
            onClick={async () => {
              await save({
                title: draft.title.trim(),
                note: draft.note.trim() || null,
                priority: draft.priority,
                due_on: draft.due_on || null,
              });
              setDraft({ title: "", note: "", priority: "normal", due_on: "" });
              setAdding(false);
            }}
          >
            {busy ? "جارٍ الحفظ…" : "أضف البند"}
          </Button>
        </Card>
      )}

      {open.length === 0 ? (
        <EmptyState icon="✅" title="لا بنود معلَّقة" hint="كل شيء محسوم — أضف بنداً حين يظهر قرار جديد." />
      ) : (
        <ul className="space-y-2">
          {open.map((d) => {
            const overdue = d.due_on !== null && d.due_on <= today;
            return (
              <li key={d.id}>
                <Card className={`p-4 ${overdue ? "border-red-300 bg-red-50/40" : ""}`}>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${PRIORITY[d.priority].cls}`}>
                      {PRIORITY[d.priority].label}
                    </span>
                    {d.source && (
                      <span className="latin rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">{d.source}</span>
                    )}
                    {d.due_on && (
                      <span className={`nums rounded-lg px-2 py-0.5 text-[11px] ${overdue ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-500"}`}>
                        {overdue ? "استحقّ " : "يستحقّ "}{d.due_on}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 font-semibold text-stone-900">{d.title}</p>
                  {d.note && <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{d.note}</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" disabled={busy} onClick={() => setStatus(d, "done")}>حُسم ✓</Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(d, "dropped")}>أسقِطه</Button>
                    {isSuperadmin && (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => remove(d)}>احذف</Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {closed.length > 0 && (
        <>
          <button onClick={() => setShowDone((s) => !s)} className="px-1 text-[13px] text-primary hover:underline">
            {showDone ? "إخفاء" : "أظهر"} المحسوم والمُسقَط (<span className="nums">{closed.length}</span>)
          </button>
          {showDone && (
            <ul className="space-y-2">
              {closed.map((d) => (
                <li key={d.id}>
                  <Card className="flex flex-wrap items-center gap-3 p-3 opacity-70">
                    <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] text-stone-600">{STATUS[d.status]}</span>
                    <span className="min-w-0 flex-1 text-[13px] text-stone-700 line-through">{d.title}</span>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus(d, "open")}>أعِده</Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
