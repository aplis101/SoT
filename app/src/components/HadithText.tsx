"use client";
import { useState } from "react";
import type { Hadith, WordDefinition } from "@/lib/types";

/** F002 / PAGE-005-SUB-04 — المتن مع كلمات غريبة قابلة للنقر */
export default function HadithText({ hadith, words }: { hadith: Hadith; words: WordDefinition[] }) {
  const [open, setOpen] = useState<WordDefinition | null>(null);

  // تقسيم المتن وتحويل الكلمات الغريبة إلى أزرار
  const parts: React.ReactNode[] = [];
  let rest = hadith.matn_ar;
  let key = 0;
  const sorted = [...words].sort((a, b) => rest.indexOf(a.word) - rest.indexOf(b.word));
  for (const w of sorted) {
    const i = rest.indexOf(w.word);
    if (i < 0) continue;
    parts.push(<span key={`t${key++}`}>{rest.slice(0, i)}</span>);
    parts.push(
      <button key={`w${key++}`} className="gharib" onClick={() => setOpen(w)} aria-label={`معنى كلمة ${w.word}`}>
        {w.word}
      </button>
    );
    rest = rest.slice(i + w.word.length);
  }
  parts.push(<span key={`t${key++}`}>{rest}</span>);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      {/* الإسناد — باهت على خلفية رمادية */}
      <div className="border-b border-stone-200 bg-stone-100 px-5 py-4">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-stone-400">الإسناد</p>
        <p className="font-hadith text-isnad text-stone-500">{hadith.isnad_ar}</p>
      </div>

      {/* المتن — بارز */}
      <div className="px-5 py-6">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">المتن</p>
        <p className="font-hadith text-matn text-stone-900">{parts}</p>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0" onClick={() => setOpen(null)} aria-hidden />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl">
            <p className="font-hadith text-2xl text-primary">{open.word}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-stone-700">{open.definition_ar}</p>
            {open.definition_id && <p className="latin mt-2 text-sm text-stone-500">{open.definition_id}</p>}
            <button onClick={() => setOpen(null)} className="mt-4 w-full rounded-xl bg-stone-100 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
