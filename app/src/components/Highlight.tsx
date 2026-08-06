"use client";

import { useMemo } from "react";
import { highlight } from "@/lib/highlight";

/**
 * عرض نصّ مع تظليل مواضع البحث — للعربية والإندونيسية والإنجليزية سواءً.
 *
 * قرار أمني مقصود: هذا المكوّن **لا يستعمل `dangerouslySetInnerHTML`**.
 * النسخة السابقة كانت تحقن HTML قادماً من `ts_headline` ثم تنظّفه يدوياً؛
 * وأي تنظيف يدوي هو دَين أمني مؤجَّل (19-security-model.md §٢). هنا يبني
 * React العُقد بنفسه، فالنصّ نصٌّ مهما كان محتواه — ولو أدخل مشرفٌ يوماً
 * وسماً في متن أو ترجمة.
 */
export default function Highlight({
  text,
  terms,
  maxChars,
  className,
  lang,
  dir,
}: {
  text: string | null | undefined;
  terms: string[];
  /** أقصى طول معروض — يقتصّ نافذةً حول أول تطابق. اتركه فارغاً لعرض الكل */
  maxChars?: number;
  className?: string;
  lang?: string;
  dir?: "rtl" | "ltr";
}) {
  const { segments, head, tail } = useMemo(
    () => highlight(text, terms, maxChars),
    [text, terms, maxChars]
  );

  if (!text) return null;

  return (
    <span className={className} lang={lang} dir={dir}>
      {head && <span aria-hidden>…</span>}
      {segments.map((s, i) =>
        s.hit ? (
          <mark key={i} className="rounded-[3px] bg-amber-200/70 px-px text-stone-900">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
      {tail && <span aria-hidden>…</span>}
    </span>
  );
}
