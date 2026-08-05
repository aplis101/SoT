#!/usr/bin/env node
/**
 * استيراد بيانات الحديث الحقيقية → ملفات SQL جاهزة للتنفيذ على Supabase.
 *
 * المصدر: fawazahmed0/hadith-api  —  رخصة Unlicense (ملكية عامة، بلا مفتاح، بلا حدود).
 * https://github.com/fawazahmed0/hadith-api
 *
 * التشغيل:
 *   node scripts/import-hadith.mjs                    # الافتراضي: النووية + مختارات
 *   node scripts/import-hadith.mjs --all              # كل المجموعات المتاحة
 *   node scripts/import-hadith.mjs --books=nawawi,bukhari
 *   node scripts/import-hadith.mjs --limit=200        # حد أقصى للأحاديث لكل مجموعة
 *
 * المخرجات: supabase/seed/0*.sql
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "supabase", "seed");
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

// المجموعات التي لها نص عربي مشكّل + ترجمة إندونيسية
const AVAILABLE = {
  nawawi:   { ar: "ara-nawawi",   id: null,           name_ar: "الأربعون النووية", name_id: "Arbain Nawawi" },
  bukhari:  { ar: "ara-bukhari",  id: "ind-bukhari",  name_ar: "صحيح البخاري",     name_id: "Shahih Bukhari" },
  muslim:   { ar: "ara-muslim",   id: "ind-muslim",   name_ar: "صحيح مسلم",        name_id: "Shahih Muslim" },
  abudawud: { ar: "ara-abudawud", id: "ind-abudawud", name_ar: "سنن أبي داود",     name_id: "Sunan Abu Dawud" },
  tirmidhi: { ar: "ara-tirmidhi", id: "ind-tirmidhi", name_ar: "جامع الترمذي",     name_id: "Jami' At-Tirmidhi" },
  nasai:    { ar: "ara-nasai",    id: "ind-nasai",    name_ar: "سنن النسائي",      name_id: "Sunan An-Nasa'i" },
  ibnmajah: { ar: "ara-ibnmajah", id: "ind-ibnmajah", name_ar: "سنن ابن ماجه",     name_id: "Sunan Ibn Majah" },
  malik:    { ar: "ara-malik",    id: "ind-malik",    name_ar: "موطأ مالك",        name_id: "Muwatta Malik" },
};

// ---------------------------------------------------------------- args
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const picked = args.all
  ? Object.keys(AVAILABLE)
  : args.books
    ? String(args.books).split(",").map((s) => s.trim()).filter((k) => AVAILABLE[k])
    : ["nawawi", "bukhari", "muslim"];
const LIMIT = args.limit ? Number(args.limit) : Infinity;

// ---------------------------------------------------------------- utils
const q = (s) => (s == null ? "NULL" : `'${String(s).replace(/'/g, "''")}'`);

async function getJSON(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (attempt === 3) throw new Error(`فشل جلب ${url} — ${e.message}`);
      await new Promise((r) => setTimeout(r, 1200 * attempt));
    }
  }
}

/**
 * تحويل درجة الحديث من النص الحر إلى enum المشروع.
 * ملاحظة: البخاري ومسلم صحيحان بإجماع، فتُعطى الدرجة مباشرةً.
 */
function mapGrade(grades, collectionKey) {
  if (collectionKey === "bukhari" || collectionKey === "muslim") return "sahih";
  const blob = (grades ?? []).map((g) => `${g.name ?? ""} ${g.grade ?? ""}`).join(" ").toLowerCase();
  if (/da'?if|dhaif|ضعيف|weak/.test(blob)) return "daif";
  if (/hasan|حسن|good/.test(blob)) return "hasan";
  if (/sahih|صحيح|authentic/.test(blob)) return "sahih";
  return "hasan"; // افتراضي محافظ عند غياب التصريح
}

/**
 * فصل الإسناد عن المتن تقريبياً.
 * [تحذير علمي] هذا فصل آليّ بعلامات لفظية، وليس تحقيقاً. يجب أن يراجعه المشرف.
 * العلامات: «قال: سمعت رسول الله ... يقول:» أو «عن النبي ﷺ قال:» ونحوها.
 */
function splitIsnadMatn(text) {
  const clean = (s) => s.replace(/[\u200e\u200f]/g, "").replace(/^[\s"\u201c\u00ab\u00bb.\u060c:\u061b]+|[\s"\u201d\u00ab\u00bb]+$/g, "").trim();

  // (1) الأدق: المتن محصور بين أول وآخر علامة اقتباس (البخاري ومسلم منتظمان بها)
  const first = text.search(/["\u201c\u00ab]/);
  const last = text.search(/["\u201d\u00bb](?![\s\S]*["\u201d\u00bb])/);
  if (first > 15 && last > first + 15) {
    const isnad = clean(text.slice(0, first));
    const matn = clean(text.slice(first, last + 1));
    if (isnad.length > 10 && matn.length > 10) return { isnad, matn };
  }

  // (2) علامات لفظية تسبق كلام النبي ﷺ. نأخذ **آخر** تطابق لا أوّله،
  //     لأن الإسناد قد يحوي «قال» متكررة بين الرواة قبل المتن الفعلي.
  const markers = [
    /(?:صلى الله عليه وسلم|صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ|صلى الله عليه و سلم|\u0635\u0644\u0639\u0645|\ufdfa)\s*(?:أَنَّهُ\s+)?(?:قَالَ|قال|يَقُولُ|يقول)\s*:?\s*/g,
    /(?:قَالَ|قال)\s+(?:رَسُولُ|رسول)\s+(?:اللَّهِ|الله)[^\n]{0,50}?(?:وسلم|وَسَلَّمَ|\ufdfa)\s*:?\s*/g,
    /(?:سَمِعْتُ|سمعت)\s+(?:رَسُولَ|رسول)\s+(?:اللَّهِ|الله)[^\n]{0,50}?(?:يَقُولُ|يقول)\s*:?\s*/g,
    /(?:أَنَّ|أن)\s+(?:رَسُولَ|رسول)\s+(?:اللَّهِ|الله)[^\n]{0,50}?(?:قَالَ|قال)\s*:?\s*/g,
    /(?:عَنِ|عن)\s+(?:النَّبِيِّ|النبي)[^\n]{0,60}?(?:قَالَ|قال)\s*:?\s*/g,
    /(?:عَنْ|عن)\s+(?:رَسُولِ|رسول)\s+(?:اللَّهِ|الله)[^\n]{0,50}?(?:قَالَ|قال)\s*:?\s*/g,
  ];
  let best = null;
  for (const re of markers) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      const cut = m.index + m[0].length;
      // نفضّل أبعد قطع يترك متناً معقولاً — الإسناد يسبق المتن دائماً
      if (m.index > 15 && text.length - cut > 15 && (!best || cut > best)) best = cut;
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  if (best) {
    const isnad = clean(text.slice(0, best));
    const matn = clean(text.slice(best));
    if (isnad.length > 10 && matn.length > 10) return { isnad, matn };
  }

  // (3) الروايات غير المقتبسة (فِعل لا قول) — نحو 39% من المجموعات السننية.
  //     الإسناد سلسلة رواة مفصولة بفواصل تنتهي بـ«قال/قالت/أنّ»، ثم يبدأ المتن.
  //     نأخذ آخر رابط إسنادي يقع في النصف الأول من النص ويترك متناً معقولاً.
  const link = /(?:،\s*|\s)(?:قَالَ|قال|قَالَتْ|قالت|قَالُوا|قالوا|يَقُولُ|يقول|أَنَّهُ|أنه)\s+/g;
  let m3, cut3 = null;
  const halfway = Math.floor(text.length * 0.6);
  while ((m3 = link.exec(text)) !== null) {
    const c = m3.index + m3[0].length;
    // يجب أن يسبقه اسم راوٍ (سلسلة إسناد) وأن يبقى متن كافٍ بعده
    const before = text.slice(0, m3.index);
    const hasChain = /(?:حَدَّثَنَا|حدثنا|أَخْبَرَنَا|أخبرنا|عَنْ|عن|سَمِعْتُ|سمعت)/.test(before);
    if (hasChain && m3.index > 25 && m3.index < halfway && text.length - c > 40) cut3 = c;
  }
  if (cut3) {
    const isnad = clean(text.slice(0, cut3));
    const matn = clean(text.slice(cut3));
    if (isnad.length > 20 && matn.length > 20) return { isnad, matn };
  }

  return { isnad: "", matn: clean(text) };
}

// ---------------------------------------------------------------- main
let AR_NAMES = {};
const unmapped = new Set();

async function run() {
  await mkdir(OUT, { recursive: true });
  try {
    AR_NAMES = JSON.parse(await readFile(join(ROOT, "scripts", "book-names-ar.json"), "utf8"));
    delete AR_NAMES._note;
    console.log(`جدول التعريب: ${Object.keys(AR_NAMES).length} اسماً`);
  } catch {
    console.warn("تحذير: تعذّر قراءة book-names-ar.json — ستبقى الأسماء إنجليزية.");
  }
  console.log(`المجموعات المختارة: ${picked.join(", ")}`);
  if (LIMIT !== Infinity) console.log(`حد أقصى: ${LIMIT} حديثاً لكل مجموعة`);

  let colId = 0, bookId = 0, chapId = 0;
  const colRows = [], bookRows = [], chapRows = [], hadithRows = [];
  const stats = [];

  for (const key of picked) {
    const cfg = AVAILABLE[key];
    process.stdout.write(`\n[${key}] تنزيل العربي… `);
    const ar = await getJSON(`${CDN}/editions/${cfg.ar}.min.json`);
    let id = null;
    if (cfg.id) {
      process.stdout.write("الإندونيسي… ");
      try { id = await getJSON(`${CDN}/editions/${cfg.id}.min.json`); }
      catch { console.warn("(تعذّر جلب الترجمة — سنكمل بدونها)"); }
    }

    // فهرسة الترجمة برقم الحديث
    const trMap = new Map();
    for (const h of id?.hadiths ?? []) trMap.set(h.hadithnumber, h.text);

    colId++;
    colRows.push(`(${colId}, ${q(key)}, ${q(cfg.name_ar)}, ${q(cfg.name_id)}, ${colId})`);

    // [FIX] المفتاح في الملف الكامل هو `sections` بالجمع، لا `section`.
    //       النسخة السابقة قرأت `section` فخرجت كل الأسماء «القسم N».
    const sections = ar.metadata?.sections ?? ar.metadata?.section ?? {};

    // تجميع الأحاديث حسب القسم (الكتاب)
    const bySection = new Map();
    for (const h of ar.hadiths ?? []) {
      const sec = String(h.reference?.book ?? 1);
      if (!bySection.has(sec)) bySection.set(sec, []);
      bySection.get(sec).push(h);
    }

    let taken = 0;
    for (const [secNo, list] of [...bySection.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      if (taken >= LIMIT) break;
      // أسماء المصدر إنجليزية؛ نعرّبها من الجدول، ونحتفظ بالأصل في name_id.
      const srcName = String(sections[secNo] ?? "").trim();
      if (!srcName) continue; // قسم بلا اسم (مثل "0") — يُتجاهل
      const arName = AR_NAMES[srcName];
      if (!arName) unmapped.add(srcName);
      bookId++;
      bookRows.push(`(${bookId}, ${colId}, ${q(arName ?? srcName)}, ${q(srcName)}, ${Number(secNo) || bookId})`);

      // المصدر لا يوفّر مستوى «الباب» — نُنشئ باباً واحداً لكل كتاب.
      // يمكن للمشرف تقسيمه لاحقاً، أو نستبدله ببيانات sunnah.com حين يتوفر المفتاح.
      chapId++;
      chapRows.push(`(${chapId}, ${bookId}, ${q("الأحاديث")}, NULL, 1)`);

      for (const h of list) {
        if (taken >= LIMIT) break;
        const { isnad, matn } = splitIsnadMatn(h.text ?? "");
        if (!matn) continue;
        const tr = trMap.get(h.hadithnumber) ?? null;
        const grade = mapGrade(h.grades, key);
        const lenClass = matn.length > 400 ? "long" : "short";
        hadithRows.push(
          `(${chapId}, ${h.hadithnumber}, ${q(isnad || "—")}, ${q(matn)}, ${q(tr)}, ${q(grade)}::hadith_grade, ${q(lenClass)}::hadith_length, ${q("fawazahmed0/hadith-api")})`
        );
        taken++;
      }
    }
    stats.push({ key, hadiths: taken, books: bySection.size, translated: trMap.size > 0 });
    console.log(`✓ ${taken} حديثاً`);
  }

  // ------------------------------------------------------------ اكتب SQL
  const header = `-- =============================================================================
-- بذور المحتوى المرجعي — مولَّدة آلياً بـ scripts/import-hadith.mjs
-- المصدر: fawazahmed0/hadith-api (رخصة Unlicense — ملكية عامة)
-- التاريخ: ${new Date().toISOString().slice(0, 10)}
--
-- ⚠️ تحذير علمي: فصل الإسناد عن المتن آليّ بعلامات لفظية وليس تحقيقاً.
--    يجب أن يراجعه مشرف المادة قبل الاعتماد التعليمي.
-- =============================================================================

BEGIN;
`;

  const chunks = [];
  chunks.push([
    "01-collections.sql",
    header +
      `\nINSERT INTO collections (id, slug, name_ar, name_id, sort_order) OVERRIDING SYSTEM VALUE VALUES\n` +
      colRows.join(",\n") + `\nON CONFLICT (id) DO NOTHING;\n\n` +
      `INSERT INTO books (id, collection_id, name_ar, name_id, sort_order) OVERRIDING SYSTEM VALUE VALUES\n` +
      bookRows.join(",\n") + `\nON CONFLICT (id) DO NOTHING;\n\n` +
      `INSERT INTO chapters (id, book_id, name_ar, name_id, sort_order) OVERRIDING SYSTEM VALUE VALUES\n` +
      chapRows.join(",\n") + `\nON CONFLICT (id) DO NOTHING;\n\n` +
      `SELECT setval(pg_get_serial_sequence('collections','id'), ${colId});\n` +
      `SELECT setval(pg_get_serial_sequence('books','id'), ${bookId});\n` +
      `SELECT setval(pg_get_serial_sequence('chapters','id'), ${chapId});\n\nCOMMIT;\n`,
  ]);

  // الأحاديث مقسّمة لتفادي حدود محرر SQL في Supabase
  const PER_FILE = 1500;
  for (let i = 0, n = 2; i < hadithRows.length; i += PER_FILE, n++) {
    const slice = hadithRows.slice(i, i + PER_FILE);
    chunks.push([
      `${String(n).padStart(2, "0")}-hadiths-${n - 1}.sql`,
      header +
        `\nINSERT INTO hadiths (chapter_id, hadith_number, isnad_ar, matn_ar, translation_id, grade, length_class, source_api) VALUES\n` +
        slice.join(",\n") + `\nON CONFLICT (chapter_id, hadith_number) DO NOTHING;\n\nCOMMIT;\n`,
    ]);
  }

  for (const [name, body] of chunks) {
    await writeFile(join(OUT, name), body, "utf8");
    console.log(`كُتب ${name} (${(Buffer.byteLength(body) / 1024 / 1024).toFixed(1)} MB)`);
  }

  console.log("\n────────── الملخص ──────────");
  for (const s of stats) console.log(`  ${s.key}: ${s.hadiths} حديثاً · ${s.books} كتاباً · ترجمة: ${s.translated ? "نعم" : "لا"}`);
  console.log(`  الإجمالي: ${hadithRows.length} حديثاً · ${bookRows.length} كتاباً في ${chunks.length} ملف SQL`);

  if (unmapped.size) {
    console.log(`\n⚠️ ${unmapped.size} اسم كتاب بلا تعريب (بقي بالإنجليزية):`);
    for (const n of [...unmapped].slice(0, 40)) console.log(`   - ${n}`);
    if (unmapped.size > 40) console.log(`   ... و${unmapped.size - 40} غيرها`);
    console.log("   أضفها إلى scripts/book-names-ar.json أو عدّلها من لوحة المشرف.");
    await writeFile(join(OUT, "_unmapped-book-names.txt"), [...unmapped].join("\n"), "utf8");
  } else {
    console.log("\n✓ كل أسماء الكتب مُعرَّبة.");
  }
  console.log(`\nالمخرجات في: ${OUT}`);
  console.log("نفّذ الملفات بالترتيب في Supabase ← SQL Editor.");
}

run().catch((e) => { console.error("\n✗ فشل:", e.message); process.exit(1); });
