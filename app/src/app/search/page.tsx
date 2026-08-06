"use client";

/**
 * صفحة البحث — F010
 *
 * أهم ميزة كانت ناقصة: ٣٥٬٧٩٨ حديثاً بلا وسيلة للوصول إلى حديث بعينه.
 * الطالب الذي يذكر «إنما الأعمال» ولا يذكر موضعه كان لا يجد شيئاً.
 *
 * القرارات التي تستحق الشرح:
 *  ١) البحث بلا تشكيل يعمل — التطبيع في `ar_normalize` داخل Postgres.
 *  ٢) بحث واحد يمسح اللغات الثلاث معاً، فلا نسأل المستخدم عن لغته.
 *  ٣) تأخير ٣٥٠ms قبل الإرسال — ٣٥ ألف حديث ومستخدم يكتب بسرعة يعني
 *     عشرات الاستعلامات في الثانية، وحصة Egress محدودة.
 *  ٤) **[FIX SRCH-01] التظليل صار في المتصفح لا في `ts_headline`.**
 *     سببان: `ts_headline` كان يبني المقتطف من النصّ المطبَّع فيظهر متن
 *     الحديث بلا تشكيل — وهو عيب في منصة غايتها ضبط النطق أصلاً؛ وكان
 *     يُطبَّق على `matn_ar` وحده فتبقى الترجمة التي طابقت بلا تظليل.
 *     التفصيل في `src/lib/highlight.ts`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getRepo } from "@/lib/repo";
import type { SearchResult } from "@/lib/repo/types";
import { queryTerms } from "@/lib/highlight";
import Highlight from "@/components/Highlight";
import LangSwitcher from "@/components/LangSwitcher";
import { langAttrs, useContentLang } from "@/lib/i18n";

const MIN_LEN = 2;
const DEBOUNCE_MS = 350;
/** نافذة المتن المعروضة في النتيجة — تكفي لرؤية السياق دون دفن الصفحة */
const MATN_WINDOW = 300;
const TRANS_WINDOW = 220;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const { lang, name, translation } = useContentLang();
  const attrs = langAttrs(lang);

  // كلمات البحث المطبَّعة — تُحسب من الاستعلام الذي أُرسل فعلاً لا الذي يُكتب،
  // وإلا وميض التظليل مع كل حرف قبل وصول النتائج.
  const [applied, setApplied] = useState("");
  const terms = useMemo(() => queryTerms(applied), [applied]);

  // يمنع سباق النتائج: استجابة بطيئة لاستعلام قديم يجب ألا تدهس نتيجة أحدث
  const seq = useRef(0);

  const run = useCallback(async (q: string) => {
    const mine = ++seq.current;
    if (q.trim().length < MIN_LEN) {
      setResults([]); setSearched(false); setLoading(false); setApplied(""); return;
    }
    setLoading(true); setError(null);
    try {
      const rows = await getRepo().searchHadiths(q, { limit: 40 });
      if (mine !== seq.current) return;          // وصلت متأخرة — أهملها
      setResults(rows); setSearched(true); setApplied(q);
    } catch (e) {
      if (mine !== seq.current) return;
      setError(e instanceof Error ? e.message : "تعذّر البحث");
      setResults([]);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void run(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, run]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">البحث في الأحاديث</h1>
          <p className="mt-1 text-sm text-stone-500">
            ابحث في <span className="nums">٣٥٬٧٩٨</span> حديثاً — بالعربية أو الإنجليزية أو الإندونيسية.
            لا حاجة لكتابة التشكيل.
          </p>
        </div>
        <LangSwitcher />
      </header>

      <div className="relative">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثال: إنما الأعمال بالنيات · niat · intention"
          aria-label="نص البحث"
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pe-11 text-base
                     shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-stone-400">
          {loading ? (
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-label="جارٍ البحث">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" className="opacity-25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </span>
      </div>

      {query.trim().length > 0 && query.trim().length < MIN_LEN && (
        <p className="mt-3 text-sm text-stone-500">اكتب حرفين على الأقل.</p>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 px-5 py-8 text-center">
          <p className="text-stone-600">لا نتائج لـ «{query}»</p>
          <p className="mt-2 text-sm text-stone-500">
            جرّب كلمات أقل، أو كلمة من متن الحديث بدل ترجمته.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <p className="mt-5 text-sm text-stone-500">
          <span className="nums">{results.length}</span> نتيجة
          {results.length >= 40 && " (الأربعون الأعلى مطابقةً)"}
        </p>
      )}

      <ol className="mt-3 space-y-3">
        {results.map((r) => {
          const trans = translation({ translation_id: r.translationId, translation_en: r.translationEn });
          return (
            <li key={r.id}>
              <Link
                href={`/hadiths/${r.id}`}
                className="block rounded-xl border border-stone-200 bg-white p-4 transition
                           hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                    {name(toNamed(r.collectionName))}
                  </span>
                  <span>{name(toNamed(r.bookName))}</span>
                  <span aria-hidden>·</span>
                  <span className="nums">رقم {r.hadithNumber}</span>
                </div>

                {/* [FIX SRCH-01] المتن الأصلي **بتشكيله**، والتظليل يُبنى فوقه */}
                <Highlight
                  text={r.matnAr}
                  terms={terms}
                  maxChars={MATN_WINDOW}
                  lang="ar"
                  dir="rtl"
                  className="block font-hadith text-lg leading-loose text-stone-800"
                />

                {/* [FIX SRCH-02] الترجمة تُظلَّل أيضاً — من بحث بالإندونيسية أو
                    الإنجليزية كان يرى نتيجةً بلا أي دليل على موضع المطابقة */}
                {trans && (
                  <Highlight
                    text={trans}
                    terms={terms}
                    maxChars={TRANS_WINDOW}
                    lang={attrs.lang}
                    dir={attrs.dir}
                    className="latin mt-2 block text-sm leading-relaxed text-stone-500"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** أسماء نتيجة البحث تأتي بشكل `{ar,en,id}` — نحوّلها لعقد `Named` الموحَّد */
function toNamed(n: { ar: string; en: string | null; id: string | null }) {
  return { name_ar: n.ar, name_en: n.en, name_id: n.id };
}
