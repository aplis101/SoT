"use client";
import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";

/** PAGE-002 / F001 / UC-002 — المجموعات (الرئيسية) */
export default function HomePage() {
  const { me, state } = useStore();
  const { collections: MOCK_COLLECTIONS, books: MOCK_BOOKS, chapters: MOCK_CHAPTERS, hadiths: MOCK_HADITHS } = state;
  if (!me) return null;

  const countHadiths = (cid: number) => {
    const books = MOCK_BOOKS.filter((b) => b.collection_id === cid).map((b) => b.id);
    const chapters = MOCK_CHAPTERS.filter((c) => books.includes(c.book_id)).map((c) => c.id);
    return MOCK_HADITHS.filter((h) => chapters.includes(h.chapter_id)).length;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-stone-900">المجموعات الحديثية</h1>
        <p className="mt-1 text-sm text-stone-500">اختر مجموعة لتصفّح كتبها وأبوابها وأحاديثها.</p>
      </div>

      {MOCK_COLLECTIONS.length === 0 ? (
        <EmptyState icon="📚" title="لا توجد مجموعات بعد" hint="سيضيف المشرف المجموعات قريباً." />
      ) : (
        <ul className="space-y-3">
          {MOCK_COLLECTIONS.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${c.id}`} className="block">
                <Card className="p-4 transition hover:border-primary hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-xl" aria-hidden>📖</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">{c.name_ar}</p>
                      {c.name_id && <p className="latin text-[13px] text-stone-500">{c.name_id}</p>}
                    </div>
                    <div className="text-left text-xs text-stone-500">
                      <p><span className="nums">{MOCK_BOOKS.filter((b) => b.collection_id === c.id).length}</span> كتاب</p>
                      <p><span className="nums">{countHadiths(c.id)}</span> حديث</p>
                    </div>
                    <span aria-hidden className="text-stone-300">‹</span>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
