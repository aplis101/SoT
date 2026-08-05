"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { Card, Button, EmptyState, inputCls } from "@/components/ui";
import type { WordDefinition, TakhrijReference } from "@/lib/types";

/**
 * PAGE-007-SUB-04 — لوحة إدخال المحتوى العلمي.
 *
 * المصدر المفتوح يوفّر النص المشكّل والترجمة والدرجة فقط. الغريب والشرح
 * والتخريج يدخلها مشرف المادة هنا للأحاديث المقرَّرة — فتبقى الدقة العلمية
 * بيد أهلها ولا نعتمد على مصدر غير مرخَّص.
 */
export default function AdminContentPage() {
  const { state, dispatch } = useStore();
  const repo = getRepo();

  const [colId, setColId] = useState<number | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);
  const [hadithId, setHadithId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const books = useMemo(
    () => state.books.filter((b) => b.collection_id === colId).sort((a, b) => a.sort_order - b.sort_order),
    [state.books, colId]
  );
  const hadiths = useMemo(() => {
    const chapterIds = state.chapters.filter((c) => c.book_id === bookId).map((c) => c.id);
    return state.hadiths
      .filter((h) => chapterIds.includes(h.chapter_id))
      .sort((a, b) => a.hadith_number - b.hadith_number);
  }, [state.chapters, state.hadiths, bookId]);

  const hadith = state.hadiths.find((h) => h.id === hadithId) ?? null;
  const words = state.wordDefinitions.filter((w) => w.hadith_id === hadithId);
  const refs = state.takhrij.filter((t) => t.hadith_id === hadithId);

  // مسوّدات النماذج
  const [wWord, setWWord] = useState("");
  const [wAr, setWAr] = useState("");
  const [wId, setWId] = useState("");
  const [tSource, setTSource] = useState("");
  const [tRef, setTRef] = useState("");
  const [sharh, setSharh] = useState("");
  const [bookName, setBookName] = useState("");

  useEffect(() => { setSharh(hadith?.explanation ?? ""); }, [hadith?.id, hadith?.explanation]);
  useEffect(() => { setBookName(books.find((b) => b.id === bookId)?.name_ar ?? ""); }, [bookId, books]);

  const guard = async (fn: () => Promise<void>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      dispatch({ type: "TOAST", text: okMsg });
    } catch (e) {
      dispatch({ type: "TOAST", text: e instanceof Error ? e.message : "فشل غير معروف", kind: "err" });
    } finally {
      setBusy(false);
    }
  };

  const addWord = () =>
    guard(async () => {
      if (!hadithId || wWord.trim().length < 2 || wAr.trim().length < 2) throw new Error("أدخل الكلمة ومعناها.");
      if (!hadith?.matn_ar.includes(wWord.trim()))
        throw new Error("الكلمة غير موجودة حرفياً في المتن — انسخها منه ليعمل التمييز داخل النص.");
      const saved = await repo.upsertWordDefinition({
        hadith_id: hadithId, word: wWord.trim(),
        definition_ar: wAr.trim(), definition_id: wId.trim() || null,
      } as Omit<WordDefinition, "id">);
      dispatch({ type: "UPSERT_WORD", word: saved });
      setWWord(""); setWAr(""); setWId("");
    }, "أُضيفت الكلمة الغريبة.");

  const addRef = () =>
    guard(async () => {
      if (!hadithId || tSource.trim().length < 2 || tRef.trim().length < 2) throw new Error("أدخل المصدر والموضع.");
      const saved = await repo.upsertTakhrij({
        hadith_id: hadithId, source_book: tSource.trim(), reference_number: tRef.trim(),
      } as Omit<TakhrijReference, "id">);
      dispatch({ type: "UPSERT_TAKHRIJ", item: saved });
      setTSource(""); setTRef("");
    }, "أُضيف التخريج.");

  const saveSharh = () =>
    guard(async () => {
      if (!hadithId) return;
      const text = sharh.trim() || null;
      await repo.updateHadithExplanation(hadithId, text);
      dispatch({ type: "SET_EXPLANATION", hadithId, text });
    }, "حُفظ الشرح.");

  const saveBookName = () =>
    guard(async () => {
      if (!bookId || bookName.trim().length < 2) throw new Error("اسم الكتاب قصير جداً.");
      await repo.renameBook(bookId, bookName.trim());
      dispatch({ type: "RENAME_BOOK", bookId, nameAr: bookName.trim() });
    }, "عُدّل اسم الكتاب.");

  const stat = (n: number) => (n > 0 ? `${n}` : "—");

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-[13px] text-sky-900">
        المصدر المفتوح يوفّر النص المشكّل والترجمة والدرجة. <b>الغريب والشرح والتخريج</b> تُدخلها هنا
        للأحاديث المقرَّرة فقط — لا داعي لتغطية الـ<span className="nums">14,650</span> حديثاً.
      </p>

      {/* اختيار الحديث */}
      <Card className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">المجموعة</span>
            <select className={inputCls} value={colId ?? ""}
              onChange={(e) => { setColId(Number(e.target.value) || null); setBookId(null); setHadithId(null); }}>
              <option value="">— اختر —</option>
              {state.collections.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">الكتاب</span>
            <select className={inputCls} value={bookId ?? ""} disabled={!colId}
              onChange={(e) => { setBookId(Number(e.target.value) || null); setHadithId(null); }}>
              <option value="">— اختر —</option>
              {books.map((b) => <option key={b.id} value={b.id}>{b.name_ar}</option>)}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">الحديث (<span className="nums">{hadiths.length}</span>)</span>
            <select className={inputCls} value={hadithId ?? ""} disabled={!bookId}
              onChange={(e) => setHadithId(e.target.value || null)}>
              <option value="">— اختر —</option>
              {hadiths.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.hadith_number} · {h.matn_ar.slice(0, 40)}…
                </option>
              ))}
            </select>
          </label>
        </div>

        {bookId && (
          <div className="flex flex-wrap items-end gap-2 border-t border-stone-200 pt-3">
            <label className="min-w-[220px] flex-1 space-y-1.5">
              <span className="text-xs font-medium text-stone-600">اسم الكتاب بالعربية (قابل للتعديل)</span>
              <input className={inputCls} value={bookName} onChange={(e) => setBookName(e.target.value)} />
            </label>
            <Button size="sm" variant="outline" onClick={saveBookName} disabled={busy}>حفظ الاسم</Button>
          </div>
        )}
      </Card>

      {!hadith ? (
        <EmptyState icon="📖" title="اختر حديثاً لتحرير محتواه" hint="المجموعة ← الكتاب ← الحديث." />
      ) : (
        <>
          {/* المتن للمرجع */}
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px]">
              <span className="rounded bg-stone-100 px-2 py-0.5 font-semibold text-stone-600">
                حديث <span className="nums">{hadith.hadith_number}</span>
              </span>
              <span className="text-stone-500">
                غريب: {stat(words.length)} · تخريج: {stat(refs.length)} · شرح: {hadith.explanation ? "✓" : "—"}
              </span>
              <Link href={`/hadiths/${hadith.id}`} className="mr-auto text-primary hover:underline">معاينة ›</Link>
            </div>
            <p className="font-hadith text-[19px] leading-9 text-stone-900">{hadith.matn_ar}</p>
            <p className="mt-2 text-[11px] text-stone-400">انسخ الكلمة من هذا المتن حرفياً لتُميَّز داخل النص.</p>
          </Card>

          {/* غريب الحديث */}
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold text-stone-800">غريب الحديث</h2>
            {words.length > 0 && (
              <ul className="space-y-2">
                {words.map((w) => (
                  <li key={w.id} className="flex items-start gap-2 rounded-xl bg-stone-50 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-hadith text-lg text-primary">{w.word}</p>
                      <p className="text-[13px] text-stone-700">{w.definition_ar}</p>
                      {w.definition_id && <p className="latin text-[12px] text-stone-500">{w.definition_id}</p>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-600" disabled={busy}
                      onClick={() => guard(async () => {
                        await repo.deleteWordDefinition(w.id);
                        dispatch({ type: "DELETE_WORD", id: w.id });
                      }, "حُذفت الكلمة.")}>حذف</Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              <input className={inputCls} placeholder="الكلمة (كما في المتن)" value={wWord} onChange={(e) => setWWord(e.target.value)} />
              <input className={inputCls} placeholder="المعنى بالعربية" value={wAr} onChange={(e) => setWAr(e.target.value)} />
              <input className={`${inputCls} latin`} placeholder="Arti (Indonesia) — اختياري" value={wId} onChange={(e) => setWId(e.target.value)} />
            </div>
            <Button size="sm" onClick={addWord} disabled={busy}>إضافة كلمة</Button>
          </Card>

          {/* التخريج */}
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold text-stone-800">التخريج</h2>
            {refs.length > 0 && (
              <ul className="space-y-2">
                {refs.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-[13px]">
                    <span className="font-semibold text-stone-800">{t.source_book}:</span>
                    <span className="text-stone-600">{t.reference_number}</span>
                    <Button size="sm" variant="ghost" className="mr-auto text-red-600" disabled={busy}
                      onClick={() => guard(async () => {
                        await repo.deleteTakhrij(t.id);
                        dispatch({ type: "DELETE_TAKHRIJ", id: t.id });
                      }, "حُذف التخريج.")}>حذف</Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <input className={inputCls} placeholder="المصدر (مثال: صحيح مسلم)" value={tSource} onChange={(e) => setTSource(e.target.value)} />
              <input className={inputCls} placeholder="الموضع (مثال: كتاب الإيمان، رقم 35)" value={tRef} onChange={(e) => setTRef(e.target.value)} />
            </div>
            <Button size="sm" onClick={addRef} disabled={busy}>إضافة تخريج</Button>
          </Card>

          {/* الشرح */}
          <Card className="space-y-3 p-4">
            <h2 className="font-semibold text-stone-800">الشرح الميسّر</h2>
            <textarea rows={6} className={inputCls} value={sharh} onChange={(e) => setSharh(e.target.value)}
              placeholder="اشرح الحديث بلغة ميسّرة للطلاب…" />
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={saveSharh} disabled={busy}>حفظ الشرح</Button>
              <span className="nums text-[11px] text-stone-400">{sharh.length} حرفاً</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
