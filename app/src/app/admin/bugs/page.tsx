"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { Card, Button, EmptyState } from "@/components/ui";
import type { BugReport, BugStatus } from "@/lib/types";

const KIND_AR: Record<string, string> = {
  bug: "عطل", content: "خطأ محتوى", idea: "اقتراح", other: "أخرى",
};
const STATUS_AR: Record<string, string> = {
  open: "مفتوح", triaged: "قيد النظر", fixed: "أُصلح", wontfix: "لن يُعالج",
};
const FILTERS: (BugStatus | "all")[] = ["open", "triaged", "fixed", "wontfix", "all"];

/** PAGE-007-SUB-05 / F009 — بلاغات المنصة التقنية */
export default function AdminBugsPage() {
  const { state, dispatch } = useStore();
  const [rows, setRows] = useState<BugReport[]>([]);
  const [filter, setFilter] = useState<BugStatus | "all">("open");
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let off = false;
    getRepo().loadBugReports()
      .then((r) => { if (!off) setRows(r); })
      .catch((e) => { if (!off) dispatch({ type: "TOAST", text: e instanceof Error ? e.message : "تعذّر التحميل", kind: "err" }); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [dispatch]);

  const setStatus = async (id: string, status: BugStatus) => {
    try {
      await getRepo().updateBugReport(id, { status });
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      dispatch({ type: "TOAST", text: `عُلّم البلاغ: ${STATUS_AR[status]}` });
    } catch (e) {
      dispatch({ type: "TOAST", text: e instanceof Error ? e.message : "فشل", kind: "err" });
    }
  };

  const shown = rows.filter((r) => (filter === "all" ? true : r.status === filter));
  const nameOf = (uid: string | null) =>
    uid ? state.profiles.find((p) => p.id === uid)?.display_name ?? "مستخدم" : "زائر غير مسجّل";

  if (loading) return <EmptyState icon="⏳" title="جارٍ تحميل البلاغات…" />;

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[13px] text-sky-900">
        هذه بلاغات عن <b>أعطال المنصة نفسها</b> — منفصلة عن بلاغات التسجيلات وبلاغات نصوص الأحاديث،
        لأن لكلٍّ دورة حياة مختلفة.
      </p>

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${filter === f ? "bg-primary text-white" : "border border-stone-300 bg-white text-stone-600"}`}>
            {f === "all" ? "الكل" : STATUS_AR[f]}
            <span className="nums mr-1 opacity-70">
              {f === "all" ? rows.length : rows.filter((r) => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="✅" title="لا بلاغات في هذا التصنيف" hint="كل شيء على ما يرام." />
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id}>
              <Card className={`p-4 ${r.status === "open" ? "border-amber-300 bg-amber-50/40" : ""}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="rounded bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">{KIND_AR[r.kind]}</span>
                  <span className="text-stone-500">{nameOf(r.user_id)}</span>
                  <span className="nums text-stone-400">{new Date(r.created_at).toLocaleString("ar-EG")}</span>
                  <span className={`mr-auto rounded px-1.5 py-0.5 font-semibold ${r.status === "open" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>
                    {STATUS_AR[r.status]}
                  </span>
                </div>

                <p className="whitespace-pre-wrap rounded-xl bg-white/70 border border-stone-200 p-3 text-[14px] text-stone-800">
                  {r.message}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500">
                  {r.page_url && <span className="latin">📍 {r.page_url}</span>}
                  {r.viewport && <span className="latin">🖥 {r.viewport}</span>}
                  {r.app_version && <span className="latin">v{r.app_version}</span>}
                </div>

                {(r.error_stack || (Array.isArray(r.diagnostics) && r.diagnostics.length > 0)) && (
                  <button onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="mt-2 text-[12px] text-primary hover:underline">
                    {openId === r.id ? "إخفاء السياق التقني" : "عرض السياق التقني"}
                  </button>
                )}
                {openId === r.id && (
                  <pre className="latin mt-2 max-h-56 overflow-auto rounded-lg bg-stone-900 p-2 text-[10px] leading-relaxed text-stone-200">
{JSON.stringify({ user_agent: r.user_agent, error_stack: r.error_stack, diagnostics: r.diagnostics }, null, 1)}
                  </pre>
                )}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-200 pt-3">
                  {(["triaged", "fixed", "wontfix"] as BugStatus[])
                    .filter((s) => s !== r.status)
                    .map((s) => (
                      <Button key={s} size="sm" variant={s === "fixed" ? "primary" : "outline"}
                        onClick={() => setStatus(r.id, s)}>
                        {STATUS_AR[s]}
                      </Button>
                    ))}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
