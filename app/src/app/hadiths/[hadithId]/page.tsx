"use client";
import { use, useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { getRepo } from "@/lib/repo";
import { pickDefaultRecording } from "@/lib/algorithms";
import { Card, Button, GradeBadge, Modal, EmptyState } from "@/components/ui";
import Breadcrumb from "@/components/Breadcrumb";
import HadithText from "@/components/HadithText";
import AudioPlayer from "@/components/AudioPlayer";
import RecordingsSheet from "@/components/RecordingsSheet";
import RecorderModal from "@/components/RecorderModal";
import LangSwitcher from "@/components/LangSwitcher";
import { langAttrs, useContentLang } from "@/lib/i18n";
import type { ContentErrorType, RecordingView } from "@/lib/types";

const TABS = [
  { k: "translation", label: "الترجمة" },
  { k: "gharib", label: "غريب الحديث" },
  { k: "takhrij", label: "التخريج" },
  { k: "sharh", label: "الشرح" },
] as const;

const ERROR_TYPES: { v: ContentErrorType; label: string }[] = [
  { v: "tashkeel", label: "خطأ في التشكيل" },
  { v: "translation", label: "خطأ في الترجمة" },
  { v: "isnad", label: "خطأ في الإسناد" },
  { v: "takhrij", label: "خطأ في التخريج" },
  { v: "other", label: "أخرى" },
];

/** PAGE-005 / F002+F003+F004+F006 — صفحة الحديث الشاملة */
export default function HadithPage({ params }: { params: Promise<{ hadithId: string }> }) {
  const { hadithId } = use(params);
  const { state, dispatch, me, viewsFor } = useStore();
  const { lang, name: langName } = useContentLang();
  const { collections: MOCK_COLLECTIONS, books: MOCK_BOOKS, chapters: MOCK_CHAPTERS, hadiths: MOCK_HADITHS, wordDefinitions: MOCK_WORD_DEFINITIONS, takhrij: MOCK_TAKHRIJ } = state;
  const [tab, setTab] = useState<(typeof TABS)[number]["k"]>("translation");
  const [sheet, setSheet] = useState(false);
  const [recorder, setRecorder] = useState(false);
  const [contentReport, setContentReport] = useState(false);
  const [errType, setErrType] = useState<ContentErrorType>("tashkeel");
  const [desc, setDesc] = useState("");
  const [override, setOverride] = useState<string | null>(null);

  // [FIX PERF-01] تفاصيل هذا الحديث فقط عند الطلب — لا 35,798 حديثاً عند الإقلاع
  useEffect(() => {
    let off = false;
    getRepo().loadHadith(hadithId)
      .then((d) => { if (!off) dispatch({ type: "MERGE_HADITH_DETAIL", ...d }); })
      .catch(() => { /* الوضع الوهمي يعمل من الحالة المحلية */ });
    return () => { off = true; };
  }, [hadithId, dispatch]);

  const hadith = MOCK_HADITHS.find((h) => h.id === hadithId);

  const chapter = MOCK_CHAPTERS.find((c) => c.id === hadith?.chapter_id);
  const book = MOCK_BOOKS.find((b) => b.id === chapter?.book_id);
  const col = MOCK_COLLECTIONS.find((c) => c.id === book?.collection_id);
  const words = MOCK_WORD_DEFINITIONS.filter((w) => w.hadith_id === hadithId);
  const takhrij = MOCK_TAKHRIJ.filter((t) => t.hadith_id === hadithId);

  const list = viewsFor(hadithId);
  // ALG-001 — التسجيل الافتراضي، مع إمكانية تجاوزه يدوياً من اللوحة
  const current: RecordingView | null = useMemo(
    () => (override ? list.find((r) => r.id === override) ?? null : pickDefaultRecording(list)),
    [list, override]
  );
  const mine = list.find((r) => r.user_id === me?.id);

  const submitContentReport = () => {
    if (!me || desc.trim().length < 5) return;
    dispatch({
      type: "SUBMIT_CONTENT_REPORT",
      report: { id: `crep-${Date.now()}`, hadith_id: hadithId, reporter_id: me.id, error_type: errType, description: desc.trim(), status: "open", created_at: new Date().toISOString() },
    });
    dispatch({ type: "TOAST", text: "شكراً لك — وصل بلاغ المحتوى إلى المشرف." });
    setContentReport(false); setDesc(""); setErrType("tashkeel");
  };

  if (!hadith || !chapter || !book || !col) {
    return <EmptyState icon="⏳" title="جارٍ تحميل الحديث…" hint="يُجلب من قاعدة البيانات عند الطلب." />;
  }

  return (
    <div className="space-y-4">
      <Breadcrumb items={[
        { href: "/", label: "المجموعات" },
        { href: `/collections/${col.id}`, label: langName(col) },
        { href: `/books/${book.id}`, label: langName(book) },
        { label: `حديث ${hadith.hadith_number}` },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
          {col.name_ar} · حديث <span className="nums">{hadith.hadith_number}</span>
        </span>
        <GradeBadge grade={hadith.grade} />
        <Button size="sm" variant="ghost" className="mr-auto" onClick={() => setContentReport(true)}>🚩 بلاغ عن خطأ</Button>
      </div>

      <HadithText hadith={hadith} words={words} />

      {/* المشغّل الصوتي */}
      <section className="space-y-2" aria-label="المشغل الصوتي">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-stone-700">
            التسجيل {override ? "المختار" : "الافتراضي"}
            {current && !override && <span className="mr-1 text-[11px] font-normal text-stone-400">(وفق ALG-001)</span>}
          </h2>
          {override && <button onClick={() => setOverride(null)} className="text-[12px] text-primary hover:underline">العودة للافتراضي</button>}
        </div>
        <AudioPlayer rec={current} />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setSheet(true)}>
            كل التسجيلات (<span className="nums">{list.length}</span>)
          </Button>
          <Button className="flex-1" onClick={() => setRecorder(true)}>
            {mine ? "استبدال تسجيلي" : "سجّل صوتك"}
          </Button>
        </div>
      </section>

      {/* التبويبات */}
      <Card className="overflow-hidden">
        {/* المبدّل خارج tablist لا داخله: أبناء tablist يجب أن يكونوا tab
            وحدهم، وإلا اضطرب ترتيب قارئ الشاشة وتنقّل الأسهم (REQ-07). */}
        <div className="flex items-center border-b border-stone-200 bg-stone-50">
          <div role="tablist" aria-label="تفاصيل الحديث" className="flex overflow-x-auto">
            {TABS.map((x) => (
              <button key={x.k} role="tab" aria-selected={tab === x.k} onClick={() => setTab(x.k)}
                className={`shrink-0 px-4 py-3 text-sm font-medium transition ${tab === x.k ? "border-b-2 border-primary bg-white text-primary" : "text-stone-500 hover:text-stone-700"}`}>
                {x.label}
              </button>
            ))}
          </div>
          {tab === "translation" && (
            <div className="me-auto shrink-0 px-3"><LangSwitcher compact /></div>
          )}
        </div>
        <div className="p-5 text-[15px] leading-8 text-stone-700" role="tabpanel">
          {/* [F011] طبقة اللغات الثلاث.
              `translation_en` موجود في المخطط منذ v1.2 ولم يكن معروضاً في أي
              صفحة قط — بيانات مدفوعة الثمن ومهملة. صار العرض تابعاً لاختيار
              المستخدم، والترجمة الأخرى تبقى متاحةً بنقرة لا مخفيّةً بالكامل. */}
          {tab === "translation" && <TranslationPanel hadith={hadith} lang={lang} />}

          {tab === "gharib" && (words.length ? (
            <dl className="space-y-3">
              {words.map((w) => (
                <div key={w.id} className="rounded-xl bg-stone-50 p-3">
                  <dt className="font-hadith text-lg text-primary">{w.word}</dt>
                  <dd className="mt-1 text-[14px] text-stone-700">{w.definition_ar}</dd>
                  {/* [F011] تعريف الكلمة يتبع لغة المحتوى — كان الإندونيسي وحده معروضاً */}
                  {(() => {
                    if (lang === "ar") return null;
                    const d = (lang === "id" ? w.definition_id : w.definition_en)?.trim();
                    return d ? <dd className="latin mt-1 text-[13px] text-stone-500" {...langAttrs(lang)}>{d}</dd> : null;
                  })()}
                </div>
              ))}
            </dl>
          ) : <p className="text-stone-400">لا توجد كلمات غريبة مسجّلة لهذا الحديث.</p>)}

          {tab === "takhrij" && (takhrij.length ? (
            <ul className="space-y-2">
              {takhrij.map((t) => (
                <li key={t.id} className="flex gap-2 rounded-xl bg-stone-50 p-3 text-[14px]">
                  <span className="font-semibold text-stone-800">{t.source_book}:</span>
                  <span className="text-stone-600">{t.reference_number}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-stone-400">لا يوجد تخريج مسجّل.</p>)}

          {tab === "sharh" && (hadith.explanation
            ? <p className="leading-loose">{hadith.explanation}</p>
            : <p className="text-stone-400">لا يوجد شرح متاح بعد.</p>)}
        </div>
      </Card>

      <RecordingsSheet open={sheet} onClose={() => setSheet(false)} list={list} onSelect={(r) => setOverride(r.id)} />
      <RecorderModal open={recorder} onClose={() => setRecorder(false)} hadithId={hadith.id} />

      <Modal open={contentReport} onClose={() => setContentReport(false)} title="الإبلاغ عن خطأ في المحتوى">
        <div className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-stone-700">نوع الخطأ</legend>
            {ERROR_TYPES.map((x) => (
              <label key={x.v} className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                <input type="radio" name="etype" checked={errType === x.v} onChange={() => setErrType(x.v)} />
                {x.label}
              </label>
            ))}
          </fieldset>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-stone-700">وصف الخطأ *</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} maxLength={500}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" placeholder="اذكر الموضع والصواب…" />
            <span className="text-xs text-stone-500">
              {desc.trim().length < 5 ? "٥ أحرف على الأقل" : `${desc.length}/500`}
            </span>
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setContentReport(false)} className="flex-1">إلغاء</Button>
            <Button onClick={submitContentReport} disabled={desc.trim().length < 5} className="flex-1">إرسال</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * لوحة الترجمة — F011 / C-047
 *
 * ثلاث حالات لا حالتين:
 *   • الترجمة بلغة المستخدم موجودة ⇒ تُعرض، والأخرى بنقرة.
 *   • غائبة والأخرى موجودة ⇒ **نعرض الأخرى صراحةً مع بيان لغتها** بدل
 *     «لا توجد ترجمة». التغطية الإنجليزية أقلّ من الإندونيسية بفارق كبير،
 *     فإخفاء الموجود لمجرد اختلاف اللغة خسارة بلا مقابل.
 *   • كلتاهما غائبة ⇒ رسالة صريحة تدعو للإبلاغ، لا فراغ صامت.
 *
 * كل نصّ مترجم في حاويته بـ`dir="ltr" lang=…` — أهم نقطة RTL في الصفحة.
 */
function TranslationPanel({
  hadith, lang,
}: {
  hadith: { translation_id: string | null; translation_en: string | null };
  lang: "ar" | "id" | "en";
}) {
  const [showOther, setShowOther] = useState(false);

  const id = hadith.translation_id?.trim() || null;
  const en = hadith.translation_en?.trim() || null;

  if (lang === "ar") {
    return (
      <p className="text-stone-500">
        اخترت «العربية فقط» — المتن أعلاه بلا ترجمة.
        {(id || en) && " بدّل لغة المحتوى من الأزرار أعلاه لعرض الترجمة."}
      </p>
    );
  }

  const wanted = lang === "id" ? id : en;
  const other = lang === "id" ? en : id;
  const otherLang: "id" | "en" = lang === "id" ? "en" : "id";
  const LABEL = { id: "الإندونيسية", en: "الإنجليزية" } as const;

  if (!wanted && !other) {
    return (
      <p className="text-stone-400">
        لا توجد ترجمة معتمدة لهذا الحديث بعد. إن كنت تعرف ترجمةً صحيحة فأبلغ المشرف من زر «بلاغ عن خطأ».
      </p>
    );
  }

  const shown = wanted ?? other!;
  const shownLang: "id" | "en" = wanted ? (lang as "id" | "en") : otherLang;
  const spare = wanted ? other : null;

  return (
    <div className="space-y-3">
      {!wanted && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          لا توجد ترجمة {LABEL[lang as "id" | "en"]} لهذا الحديث — هذه الترجمة {LABEL[otherLang]}.
        </p>
      )}

      <p className="latin leading-relaxed" {...langAttrs(shownLang)}>{shown}</p>

      {spare && (
        <>
          <button
            type="button"
            onClick={() => setShowOther((s) => !s)}
            className="text-[12px] text-primary hover:underline"
          >
            {showOther ? `إخفاء الترجمة ${LABEL[otherLang]}` : `أظهر الترجمة ${LABEL[otherLang]} أيضاً`}
          </button>
          {showOther && (
            <p
              className="latin border-t border-stone-100 pt-3 leading-relaxed text-stone-500"
              {...langAttrs(otherLang)}
            >
              {spare}
            </p>
          )}
        </>
      )}
    </div>
  );
}
