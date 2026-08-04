# سياق مختصر للمراجعين

## المشروع
منصة الحديث الشريف التفاعلية — PWA تعليمية غير ربحية لفصل دراسي جامعي (إندونيسيا).
Stack مقصود: Next.js + TypeScript + Tailwind (RTL عربي) + Supabase (Auth/Postgres/Storage) + Vercel. ميزانية صفرية (Free Tier).

## الفكرة
مكتبة حديث هرمية (مجموعة ← كتاب ← باب ← حديث). الطلاب يسجلون تلاوتهم صوتياً، يستمعون لبعض، يعجبون (❤️) ويفضّلون شخصياً (⭐)، ويبلغون عن الأخطاء. المشرف يعتمد التسجيلات (✅) ويراجع البلاغات.

## المعرفات المعتمدة
- الميزات: F001 مكتبة هرمية | F002 صفحة حديث شاملة | F003 مشغل صوتي | F004 تسجيل ورفع | F005 إعجاب/تفضيل | F006 بلاغات | F007 مصادقة | F008 لوحة مشرف
- حالات الاستخدام: UC-001..UC-013
- الصفحات: PAGE-001 /login | PAGE-002 / | PAGE-003 /collections/[id] | PAGE-004 /books/[id] | PAGE-005 /hadiths/[id] (+4 sub) | PAGE-006 /profile | PAGE-007 /admin (+3 sub)
- الجداول: profiles, collections, books, chapters, hadiths, word_definitions, takhrij_references, recordings, likes, favorite_recordings, recording_listens, reports, content_reports, app_settings, annotations
- الخوارزميات: ALG-001 اختيار الصوت الافتراضي (3 طبقات) | ALG-002 عتبات بلاغات نسبية | ALG-003 عداد استماع ذكي | ALG-004 تسجيل واحد لكل طالب لكل حديث مع استبدال | ALG-005 rate limiting | ALG-006 فصل التفضيل الشخصي عن التقييم العام

## مسارات الملفات (بيئة bash)
- المصدر للقراءة: /tmp/SoT/hadith-sot/ و /tmp/SoT/PROJECT_SPECIFICATIONS_v2.md
- نسخة العمل: /sessions/elegant-cool-feynman/mnt/hadissss/hadith-sot/
- اكتب تقريرك في: /sessions/elegant-cool-feynman/mnt/hadissss/review/

## الهدف
نقد صارم قبل بناء البروتوتايب. لا تجامل. ابحث عن: تناقضات بين الوثائق، معرفات مذكورة وغير معرّفة، فجوات منطقية، ثغرات أمنية، افتراضات غير قابلة للتنفيذ على Free Tier، متطلبات غامضة لا يمكن ترجمتها لكود.
