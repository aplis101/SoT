#!/usr/bin/env node
/**
 * استيراد المحتوى المرجعي مباشرةً إلى Supabase — بلا ملفات SQL وسيطة.
 *
 * لماذا: 36 ألف حديث ≈ 70 ميجابايت من SQL. محرر SQL في المتصفح لا يحتمله.
 * هذا السكربت يُنزّل من المصدر، يحوّل، ويُدرج على دفعات عبر PostgREST.
 *
 * المصدر: fawazahmed0/hadith-api — رخصة Unlicense (ملكية عامة، بلا مفتاح).
 *
 * يتطلب في app/.env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...        ← من Settings ← API
 *
 * التشغيل:
 *   node scripts/seed-supabase.mjs              # المجموعات العشر كاملة
 *   node scripts/seed-supabase.mjs --books=bukhari,muslim
 *   node scripts/seed-supabase.mjs --dry        # تحويل بلا إدراج (للفحص)
 *   node scripts/seed-supabase.mjs --wipe       # يمسح المحتوى المرجعي أولاً
 */

import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

const AVAILABLE = {
  nawawi:   { ar: "ara-nawawi",   id: null,           name_ar: "الأربعون النووية", name_id: "Arbain Nawawi" },
  qudsi:    { ar: "ara-qudsi",    id: null,           name_ar: "الأربعون القدسية", name_id: "Arbain Qudsi" },
  dehlawi:  { ar: "ara-dehlawi",  id: null,           name_ar: "أربعون الدهلوي",   name_id: "Arbain Dehlawi" },
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
const picked = args.books
  ? String(args.books).split(",").map((s) => s.trim()).filter((k) => AVAILABLE[k])
  : Object.keys(AVAILABLE);
const DRY = !!args.dry;
const BATCH = Number(args.batch ?? 500);

// ---------------------------------------------------------------- env
async function loadEnv() {
  let raw = "";
  try { raw = await readFile(join(ROOT, ".env.local"), "utf8"); }
  catch { throw new Error("لم أجد app/.env.local — أنشئه من .env.local.example وضع فيه المفاتيح."); }
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url.includes("REPLACE")) throw new Error("NEXT_PUBLIC_SUPABASE_URL ما زال تنكرياً في .env.local");
  if (!key || key.includes("REPLACE")) throw new Error("SUPABASE_SERVICE_ROLE_KEY ما زال تنكرياً في .env.local");
  return { url, key };
}

async function getJSON(url) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (i === 3) throw new Error(`فشل جلب ${url} — ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
}

function mapGrade(grades, key) {
  if (key === "bukhari" || key === "muslim") return "sahih";
  const blob = (grades ?? []).map((g) => `${g.name ?? ""} ${g.grade ?? ""}`).join(" ").toLowerCase();
  if (/da'?if|dhaif|ضعيف|weak/.test(blob)) return "daif";
  if (/hasan|حسن|good/.test(blob)) return "hasan";
  if (/sahih|صحيح|authentic/.test(blob)) return "sahih";
  return "hasan";
}

/**
 * فصل الإسناد عن المتن.
 * [FIX] الاعتماد الأساسي على علامات الاقتباس المحيطة بكلام النبي ﷺ في النص المصدر —
 *       العلامات اللفظية وحدها كانت تنجح في 12 حديثاً من 14650 فقط.
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

/** إدراج على دفعات مع تقرير تقدّم */
async function insertBatched(db, table, rows, label, conflict) {
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const q = conflict
      ? db.from(table).upsert(slice, { onConflict: conflict, ignoreDuplicates: true })
      : db.from(table).insert(slice);
    const { error } = await q;
    if (error) throw new Error(`${label}: ${error.message}`);
    done += slice.length;
    process.stdout.write(`\r   ${label}: ${done}/${rows.length}`);
  }
  process.stdout.write(`\r   ${label}: ${done}/${rows.length} ✓\n`);
}

// ---------------------------------------------------------------- main
async function run() {
  console.log(`المجموعات: ${picked.join(", ")}`);

  let AR_NAMES = {};
  try {
    AR_NAMES = JSON.parse(await readFile(join(ROOT, "scripts", "book-names-ar.json"), "utf8"));
    delete AR_NAMES._note;
  } catch { console.warn("تحذير: جدول التعريب غير موجود — الأسماء ستبقى إنجليزية."); }

  const { url, key } = DRY ? { url: "", key: "" } : await loadEnv();
  const db = DRY ? null : createClient(url, key, { auth: { persistSession: false } });

  if (args.wipe && !DRY) {
    console.log("\n⚠️  مسح المحتوى المرجعي الحالي…");
    for (const t of ["takhrij_references", "word_definitions", "hadiths", "chapters", "books", "collections"]) {
      const { error } = await db.from(t).delete().neq("id", t === "hadiths" ? "00000000-0000-0000-0000-000000000000" : 0);
      if (error) console.warn(`   ${t}: ${error.message}`);
    }
    console.log("   تم.");
  }

  let colId = 0, bookId = 0, chapId = 0;
  const collections = [], books = [], chapters = [], hadiths = [];
  const stats = [], unmapped = new Set();

  for (const k of picked) {
    const cfg = AVAILABLE[k];
    process.stdout.write(`\n[${k}] تنزيل… `);
    const ar = await getJSON(`${CDN}/editions/${cfg.ar}.min.json`);
    let tr = new Map();
    if (cfg.id) {
      try {
        const id = await getJSON(`${CDN}/editions/${cfg.id}.min.json`);
        for (const h of id.hadiths ?? []) tr.set(h.hadithnumber, h.text);
      } catch { console.warn("(بلا ترجمة)"); }
    }

    collections.push({ id: ++colId, slug: k, name_ar: cfg.name_ar, name_id: cfg.name_id, sort_order: colId });

    const sections = ar.metadata?.sections ?? ar.metadata?.section ?? {};
    const bySec = new Map();
    for (const h of ar.hadiths ?? []) {
      const s = String(h.reference?.book ?? 1);
      (bySec.get(s) ?? bySec.set(s, []).get(s)).push(h);
    }

    let taken = 0;
    for (const [secNo, list] of [...bySec.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const src = String(sections[secNo] ?? "").trim();
      if (!src) continue;
      const arName = AR_NAMES[src];
      if (!arName) unmapped.add(src);

      books.push({ id: ++bookId, collection_id: colId, name_ar: arName ?? src, name_id: src, sort_order: Number(secNo) || bookId });
      chapters.push({ id: ++chapId, book_id: bookId, name_ar: "الأحاديث", name_id: null, sort_order: 1 });

      for (const h of list) {
        const { isnad, matn } = splitIsnadMatn(h.text ?? "");
        if (!matn) continue;
        hadiths.push({
          chapter_id: chapId,
          hadith_number: h.hadithnumber,
          isnad_ar: isnad || "—",
          matn_ar: matn,
          translation_id: tr.get(h.hadithnumber) ?? null,
          grade: mapGrade(h.grades, k),
          length_class: matn.length > 400 ? "long" : "short",
          source_api: "fawazahmed0/hadith-api",
          source_ref: `${k}:${h.hadithnumber}`,
        });
        taken++;
      }
    }
    stats.push({ k, taken, books: bySec.size, translated: tr.size > 0 });
    console.log(`✓ ${taken} حديثاً`);
  }

  console.log(`\n────────── الإجمالي ──────────`);
  for (const s of stats) console.log(`  ${s.k}: ${s.taken} حديثاً · ${s.books} كتاباً · ترجمة: ${s.translated ? "نعم" : "لا"}`);
  console.log(`  ${collections.length} مجموعات · ${books.length} كتاباً · ${hadiths.length} حديثاً`);
  const withIsnad = hadiths.filter((h) => h.isnad_ar !== "—").length;
  console.log(`  فصل الإسناد: ${withIsnad}/${hadiths.length} = ${Math.round(100 * withIsnad / hadiths.length)}%`);
  const withTr = hadiths.filter((h) => h.translation_id).length;
  console.log(`  مترجمة: ${withTr}/${hadiths.length} = ${Math.round(100 * withTr / hadiths.length)}%`);
  if (unmapped.size) console.log(`  ⚠️ ${unmapped.size} اسم كتاب بلا تعريب`);

  if (DRY) { console.log("\n(--dry: لم يُدرج شيء)"); return; }

  console.log(`\nالإدراج في Supabase على دفعات من ${BATCH}…`);
  await insertBatched(db, "collections", collections, "المجموعات", "id");
  await insertBatched(db, "books", books, "الكتب", "id");
  await insertBatched(db, "chapters", chapters, "الأبواب", "id");
  await insertBatched(db, "hadiths", hadiths, "الأحاديث", "chapter_id,hadith_number");

  const { count } = await db.from("hadiths").select("*", { count: "exact", head: true });
  console.log(`\n✓ تم. عدد الأحاديث في قاعدة البيانات الآن: ${count}`);
}

run().catch((e) => { console.error("\n✗ فشل:", e.message); process.exit(1); });
