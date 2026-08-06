"use client";

import { CONTENT_LANGS, useContentLang } from "@/lib/i18n";

/**
 * مبدّل لغة المحتوى — ثلاثة أزرار ظاهرة لا قائمة منسدلة.
 *
 * السبب: الخيارات ثلاثة فقط، والقائمة المنسدلة تخفي وجود الميزة أصلاً. أكثر
 * طلاب المقرَّر لا يعلمون أن ترجمة إنجليزية موجودة؛ إظهار الأزرار هو ما
 * يعرّفهم بها. (12-design-system.md: لا تُخفِ خياراً عدده ≤ ٣.)
 */
export default function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useContentLang();

  return (
    <div
      role="radiogroup"
      aria-label="لغة المحتوى"
      className="inline-flex items-center gap-0.5 rounded-lg bg-stone-100 p-0.5"
    >
      {CONTENT_LANGS.map((l) => (
        <button
          key={l.v}
          role="radio"
          aria-checked={lang === l.v}
          title={`${l.label} — ${l.hint}`}
          onClick={() => setLang(l.v)}
          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
            lang === l.v
              ? "bg-white text-primary shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <span className={l.v === "ar" ? "" : "latin"}>{compact ? l.short : l.label}</span>
        </button>
      ))}
    </div>
  );
}
