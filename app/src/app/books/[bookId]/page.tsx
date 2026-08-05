"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, EmptyState, GradeBadge } from "@/components/ui";
import Breadcrumb from "@/components/Breadcrumb";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";

/** PAGE-004 / F001 — أبواب الكتاب وأحاديثه */
export default function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const { state, dispatch } = useStore();
  const [loading, setLoading] = useState(true);
  const { collections: MOCK_COLLECTIONS, books: MOCK_BOOKS, chapters: MOCK_CHAPTERS, hadiths: MOCK_HADITHS } = state;
  const book = MOCK_BOOKS.find((b) => String(b.id) === bookId);
  if (!book) notFound();
  const col = MOCK_COLLECTIONS.find((c) => c.id === book.collection_id)!;

  // [FIX PERF-01] أحاديث هذا الكتاب فقط — لا 35,798 حديثاً
  useEffect(() => {
    let off = false;
    setLoading(true);
    getRepo().loadHadithsForBook(Number(bookId))
      .then((hs) => { if (!off) dispatch({ type: "MERGE_HADITHS", hadiths: hs }); })
      .catch((e) => { if (!off) dispatch({ type: "TOAST", text: e instanceof Error ? e.message : "تعذّر التحميل", kind: "err" }); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [bookId, dispatch]);
  const chapters = MOCK_CHAPTERS.filter((c) => c.book_id === book.id).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ href: "/", label: "المجموعات" }, { href: `/collections/${col.id}`, label: col.name_ar }, { label: book.name_ar }]} />
      <h1 className="text-xl font-bold text-stone-900">{book.name_ar}</h1>

      {chapters.length === 0 ? (
        <EmptyState icon="📄" title="لا توجد أبواب في هذا الكتاب" />
      ) : (
        chapters.map((ch) => {
          const hadiths = MOCK_HADITHS.filter((h) => h.chapter_id === ch.id).sort((a, b) => a.hadith_number - b.hadith_number);
          return (
            <section key={ch.id} className="space-y-2">
              <h2 className="px-1 text-[15px] font-semibold text-stone-700">{ch.name_ar}</h2>
              {hadiths.length === 0 ? (
                <EmptyState icon="🕊️" title="لا توجد أحاديث في هذا الباب بعد" />
              ) : (
                <ul className="space-y-2">
                  {hadiths.map((h) => {
                    const recs = state.recordings.filter((r) => r.hadith_id === h.id && !r.is_hidden).length;
                    return (
                      <li key={h.id}>
                        <Link href={`/hadiths/${h.id}`}>
                          <Card className="p-4 transition hover:border-primary hover:shadow-md">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="rounded-lg bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                                حديث <span className="nums">{h.hadith_number}</span>
                              </span>
                              <GradeBadge grade={h.grade} />
                              <span className="mr-auto text-[11px] text-stone-500">🎧 <span className="nums">{recs}</span></span>
                            </div>
                            <p className="font-hadith text-[19px] leading-9 text-stone-800 line-clamp-2">{h.matn_ar}</p>
                          </Card>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
