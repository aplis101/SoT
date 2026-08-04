"use client";
import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MOCK_COLLECTIONS, MOCK_BOOKS, MOCK_CHAPTERS, MOCK_HADITHS } from "@/lib/mock-data";
import { Card, EmptyState } from "@/components/ui";
import Breadcrumb from "@/components/Breadcrumb";

/** PAGE-003 / F001 — كتب المجموعة */
export default function CollectionPage({ params }: { params: Promise<{ collectionId: string }> }) {
  const { collectionId } = use(params);
  const col = MOCK_COLLECTIONS.find((c) => String(c.id) === collectionId);
  if (!col) notFound();
  const books = MOCK_BOOKS.filter((b) => b.collection_id === col.id).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ href: "/", label: "المجموعات" }, { label: col.name_ar }]} />
      <h1 className="text-xl font-bold text-stone-900">{col.name_ar}</h1>

      {books.length === 0 ? (
        <EmptyState icon="📕" title="لا توجد كتب في هذه المجموعة" hint="سيضيف المشرف الكتب قريباً." />
      ) : (
        <ul className="space-y-3">
          {books.map((b) => {
            const chapters = MOCK_CHAPTERS.filter((c) => c.book_id === b.id);
            const n = MOCK_HADITHS.filter((h) => chapters.some((c) => c.id === h.chapter_id)).length;
            return (
              <li key={b.id}>
                <Link href={`/books/${b.id}`}>
                  <Card className="flex items-center gap-3 p-4 transition hover:border-primary hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100" aria-hidden>📗</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-stone-900">{b.name_ar}</p>
                      {b.name_id && <p className="latin text-[13px] text-stone-500">{b.name_id}</p>}
                    </div>
                    <span className="text-xs text-stone-500"><span className="nums">{n}</span> حديث</span>
                    <span aria-hidden className="text-stone-300">‹</span>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
