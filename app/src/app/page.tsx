"use client";
import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useContentLang } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

/** PAGE-002 / F001 / UC-002 — المجموعات (الرئيسية) */
export default function HomePage() {
  const { me, state } = useStore();
  const { collections: MOCK_COLLECTIONS, books: MOCK_BOOKS, chapters: MOCK_CHAPTERS, hadiths: MOCK_HADITHS } = state;
  // الاسم العربي يبقى العنوان دائماً (الواجهة عربية RTL)؛ لغة المحتوى تحكم
  // السطر اللاتيني الثانوي وحده — 12-design-system.md §4.
  const { latinName } = useContentLang();
  if (!me) return null;

  /**
   * [FIX UI-07] العدد من القاعدة أولاً، والعدّ المحلي احتياطاً.
   *
   * كانت الصفحة تعرض «٠ حديث» للجميع: بعد [FIX PERF-01] صارت `state.hadiths`
   * فارغةً بالتصميم (الأحاديث تُجلب عند فتح الكتاب لا عند الإقلاع)، والعدّاد
   * ظلّ يحسب طولها. لا البناء ولا فحص الأنواع يستطيع رؤية هذا — الصفر عددٌ
   * صحيح نحوياً. ظهر بفتح الموقع فقط.
   *
   * الترتيب هنا مقصود: `hadith_count` (20-counts.sql) هو المصدر الصحيح، ثم
   * العدّ المحلي للوضع الوهمي أو لقاعدة لم تُهاجَر بعد. و`null` تعني «لا نعلم»
   * فنكتم السطر بدل الكذب بصفر — عرض رقم خاطئ أسوأ من عدم عرضه.
   */
  const hadithCount = (c: Collection): number | null => {
    if (typeof c.hadith_count === "number") return c.hadith_count;
    if (MOCK_HADITHS.length === 0) return null;
    const books = MOCK_BOOKS.filter((b) => b.collection_id === c.id).map((b) => b.id);
    const chapters = MOCK_CHAPTERS.filter((x) => books.includes(x.book_id)).map((x) => x.id);
    return MOCK_HADITHS.filter((h) => chapters.includes(h.chapter_id)).length;
  };

  const bookCount = (c: Collection): number =>
    c.book_count ?? MOCK_BOOKS.filter((b) => b.collection_id === c.id).length;

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
          {MOCK_COLLECTIONS.map((c) => {
            const n = hadithCount(c);
            const latin = latinName(c);
            return (
              <li key={c.id}>
                <Link href={`/collections/${c.id}`} className="block">
                  <Card className="p-4 transition hover:border-primary hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-xl" aria-hidden>📖</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900">{c.name_ar}</p>
                        {latin && <p className="latin text-[13px] text-stone-500">{latin}</p>}
                      </div>
                      <div className="text-left text-xs text-stone-500">
                        <p><span className="nums">{bookCount(c)}</span> كتاب</p>
                        {/* الأرقام غربية (0-9) بفاصل آلاف — قرار موثّق في review/ */}
                        {n !== null && <p><span className="nums">{n.toLocaleString("en-US")}</span> حديث</p>}
                      </div>
                      <span aria-hidden className="text-stone-300">‹</span>
                    </div>
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
