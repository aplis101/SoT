/**
 * اختبار طبقة التظليل — `src/lib/highlight.ts`
 *
 *   node scripts/test-highlight.mjs        (أو: npm run test:highlight)
 *
 * لماذا اختبار آليّ هنا بالذات، والمشروع كلّه بلا اختبارات؟
 * -----------------------------------------------------------------------------
 * لأن هذه الطبقة **تكرّر منطقاً موجوداً في مكان آخر**: `ar_normalize` في
 * 09-search.sql. أي تكرار يتباعد مع الوقت ما لم يحرسه شيء. وإن تباعدا ظهر
 * الخلل بأخبث صورة: بحثٌ يجد النتيجة ثم لا يظلّل فيها شيئاً (أو يظلّل ما لم
 * تجده القاعدة) — لا انهيار، ولا خطأ في الطرفية، ولا شيء يلفت النظر.
 *
 * ولأن الخطأ هنا يمسّ نصّ حديث شريف: تظليل يزيح موضعه حرفاً واحداً يبتر
 * حركةً من كلمة. النصّ الذي بُنيت المنصة كلها لضبطه.
 *
 * الاختبار يترجم TypeScript إلى مجلد مؤقت ثم يشغّله — لا حاجة لأي حزمة اختبار
 * جديدة، وفي ذلك وفاء لقاعدة المشروع: صفر تكلفة وأقلّ تبعيات ممكنة.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = mkdtempSync(join(tmpdir(), "hl-"));

const tsc = join(appDir, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");

try {
  execFileSync(tsc, [
    join("src", "lib", "highlight.ts"),
    "--outDir", out,
    "--module", "es2022",
    "--target", "es2022",
    "--lib", "es2022",
    "--moduleResolution", "bundler",
    "--skipLibCheck",
  ], { cwd: appDir, stdio: "inherit" });
} catch {
  console.error("تعذّرت ترجمة highlight.ts — شغّل npm install أولاً.");
  process.exit(1);
}

const H = await import(pathToFileURL(join(out, "highlight.js")).href);

let pass = 0;
const failures = [];

/** يعرض النتيجة نصّاً واحداً: المظلَّل بين قوسين معقوفين */
const show = (text, terms, maxChars) => {
  const r = H.highlight(text, terms, maxChars);
  return (r.head ? "…" : "")
    + r.segments.map((s) => (s.hit ? `[${s.text}]` : s.text)).join("")
    + (r.tail ? "…" : "");
};

function eq(name, got, want) {
  if (got === want) { pass++; console.log(`  ✓ ${name}`); return; }
  failures.push({ name, got, want });
  console.log(`  ✗ ${name}`);
}

const MATN = "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى";
const TRANS_ID = "Sesungguhnya amal perbuatan itu tergantung niatnya";
const TRANS_EN = "Actions are but by intention and every man shall have but that which he intended";

console.log("\nالعربية — التشكيل يبقى، والتظليل في موضعه [FIX SRCH-01]");
{
  const q = H.queryTerms("انما الاعمال بالنيات");
  eq("استخراج الكلمات بلا تشكيل", JSON.stringify(q), JSON.stringify(["انما", "الاعمال", "بالنيات"]));
  eq("التشكيل محفوظ داخل التظليل", show(MATN, q),
     "[إِنَّمَا] [الأَعْمَالُ] [بِالنِّيَّاتِ] وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى");
}
eq("التاء المربوطة: الصلاه ⇒ الصَّلَاةُ", show("الصَّلَاةُ نُورٌ", H.queryTerms("الصلاه")), "[الصَّلَاةُ] نُورٌ");
eq("الألف المقصورة: علي ⇒ عَلَى", show("عَلَى مُوسَى", H.queryTerms("علي")), "[عَلَى] مُوسَى");
eq("الهمزة: الاعمال ⇒ الأَعْمَالُ", show("الأَعْمَالُ", H.queryTerms("الاعمال")), "[الأَعْمَالُ]");
eq("لا تطابق داخل الكلمة (كسلوك tsquery)", show("مُعَلِّمٌ", H.queryTerms("علم")), "مُعَلِّمٌ");
eq("العبارة المقتبسة وحدة واحدة", show(MATN, H.queryTerms('"انما الاعمال"')),
   "[إِنَّمَا الأَعْمَالُ] بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى");
eq("الكلمة المستبعدة لا تُظلَّل", JSON.stringify(H.queryTerms("نية -صلاة")), JSON.stringify(["نيه"]));

console.log("\nالإندونيسية والإنجليزية [FIX SRCH-02]");
eq("تظليل إندونيسي", show(TRANS_ID, H.queryTerms("niat")),
   "Sesungguhnya amal perbuatan itu tergantung [niatnya]");
eq("لا حساسية لحالة الأحرف", show(TRANS_ID, H.queryTerms("SESUNGGUHNYA")),
   "[Sesungguhnya] amal perbuatan itu tergantung niatnya");
eq("تظليل إنجليزي", show(TRANS_EN, H.queryTerms("intention")),
   "Actions are but by [intention] and every man shall have but that which he intended");
eq("البادئة تمسك المشتقّ", show(TRANS_EN, H.queryTerms("action")),
   "[Actions] are but by intention and every man shall have but that which he intended");
eq("العلامات اللاتينية: ramadan ⇒ Ramadán",
   show("Ramadán bulan puasa", H.queryTerms("ramadan")), "[Ramadán] bulan puasa");

console.log("\nالنافذة والحالات الحدّية");
{
  const long = "حَشْوٌ ".repeat(60) + "الزَّكَاةُ " + "ذَيْلٌ ".repeat(60);
  const w = H.highlight(long, H.queryTerms("الزكاه"), 120);
  eq("تُقتصّ من الطرفين", String(w.head && w.tail), "true");
  eq("التطابق يبقى داخلها", String(w.segments.some((s) => s.hit && s.text.includes("الزَّكَاة"))), "true");
  eq("لا تتجاوز الحدّ كثيراً",
     String(w.segments.reduce((n, s) => n + s.text.length, 0) <= 140), "true");
}
eq("بلا كلمات بحث: النصّ كما هو", show(MATN, []), MATN);
eq("نصّ فارغ لا ينهار", show("", H.queryTerms("شيء")), "");
{
  // الأمان: الطبقة تُرجع نصّاً لا HTML — لا مجال لحقن وسم من متن أو ترجمة
  const evil = "قال <script>alert(1)</script> النية";
  const segs = H.highlight(evil, H.queryTerms("النيه")).segments;
  eq("النصّ يبقى نصّاً", segs.map((s) => s.text).join(""), evil);
}

rmSync(out, { recursive: true, force: true });

console.log(`\n${pass} ناجح · ${failures.length} فاشل`);
for (const f of failures) {
  console.error(`\n✗ ${f.name}\n   النتيجة : ${f.got}\n   المتوقَّع: ${f.want}`);
}
process.exit(failures.length ? 1 : 0);
