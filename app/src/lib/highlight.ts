/**
 * تظليل مواضع البحث — بلا فقدان التشكيل، وبكل اللغات.
 *
 * ------------------------------------------------------------------------
 * لماذا انتقل التظليل من قاعدة البيانات إلى المتصفح؟
 * ------------------------------------------------------------------------
 * كان `ts_headline` في `09-search.sql` يبني المقتطف من النصّ **المطبَّع**،
 * لأن المطابقة نفسها تجري على المطبَّع. فكانت النتيجة أن الطالب يرى:
 *
 *      «انما الاعمال بالنيات»      بدل      «إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ»
 *
 * وهذا لا يليق بنصّ حديث شريف: التشكيل هو نصف المقصود من المنصة أصلاً
 * (المنصة كلها لضبط النطق). وكان `ts_headline` يُطبَّق على `matn_ar` وحده،
 * فبقيت الترجمة الإندونيسية والإنجليزية بلا أي تظليل رغم أن البحث يجدها.
 *
 * الحلّ هنا: نُرجع من القاعدة **النصّ الأصلي كما هو** (وهي تُرجعه أصلاً:
 * `matn_ar` و`translation_id` و`translation_en`)، ثم نطابق في المتصفح على
 * نسخة مطبَّعة نحتفظ لكل حرف فيها بموضعه في النصّ الأصلي. فنظلّل على الأصل
 * المشكَّل حرفياً. لا تغيير في المخطط، ولا رحلة إضافية إلى الشبكة.
 *
 * ------------------------------------------------------------------------
 * التطبيع هنا يجب أن يبقى مطابقاً لـ`ar_normalize` في 09-search.sql
 * ------------------------------------------------------------------------
 * إن اختلفا، ظلّلنا ما لم تجده القاعدة أو تركنا ما وجدته. أي تعديل في أحدهما
 * يُعدَّل في الآخر — وهذا موثَّق في 09-business-logic-rules.md.
 */

/** الحركات والتطويل وعلامات الضبط القرآنية — تُحذف قبل المطابقة */
const AR_DIACRITIC = /[ً-ْـٰۖ-ۭ]/;

/** توحيد الحروف — مطابق لـ translate('أإآٱىةؤئ','اااايهوي') في SQL */
const AR_FOLD: Record<string, string> = {
  "أ": "ا", // أ → ا
  "إ": "ا", // إ → ا
  "آ": "ا", // آ → ا
  "ٱ": "ا", // ٱ → ا
  "ى": "ي", // ى → ي
  "ة": "ه", // ة → ه
  "ؤ": "و", // ؤ → و
  "ئ": "ي", // ئ → ي
};

/** حرف يُعدّ جزءاً من كلمة (عربي أو لاتيني أو رقم) */
const WORD_CHAR = /[\p{L}\p{N}]/u;

export interface Folded {
  /** النصّ بعد التطبيع — عليه تجري المطابقة */
  norm: string;
  /** map[i] = موضع الحرف i من `norm` في النصّ الأصلي */
  map: number[];
}

/**
 * يطبّع النصّ ويحتفظ بخريطة العودة إلى الأصل.
 *
 * يعالج اللغات الثلاث بقاعدة واحدة:
 *   • العربية  — حذف التشكيل وتوحيد الألف والياء والتاء المربوطة
 *   • اللاتينية — تصغير الأحرف وحذف العلامات المركَّبة (é → e)، فمن يكتب
 *     «puasa» يجد «Puasa»، ومن يكتب «Ramadan» يجد «Ramadán».
 */
export function fold(text: string): Folded {
  const norm: string[] = [];
  const map: number[] = [];
  const src = text ?? "";
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (AR_DIACRITIC.test(ch)) continue;              // حرف يختفي — لا يدخل الخريطة
    const folded = (AR_FOLD[ch] ?? ch)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
    for (const c of folded) { norm.push(c); map.push(i); }
  }
  return { norm: norm.join(""), map };
}

/**
 * يستخرج كلمات البحث من استعلام المستخدم.
 *
 * يحاكي ما يفهمه `websearch_to_tsquery` حتى لا نظلّل ما لم تطابقه القاعدة:
 *   • "عبارة بين علامتَي اقتباس" تبقى وحدةً واحدة
 *   • ‎-كلمة‎ للاستبعاد ⇒ لا تُظلَّل
 *   • or / and كلمات ربط لا كلمات بحث
 */
export function queryTerms(query: string): string[] {
  const src = (query ?? "").trim();
  if (!src) return [];

  const phrases: string[] = [];
  const rest = src.replace(/"([^"]*)"/g, (_m, p: string) => { phrases.push(p); return " "; });

  const out: string[] = [];
  for (const raw of [...phrases, ...rest.split(/\s+/)]) {
    const tok = raw.trim();
    if (!tok || tok.startsWith("-")) continue;                  // استبعاد
    if (/^(or|and|أو|و)$/i.test(tok)) continue;                 // روابط
    // نزع الترقيم من الطرفين فقط — لئلا نكسر كلمة فيها شرطة داخلية
    const trimmed = tok.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    const n = fold(trimmed).norm.trim();
    if (n.length >= 2) out.push(n);
  }
  return [...new Set(out)];
}

/** مدى تطابق في النصّ الأصلي */
export interface Range { start: number; end: number }

/**
 * يحدّد مواضع التطابق في النصّ الأصلي.
 *
 * قاعدة المطابقة تحاكي Postgres لا تُخالفه:
 *   • المطابقة على مستوى **الكلمة** لا أي جزء من الحرف، فلا نظلّل «علم» داخل
 *     «معلّم» بينما القاعدة لم تعدّها مطابقة أصلاً.
 *   • نقبل تطابق البادئة في الاتجاهين لأن قاموس `english` يجذّر الكلمات
 *     (running ⇄ run)، فلو طابقنا حرفياً لظلّلنا أقلّ ممّا وجدته القاعدة.
 *   • العبارة المقتبسة (فيها فراغ) تُطابَق كنصّ متّصل.
 */
export function matchRanges(text: string, terms: string[]): Range[] {
  if (!text || terms.length === 0) return [];
  const { norm, map } = fold(text);
  if (!norm) return [];

  const hits: Range[] = [];
  const single = terms.filter((t) => !t.includes(" "));
  const phrases = terms.filter((t) => t.includes(" "));

  // ---- الكلمات المفردة: نمرّ على كلمات النصّ لا على مواضع الحروف
  if (single.length) {
    const re = /[\p{L}\p{N}]+/gu;
    for (let m = re.exec(norm); m; m = re.exec(norm)) {
      const w = m[0];
      const hit = single.some(
        (t) =>
          w === t ||
          w.startsWith(t) ||                                  // «صلا» تطابق «صلاة»
          (t.length >= 3 && w.length >= 3 && t.startsWith(w)) // جذر إنجليزي أقصر
      );
      if (hit) hits.push({ start: m.index, end: m.index + w.length });
    }
  }

  // ---- العبارات المقتبسة: بحث نصّي متّصل
  for (const p of phrases) {
    for (let i = norm.indexOf(p); i !== -1; i = norm.indexOf(p, i + 1)) {
      hits.push({ start: i, end: i + p.length });
    }
  }

  if (hits.length === 0) return [];

  // ---- ترجمة المواضع إلى النصّ الأصلي + ضمّ المتداخل
  hits.sort((a, b) => a.start - b.start || a.end - b.end);
  const out: Range[] = [];
  for (const h of hits) {
    const start = map[h.start];
    let end = map[h.end - 1] + 1;
    // ألحق التشكيل الملاصق آخر الكلمة بالتظليل، وإلا بدت الحركة خارجه
    while (end < text.length && AR_DIACRITIC.test(text[end])) end++;
    const last = out[out.length - 1];
    if (last && start <= last.end) { last.end = Math.max(last.end, end); continue; }
    out.push({ start, end });
  }
  return out;
}

export interface Segment { text: string; hit: boolean }

/** يقطّع النصّ إلى مقاطع مظلَّلة وغير مظلَّلة — جاهزة للعرض بلا HTML خام */
export function segments(text: string, ranges: Range[]): Segment[] {
  if (!text) return [];
  if (ranges.length === 0) return [{ text, hit: false }];
  const out: Segment[] = [];
  let at = 0;
  for (const r of ranges) {
    if (r.start > at) out.push({ text: text.slice(at, r.start), hit: false });
    out.push({ text: text.slice(r.start, r.end), hit: true });
    at = r.end;
  }
  if (at < text.length) out.push({ text: text.slice(at), hit: false });
  return out;
}

/**
 * ينتقي نافذةً من النصّ حول أول تطابق.
 *
 * متون الأحاديث الطويلة تتجاوز ألف حرف؛ عرضها كاملةً في قائمة النتائج يدفن
 * موضع التطابق ويُثقل الصفحة. نقصّ على حدود الكلمات لا وسطها.
 */
// الاسم `clip` لا `window`: هذا ملف يعمل في المتصفح، وتسمية دالة باسم كائن
// عام يجعل كل قارئ لاحق يتوقّف ليسأل أيّهما المقصود.
export function clip(
  text: string,
  ranges: Range[],
  maxChars = 260
): { text: string; ranges: Range[]; head: boolean; tail: boolean } {
  const src = text ?? "";
  if (src.length <= maxChars) return { text: src, ranges, head: false, tail: false };

  const focus = ranges[0]?.start ?? 0;
  let start = Math.max(0, focus - Math.floor(maxChars / 3));
  let end = Math.min(src.length, start + maxChars);
  start = Math.max(0, end - maxChars);

  // اضبط على حدود الكلمات
  while (start > 0 && WORD_CHAR.test(src[start - 1]) && WORD_CHAR.test(src[start])) start--;
  while (end < src.length && WORD_CHAR.test(src[end - 1]) && WORD_CHAR.test(src[end])) end++;

  const clipped = ranges
    .filter((r) => r.end > start && r.start < end)
    .map((r) => ({ start: Math.max(r.start, start) - start, end: Math.min(r.end, end) - start }));

  return {
    text: src.slice(start, end),
    ranges: clipped,
    head: start > 0,
    tail: end < src.length,
  };
}

/** الطريق المختصر: نصّ + استعلام ⇒ مقاطع جاهزة للعرض */
export function highlight(
  text: string | null | undefined,
  terms: string[],
  maxChars?: number
): { segments: Segment[]; head: boolean; tail: boolean; hits: number } {
  const src = text ?? "";
  const all = matchRanges(src, terms);
  const w = maxChars ? clip(src, all, maxChars) : { text: src, ranges: all, head: false, tail: false };
  return {
    segments: segments(w.text, w.ranges),
    head: w.head,
    tail: w.tail,
    hits: all.length,
  };
}
