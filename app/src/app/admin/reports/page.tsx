"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, Button, EmptyState } from "@/components/ui";
import { reportThresholds } from "@/lib/algorithms";
import type { ReportStatus } from "@/lib/types";

const REASON_AR: Record<string, string> = {
  incorrect_recitation: "خطأ في التلاوة", poor_quality: "جودة رديئة",
  inappropriate: "غير لائق", other: "أخرى",
};
const FILTERS: { v: ReportStatus | "all"; label: string }[] = [
  { v: "open", label: "مفتوحة" }, { v: "resolved", label: "محلولة" },
  { v: "dismissed", label: "مرفوضة" }, { v: "all", label: "الكل" },
];

/** PAGE-007-SUB-01 / UC-012 */
export default function AdminReports() {
  const { state, dispatch, activeUsersCount } = useStore();
  const MOCK_HADITHS = state.hadiths;
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const t = reportThresholds(activeUsersCount, state.settings);

  // تجميع البلاغات حسب التسجيل
  const groups = Object.values(
    state.reports.filter((r) => (filter === "all" ? true : r.status === filter))
      .reduce<Record<string, typeof state.reports>>((acc, r) => {
        (acc[r.recording_id] ??= []).push(r); return acc;
      }, {})
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${filter === f.v ? "bg-primary text-white" : "bg-white border border-stone-300 text-stone-600"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="✅" title="لا بلاغات في هذا التصنيف" hint="كل شيء على ما يرام." />
      ) : (
        groups.map((grp) => {
          const rec = state.recordings.find((x) => x.id === grp[0].recording_id);
          const owner = state.profiles.find((p) => p.id === rec?.user_id);
          const hadith = rec && MOCK_HADITHS.find((h) => h.id === rec.hadith_id);
          const openCount = state.reports.filter((r) => r.recording_id === grp[0].recording_id && r.status === "open").length;
          const level = openCount >= t.hide ? "hide" : openCount >= t.alert ? "alert" : "ok";

          return (
            <Card key={grp[0].recording_id} className={`p-4 ${level === "hide" ? "border-red-300 bg-red-50/40" : level === "alert" ? "border-amber-300 bg-amber-50/40" : ""}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="font-semibold text-stone-800">{owner?.display_name ?? "—"}</span>
                {rec?.is_verified && <span className="rounded bg-primary-soft px-1.5 py-0.5 font-semibold text-primary">✅</span>}
                {rec?.is_hidden && <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">مخفي</span>}
                <span className={`rounded px-1.5 py-0.5 font-semibold ${level === "hide" ? "bg-red-100 text-red-700" : level === "alert" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>
                  <span className="nums">{openCount}</span>/<span className="nums">{t.hide}</span> بلاغ مفتوح
                </span>
                {hadith && <Link href={`/hadiths/${hadith.id}`} className="mr-auto text-primary hover:underline">فتح الحديث ›</Link>}
              </div>

              {hadith && <p className="mb-3 font-hadith text-[16px] leading-8 text-stone-700 line-clamp-1">{hadith.matn_ar}</p>}
              {rec && <audio src={"/" + rec.file_path} controls className="mb-3 w-full" />}

              <ul className="space-y-2">
                {grp.map((r) => {
                  const rep = state.profiles.find((p) => p.id === r.reporter_id);
                  return (
                    <li key={r.id} className="rounded-xl bg-white/70 border border-stone-200 p-3 text-[13px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-stone-700">{REASON_AR[r.reason]}</span>
                        <span className="text-stone-400">— {rep?.display_name}</span>
                        <span className={`mr-auto rounded px-1.5 py-0.5 text-[11px] ${r.status === "open" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>
                          {r.status === "open" ? "مفتوح" : r.status === "resolved" ? "محلول" : "مرفوض"}
                        </span>
                      </div>
                      {r.note && <p className="mt-1 text-stone-600">{r.note}</p>}
                      {r.status === "open" && (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => { dispatch({ type: "RESOLVE_REPORT", reportId: r.id, status: "resolved" }); dispatch({ type: "TOAST", text: "عُلّم البلاغ كمحلول." }); }}>معالجة</Button>
                          <Button size="sm" variant="ghost" onClick={() => { dispatch({ type: "RESOLVE_REPORT", reportId: r.id, status: "dismissed" }); dispatch({ type: "TOAST", text: "رُفض البلاغ." }); }}>رفض</Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {rec && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-200 pt-3">
                  <Button size="sm" onClick={() => dispatch({ type: "SET_VERIFIED", recordingId: rec.id, value: !rec.is_verified })}>
                    {rec.is_verified ? "إلغاء الاعتماد" : "اعتماد ✅"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => dispatch({ type: "SET_HIDDEN", recordingId: rec.id, value: !rec.is_hidden })}>
                    {rec.is_hidden ? "إظهار التسجيل" : "إخفاء التسجيل"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600"
                    onClick={() => { dispatch({ type: "DELETE_RECORDING", recordingId: rec.id }); dispatch({ type: "TOAST", text: "حُذف التسجيل." }); }}>
                    حذف التسجيل
                  </Button>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
