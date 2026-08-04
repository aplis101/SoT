"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, Button, EmptyState } from "@/components/ui";
import { MOCK_HADITHS } from "@/lib/mock-data";
import type { ReportStatus } from "@/lib/types";

const TYPE_AR: Record<string, string> = {
  tashkeel: "تشكيل", translation: "ترجمة", isnad: "إسناد", takhrij: "تخريج", other: "أخرى",
};

/** PAGE-007-SUB-02 / UC-012 — عالج فجوة TST-02 (لم يكن لها أي تغطية) */
export default function AdminContentReports() {
  const { state, dispatch } = useStore();
  const [filter, setFilter] = useState<ReportStatus | "all">("open");
  const list = state.contentReports.filter((r) => (filter === "all" ? true : r.status === filter));

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto">
        {(["open", "resolved", "dismissed", "all"] as const).map((v) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm ${filter === v ? "bg-primary text-white" : "bg-white border border-stone-300 text-stone-600"}`}>
            {v === "open" ? "مفتوحة" : v === "resolved" ? "محلولة" : v === "dismissed" ? "مرفوضة" : "الكل"}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon="📝" title="لا بلاغات محتوى في هذا التصنيف" />
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const h = MOCK_HADITHS.find((x) => x.id === r.hadith_id);
            const rep = state.profiles.find((p) => p.id === r.reporter_id);
            return (
              <li key={r.id}>
                <Card className={`p-4 ${r.status === "open" ? "border-amber-300 bg-amber-50/40" : ""}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px]">
                    <span className="rounded bg-stone-100 px-2 py-0.5 font-semibold text-stone-700">{TYPE_AR[r.error_type]}</span>
                    <span className="text-stone-500">أبلغ: {rep?.display_name}</span>
                    <span className="nums text-stone-400">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
                    {h && <Link href={`/hadiths/${h.id}`} className="mr-auto text-primary hover:underline">فتح الحديث ›</Link>}
                  </div>
                  {h && <p className="mb-2 font-hadith text-[16px] leading-8 text-stone-700 line-clamp-1">{h.matn_ar}</p>}
                  <p className="rounded-xl bg-white/70 border border-stone-200 p-3 text-[13px] text-stone-700">{r.description}</p>
                  {r.status === "open" ? (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={() => { dispatch({ type: "RESOLVE_CONTENT_REPORT", reportId: r.id, status: "resolved" }); dispatch({ type: "TOAST", text: "عُلّم البلاغ كمصحَّح." }); }}>تم التصحيح</Button>
                      <Button size="sm" variant="ghost" onClick={() => { dispatch({ type: "RESOLVE_CONTENT_REPORT", reportId: r.id, status: "dismissed" }); dispatch({ type: "TOAST", text: "رُفض البلاغ." }); }}>رفض</Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12px] font-medium text-stone-500">{r.status === "resolved" ? "✔ صُحِّح" : "✖ مرفوض"}</p>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
