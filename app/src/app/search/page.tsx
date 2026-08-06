"use client";

/**
 * صفحة البحث — F010
 *
 * أهم ميزة كانت ناقصة: ٣٥٬٧٩٨ حديثاً بلا وسيلة للوصول إلى حديث بعينه.
 * الطالب الذي يذكر «إنما الأعمال» ولا يذكر موضعه كان لا يجد شيئاً.
 *
 * ثلاث قرارات في هذه الصفحة تستحق الشرح:
 *  ١) البحث بلا تشكيل يعمل — التطبيع في `ar_normalize` داخل Postgres.
 *  ٢) بحث واحد يمسح اللغات الثلاث معاً، فلا نسأل المستخدم عن لغته.
 *  ٣) تأخير ٣٥٠ms قبل الإرسال — ٣٥ ألف حديث ومستخدم يكتب بسرعة يعني
 *     عشرات الاستعلامات في الثانية، وحصة Egress محدودة.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRepo } from "@/lib/repo";
import type { SearchResult } from "@/lib/repo/types";

const MIN_LEN = 2;
const DEBOUNCE_MS = 350;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // يمنع سباق النتائج: استجابة بطيئة لاستعلام قديم يجب ألا تدهس نتيجة أحدث
  const seq = useRef(0);

  const run = useCallback(async (q: string) => {
    const mine = ++seq.current;
    if (q.trim().length < MIN_LEN) {
      setResults([]); setSearched(false); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try {
      const rows = await getRepo().searchHadiths(q, { limit: 40 });
      if (mine !== seq.current) return;          // وصلت متأخرة — أهملها
      setResults(rows); setSearched(true);
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">البحث في الأحاديث</h1>
        <p className="mt-1 text-sm text-stone-500">
          ابحث في <span className="nums">٣٥٬٧٩٨</span> حديثاً — بالعربية أو الإنجليزية أو الإندونيسية.
          لا حاجة لكتابة التشكيل.
        </p>
      </header>

      <div className="relative">
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="مثال: إنما الأعمال بالنيات"
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
        {results.map((r) => (
          <li key={r.id}>
            <Link
              href={`/hadiths/${r.id}`}
              className="block rounded-xl border border-stone-200 bg-white p-4 transition
                         hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {r.collectionName.ar}
                </span>
                <span>{r.bookName.ar}</span>
                <span aria-hidden>·</span>
                <span className="nums">رقم {r.hadithNumber}</span>
              </div>

              {/* المقتطف نصّ مطبَّع من Postgres مع <mark> حول المطابقات.
                  آمن: ts_headline لا يُخرج إلا العلامة التي طلبناها، والنص
                  مصدره قاعدتنا لا مدخلات المستخدم. */}
              <p
                className="font-hadith text-lg leading-loose text-stone-800 [&_mark]:bg-amber-200/70 [&_mark]:text-stone-900"
                dangerouslySetInnerHTML={{ __html: sanitizeSnippet(r.snippet) }}
              />

              {r.translationId && (
                <p className="latin mt-2 line-clamp-2 text-sm text-stone-500">{r.translationId}</p>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * دفاع في العمق: نسمح بـ<mark> وحدها ونحيّد كل ما عداها.
 * المقتطف يأتي من قاعدتنا لا من المستخدم، لكن قاعدة المشروع أن الحدّ الأمني
 * لا يُبنى على افتراض حسن نيّة المصدر (19-security-model.md §٢).
 */
function sanitizeSnippet(html: string): string {
  return (html ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;mark&gt;/g, "<mark>")
    .replace(/&lt;\/mark&gt;/g, "</mark>");
}
