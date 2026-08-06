"use client";

/**
 * طبقة اللغات الثلاث — العربية · الإندونيسية · الإنجليزية
 *
 * ------------------------------------------------------------------------
 * ما الذي تفعله هذه الطبقة، وما الذي لا تفعله عمداً
 * ------------------------------------------------------------------------
 * **الواجهة تبقى عربية RTL دائماً.** هذا قرار مثبَّت (12-design-system.md §4:
 * `<html dir="rtl" lang="ar">` دائماً) وليس نقصاً في الترجمة: المقرَّر عربي،
 * والمصطلحات الشرعية عربية، وخلط اتجاهين في واجهة واحدة يُنتج شاشةً مرتبكة
 * على الهاتف. فلا نترجم أزرار الواجهة.
 *
 * الذي تفعله الطبقة هو اختيار **لغة المحتوى**: أي ترجمة تُعرض تحت المتن، وبأي
 * لغة تُكتب أسماء المجموعات والكتب والأبواب. وهذا هو المكان الذي تختلف فيه
 * حاجات المستخدمين فعلاً:
 *
 *   • طالب إندونيسي يقرأ المتن العربي ويحتاج الترجمة الإندونيسية بجانبه.
 *   • دارس عربي لا يحتاج ترجمةً أصلاً، والترجمة عنده ضجيج يطيل الصفحة.
 *   • قارئ من خارج البلدين يجد الإنجليزية أقرب — والبيانات عندنا فيها
 *     `translation_en` منذ v1.2 لكن لم تكن معروضة في أي صفحة قط.
 *
 * ------------------------------------------------------------------------
 * لماذا التخزين محلي لا في قاعدة البيانات
 * ------------------------------------------------------------------------
 * تفضيل عرض لا بيانات مستخدم. حفظه في `profiles` يعني رحلة كتابة عند كل
 * تبديل، وصفاً جديداً في المخطط، وسياسة RLS تحرسه — كلّه لتفضيل يجب أن يعمل
 * قبل تسجيل الدخول أصلاً (صفحة الدخول نفسها تعرض نصّاً). فـ`localStorage`
 * هو الموضع الصحيح، ويعمل للزائر كما يعمل للمسجَّل.
 *
 * الاستماع لـ`storage` يبقي التبويبات متّسقة: من بدّل اللغة في تبويب رأى
 * التبديل في الآخر.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";

/** لغة عرض المحتوى — «ar» تعني: المتن وحده بلا ترجمة */
export type ContentLang = "ar" | "id" | "en";

export const CONTENT_LANGS: { v: ContentLang; label: string; short: string; hint: string }[] = [
  { v: "id", label: "الإندونيسية", short: "ID", hint: "Bahasa Indonesia" },
  { v: "en", label: "الإنجليزية",  short: "EN", hint: "English" },
  { v: "ar", label: "العربية فقط", short: "ع",  hint: "المتن بلا ترجمة" },
];

const KEY = "hadith.contentLang";

/**
 * الافتراضي إندونيسي: المنصة مقرَّر في جامعة أحمد دهلان، والبيانات مترجمة
 * إندونيسياً بنسبة 99.7% مقابل تغطية أقل للإنجليزية. الافتراض يخدم الأغلب.
 */
const DEFAULT_LANG: ContentLang = "id";

function isLang(v: unknown): v is ContentLang {
  return v === "ar" || v === "id" || v === "en";
}

interface Ctx {
  lang: ContentLang;
  setLang: (l: ContentLang) => void;
  /** الاسم بلغة المحتوى المختارة مع الرجوع إلى العربي عند غيابه */
  name: (e: Named | null | undefined) => string;
  /** الاسم الثانوي اللاتيني — أو null إن كانت اللغة المختارة عربية */
  latinName: (e: Named | null | undefined) => string | null;
  /** الترجمة المناسبة، أو null إن اختار «العربية فقط» أو لم توجد ترجمة */
  translation: (h: Translated | null | undefined) => string | null;
}

export interface Named { name_ar: string; name_id?: string | null; name_en?: string | null }
export interface Translated { translation_id?: string | null; translation_en?: string | null }

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  // نبدأ بالافتراضي دائماً ثم نقرأ المحفوظ بعد التركيب — لئلا يختلف ما
  // يرسمه الخادم عمّا يرسمه المتصفح (hydration mismatch).
  const [lang, setLangState] = useState<ContentLang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (isLang(saved)) setLangState(saved);
    } catch { /* وضع التصفح الخاص قد يمنع القراءة — الافتراضي يكفي */ }

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && isLang(e.newValue)) setLangState(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = useCallback((l: ContentLang) => {
    setLangState(l);
    try { window.localStorage.setItem(KEY, l); } catch { /* لا يضرّ */ }
  }, []);

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang,
    name: (e) => {
      if (!e) return "";
      if (lang === "id") return e.name_id?.trim() || e.name_ar;
      if (lang === "en") return e.name_en?.trim() || e.name_ar;
      return e.name_ar;
    },
    latinName: (e) => {
      if (!e || lang === "ar") return null;
      const v = lang === "id" ? e.name_id : e.name_en;
      const t = v?.trim();
      return t && t !== e.name_ar ? t : null;
    },
    translation: (h) => {
      if (!h || lang === "ar") return null;
      const primary = lang === "id" ? h.translation_id : h.translation_en;
      return primary?.trim() || null;
    },
  }), [lang, setLang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useContentLang(): Ctx {
  const c = useContext(LangCtx);
  if (!c) throw new Error("useContentLang خارج LangProvider");
  return c;
}

/** سمات الاتجاه الصحيحة لنصّ بلغة المحتوى — أهمّ نقطة RTL في الصفحة (C-047) */
export function langAttrs(lang: ContentLang): { lang: string; dir: "rtl" | "ltr" } {
  return lang === "ar" ? { lang: "ar", dir: "rtl" } : { lang, dir: "ltr" };
}
