// تشخيص بنية المصدر — يطبع من أين نأخذ أسماء الكتب
const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";
const j = async (u) => (await fetch(u)).json();

console.log("=== 1) الملف الكامل: ara-bukhari.min.json ===");
const full = await j(`${CDN}/editions/ara-bukhari.min.json`);
console.log("مفاتيح metadata:", Object.keys(full.metadata ?? {}));
console.log("section موجود؟", !!full.metadata?.section, "— عدد المفاتيح:", Object.keys(full.metadata?.section ?? {}).length);
console.log("section_detail موجود؟", !!full.metadata?.section_detail);
console.log("عدد الأحاديث:", full.hadiths?.length);
console.log("أول حديث reference:", JSON.stringify(full.hadiths?.[0]?.reference));

console.log("\n=== 2) info.min.json ===");
const info = await j(`${CDN}/info.min.json`);
console.log("المفاتيح العليا:", Object.keys(info).slice(0, 12));
const bk = info.bukhari ?? info["bukhari"];
if (bk) {
  console.log("bukhari keys:", Object.keys(bk));
  const s = bk.section ?? bk.sections ?? bk.metadata?.section;
  if (s) {
    const e = Object.entries(s).slice(0, 8);
    console.log("عيّنة أسماء الأقسام:");
    for (const [k, v] of e) console.log(`   ${k} => ${JSON.stringify(v)}`);
    console.log("   ... الإجمالي:", Object.keys(s).length);
  } else {
    console.log("لا يوجد section — البنية:", JSON.stringify(bk).slice(0, 600));
  }
}

console.log("\n=== 3) نقطة القسم المفردة ===");
const sec = await j(`${CDN}/editions/ara-bukhari/sections/3.min.json`);
console.log("section:", JSON.stringify(sec.metadata?.section));
console.log("section_detail:", JSON.stringify(sec.metadata?.section_detail));
