# النشر على الإنترنت وحفظ المفاتيح بأمان

الهدف: **كل شيء أونلاين** — لا خادم محلي، ولا مفتاح مكتوب في المستودع.

```
المستخدم (هاتف/حاسوب)
        │
        ▼
   Vercel  ←── يبني تلقائياً من GitHub عند كل push
        │        المفاتيح: Environment Variables (مشفّرة، خارج الكود)
        ▼
  Supabase  ←── Postgres + Auth (Google) + Storage للصوتيات
```

---

## ١. قاعدة الأمان — أين يُحفظ كل مفتاح

| المفتاح | أين يُحفظ | مكشوف للمتصفح؟ | ملاحظة |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel Env Vars | نعم — **وهذا طبيعي** | عنوان عام |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel Env Vars | نعم — **وهذا طبيعي** | لا يمنح شيئاً؛ RLS هو الحارس الفعلي |
| `SUPABASE_SERVICE_ROLE_KEY` | **`.env.local` على جهازك فقط — لا في Vercel** | **لا — أبداً** | يتجاوز RLS كلياً. [FIX SEC-03] |
| Google OAuth Client Secret | **Supabase Dashboard فقط** | لا | لا يدخل المشروع إطلاقاً |

**قاعدتان لا تُكسران:**

1. أي متغيّر يبدأ بـ`NEXT_PUBLIC_` **يُحقن في كود المتصفح ويراه أي شخص**. لا تضع فيه سرّاً أبداً.
2. `.env.local` مُستثنى في `.gitignore` ولا يُرفع. **لا تكتب مفتاحاً حقيقياً في أي ملف داخل المستودع** — ولو مؤقتاً، فتاريخ Git يحتفظ به للأبد.

> `anon key` مكشوف بالتصميم — هذا ليس خطأً. الأمان كله في سياسات RLS التي اختبرناها بـ15 محاولة اختراق. لهذا كان إصلاح DB-03 (منع الزائر من قراءة `profiles`) مهماً.

---

## ٢. خطوات النشر

### أ) Supabase

1. supabase.com ← **New Project** (منطقة Southeast Asia أقرب لإندونيسيا)
2. **SQL Editor** ← نفّذ بالترتيب. **الترتيب ملزم** — كل ملف يفترض ما قبله:

   | # | الملف | ماذا يفعل |
   |---|---|---|
   | ١ | `hadith-sot/04-database-schema.sql` | الجداول والأنواع |
   | ٢ | `hadith-sot/05-rls-policies.sql` | 30 سياسة RLS |
   | ٣ | `hadith-sot/06-fixes.sql` | إصلاحات ما بعد النقد |
   | ٤ | `hadith-sot/07-bug-reports.sql` | قناة بلاغات المنصة (F009) |
   | ٥ | `hadith-sot/08-security-fixes.sql` | إصلاحات P0 الصامتة |
   | ٦ | `app/supabase/seed/01-collections.sql` … حتى `11` | 35,798 حديثاً |
   | ٧ | `hadith-sot/09-search.sql` | البحث النصّي (F010) — **بعد البذور** |
   | ٨ | `hadith-sot/20-counts.sql` | عدّادات الأحاديث — **بعد البذور** |
   | ٩ | `hadith-sot/21-rate-limits.sql` | تحديد معدل البلاغات |

   > **لماذا ٧ و٨ بعد البذور؟** كلاهما يحسب على البيانات الموجودة: ٩ يبني
   > فهرس البحث، و٢٠ يملأ العدّادات. تشغيلهما على قاعدة فارغة يمرّ بلا خطأ
   > ويترك البحث بلا نتائج والعدّادات أصفاراً — فشلٌ صامت، وهو أسوأ أنواعه.
   > إن شغّلتهما مبكراً فالعلاج سطر واحد: `SELECT recount_hadiths();`
   > والفهرس يُعاد بناؤه بإعادة تشغيل `09-search.sql`.
3. **Storage** ← أنشئ bucket باسم `recordings`، **خاص (Private)** لا عام — التطبيق يولّد روابط موقّعة صالحة ساعة.
4. **Authentication ← Providers ← Google** ← فعّله وألصق Client ID و Secret.
5. **Settings ← API** ← انسخ `Project URL` و `anon key` و `service_role key`.

### ب) Google OAuth

1. console.cloud.google.com ← مشروع جديد
2. **APIs & Services ← OAuth consent screen** ← External ← املأ الاسم والبريد
3. **Credentials ← Create OAuth client ID ← Web application**
4. في **Authorized redirect URIs** ضع الرابط الذي تعطيك إياه Supabase بالضبط:
   `https://<معرّف-مشروعك>.supabase.co/auth/v1/callback`
5. انسخ Client ID و Secret ← ألصقهما في Supabase (الخطوة أ-٤). **لا تضعهما في المشروع.**

### ج) Vercel

1. vercel.com ← **Add New Project** ← اربط GitHub ← اختر `aplis101/SoT`
2. **Root Directory:** `app` ← مهم، لأن المستودع يحوي الوثائق أيضاً
3. **Environment Variables** — أضف:

```
NEXT_PUBLIC_DATA_SOURCE        = supabase
NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJ...
NEXT_PUBLIC_STORAGE_BUCKET     = recordings
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN = webmail.uad.ac.id
NEXT_PUBLIC_SITE_URL           = https://<اسم-مشروعك>.vercel.app
```

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` لا يُوضع في Vercel — [FIX SEC-03].**
> تحقّقنا بالجرد: التطبيق لا يستعمله في أي موضع من `app/src`؛ يقتصر استعماله على
> `scripts/seed-supabase.mjs` الذي يُشغَّل من جهازك. ووضعه في Vercel يعني أن أي
> اختراق للحساب يمنح المهاجم قاعدة البيانات كاملة متجاوزاً كل سياسات RLS —
> **مقابل صفر فائدة**. القاعدة: لا يُنشر سرّ لا يستعمله المنشور.

4. **Deploy**. كل `git push` بعدها ينشر تلقائياً.

### د) رقّ نفسك إلى مشرف

بعد أول تسجيل دخول لك، في Supabase ← SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE id = (
  SELECT id FROM auth.users WHERE email = 'بريدك@webmail.uad.ac.id'
);
```

(لا توجد واجهة لهذا عمداً — الترقية يدوية حتى لا يستطيع أحد ترقية نفسه.)

---

## ٣. الهاتف

لا حاجة لمتجر تطبيقات. بعد النشر:

**أندرويد (Chrome/Brave):** افتح الرابط ← سيظهر زر «ثبّت التطبيق» أسفل الشاشة، أو من القائمة ← Add to Home screen.

**آيفون (Safari):** شارك ⬆️ ← «إضافة إلى الشاشة الرئيسية».

بعدها يعمل بأيقونة، بملء الشاشة بلا شريط عنوان، والصوتيات المسموعة سابقاً تُشغَّل دون اتصال.

**وأي ميزة نضيفها تظهر في الهاتف والويب في نفس اللحظة** — لأنه كود واحد وخادم واحد. لا يوجد احتمال تباعد.

---

## ٤. حدود الخطة المجانية — ما يجب مراقبته

| المورد | الحد | تقديرنا لـ40 طالباً |
|---|---|---|
| تخزين Supabase | 1 GB | ~500 MB لـ2000 تسجيل — مريح |
| **Egress شهري** | 5 GB | **القيد الأقرب للتجاوز** — لهذا Service Worker يخزّن الصوتيات محلياً |
| قاعدة البيانات | 500 MB | ~35 MB للـ14,650 حديثاً — مريح |
| Vercel | 100 GB نطاق | كافٍ جداً |

راقب Egress شهرياً من لوحة Supabase. إن اقترب من الحد، قلّل معدل البت في التسجيل من 32 إلى 24 kbps.

---

## ٥. النسخ الاحتياطي (REQ-05 — كان مفتوحاً)

الخطة المجانية **بلا استرجاع زمني (PITR)**. أنشئ نسخة أسبوعية:

```bash
# يحتاج Supabase CLI ورابط الاتصال من Settings ← Database
supabase db dump --db-url "$DATABASE_URL" -f backup-$(date +%F).sql
```

احفظ النسخ في Google Drive أو مستودع خاص. **الصوتيات لا تدخل في هذا الـdump** — نزّلها من Storage بشكل منفصل في نهاية كل فصل دراسي.
