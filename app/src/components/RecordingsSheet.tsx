"use client";
import { useState } from "react";
import { Modal, Button, EmptyState } from "./ui";
import { useStore } from "@/lib/store";
import type { RecordingView, ReportReason } from "@/lib/types";
import AudioPlayer from "./AudioPlayer";

const REASONS: { v: ReportReason; label: string }[] = [
  { v: "incorrect_recitation", label: "خطأ في التلاوة أو الضبط" },
  { v: "poor_quality", label: "جودة صوت رديئة" },
  { v: "inappropriate", label: "محتوى غير لائق" },
  { v: "other", label: "سبب آخر" },
];

type SortKey = "likes" | "newest" | "verified";

/** F003+F005 / UC-005..UC-010 / PAGE-005-SUB-01 — لوحة التسجيلات المنزلقة */
export default function RecordingsSheet({
  open, onClose, list, onSelect,
}: { open: boolean; onClose: () => void; list: RecordingView[]; onSelect: (r: RecordingView) => void }) {
  const { state, dispatch, me, isAdmin } = useStore();
  const [sort, setSort] = useState<SortKey>("likes");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [reportFor, setReportFor] = useState<RecordingView | null>(null);
  const [reason, setReason] = useState<ReportReason>("incorrect_recitation");
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<RecordingView | null>(null);

  const shown = list
    .filter((r) => (onlyVerified ? r.is_verified : true))
    .sort((a, b) =>
      sort === "newest" ? +new Date(b.created_at) - +new Date(a.created_at)
      : sort === "verified" ? Number(b.is_verified) - Number(a.is_verified) || b.likes_count - a.likes_count
      : b.likes_count - a.likes_count || +new Date(b.created_at) - +new Date(a.created_at)
    );

  const submitReport = () => {
    if (!reportFor || !me) return;
    const already = state.reports.some((r) => r.recording_id === reportFor.id && r.reporter_id === me.id);
    if (already) { dispatch({ type: "TOAST", text: "سبق أن أبلغت عن هذا التسجيل.", kind: "err" }); setReportFor(null); return; }
    dispatch({
      type: "SUBMIT_REPORT",
      report: { id: `rep-${Date.now()}`, recording_id: reportFor.id, reporter_id: me.id, reason, note: note.trim() || null, status: "open", created_at: new Date().toISOString() },
    });
    dispatch({ type: "TOAST", text: "تم إرسال البلاغ إلى المشرف." });
    setReportFor(null); setNote(""); setReason("incorrect_recitation");
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={`التسجيلات (${shown.length})`} wide>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="sortsel">ترتيب</label>
          <select id="sortsel" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm">
            <option value="likes">الأكثر إعجاباً</option>
            <option value="newest">الأحدث</option>
            <option value="verified">المعتمدة أولاً</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm">
            <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
            المعتمدة ✅ فقط
          </label>
        </div>

        {shown.length === 0 ? (
          <EmptyState icon="🎤" title="لا توجد تسجيلات مطابقة" hint="جرّب إزالة الفلاتر، أو كن أول من يسجّل هذا الحديث." />
        ) : (
          <ul className="space-y-3">
            {shown.map((r) => (
              <li key={r.id} className={`rounded-2xl border p-3 ${r.is_hidden ? "border-red-200 bg-red-50/50" : "border-stone-200 bg-white"}`}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-medium text-stone-800">{r.display_name}</span>
                  {r.is_verified && <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">✅ معتمد</span>}
                  {r.is_community_best && <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-like">الأفضل مجتمعياً</span>}
                  {r.is_hidden && <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">مخفي ببلاغات</span>}
                  {r.user_id === me?.id && <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-600">تسجيلي</span>}
                  <span className="mr-auto text-[11px] text-stone-400 nums">{new Date(r.created_at).toLocaleDateString("ar-EG")}</span>
                </div>

                <AudioPlayer rec={r} compact />

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "TOGGLE_LIKE", recordingId: r.id })}
                    aria-pressed={r.liked_by_me} className={r.liked_by_me ? "text-like" : ""}>
                    {r.liked_by_me ? "❤️" : "🤍"} <span className="nums">{r.likes_count}</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "TOGGLE_FAVORITE", recordingId: r.id })}
                    aria-pressed={r.favorited_by_me} className={r.favorited_by_me ? "text-favorite" : ""}>
                    {r.favorited_by_me ? "⭐" : "☆"} مفضّلتي
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { onSelect(r); onClose(); }}>تعيين للمشغّل</Button>

                  {r.user_id !== me?.id && (
                    <Button size="sm" variant="ghost" onClick={() => setReportFor(r)}>🚩 إبلاغ</Button>
                  )}
                  {r.user_id === me?.id && (
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDelete(r)}>🗑️ حذف</Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => dispatch({ type: "SET_VERIFIED", recordingId: r.id, value: !r.is_verified })}>
                        {r.is_verified ? "إلغاء الاعتماد" : "اعتماد ✅"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => dispatch({ type: "SET_HIDDEN", recordingId: r.id, value: !r.is_hidden })}>
                        {r.is_hidden ? "إظهار" : "إخفاء"}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal open={!!reportFor} onClose={() => setReportFor(null)} title="الإبلاغ عن تسجيل صوتي">
        <div className="space-y-3">
          <p className="text-sm text-stone-600">تسجيل: <b>{reportFor?.display_name}</b></p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-stone-700">سبب البلاغ</legend>
            {REASONS.map((x) => (
              <label key={x.v} className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input type="radio" name="reason" checked={reason === x.v} onChange={() => setReason(x.v)} />
                {x.label}
              </label>
            ))}
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">ملاحظة (اختياري)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={300}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" placeholder="وضّح الخطأ إن أمكن…" />
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setReportFor(null)} className="flex-1">إلغاء</Button>
            <Button onClick={submitReport} className="flex-1">إرسال البلاغ</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="تأكيد الحذف">
        <p className="text-sm text-stone-600">سيُحذف تسجيلك نهائياً مع كل إعجاباته ونجومه. لا يمكن التراجع.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">إلغاء</Button>
          <Button variant="danger" className="flex-1"
            onClick={() => { dispatch({ type: "DELETE_RECORDING", recordingId: confirmDelete!.id }); dispatch({ type: "TOAST", text: "تم حذف التسجيل." }); setConfirmDelete(null); }}>
            حذف نهائي
          </Button>
        </div>
      </Modal>
    </>
  );
}
