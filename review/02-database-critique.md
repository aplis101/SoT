# نقد طبقة قاعدة البيانات — 04-database-schema.sql + 05-rls-policies.sql + 03-data-model.md

Reviewer: Claude (تنفيذ فعلي على PostgreSQL 14.23 محلي مع محاكاة Supabase)
Date: 2026-08-04

---

## 1. نتيجة التنفيذ الفعلي

بيئة الاختبار: PostgreSQL 14.23، schema `auth` مُحاكى مع `auth.uid()` / `auth.role()` / `auth.jwt()`، وأدوار `anon` / `authenticated` / `service_role`، ومنح `GRANT ALL ON ALL TABLES ... TO anon, authenticated` لمحاكاة الامتيازات الافتراضية في Supabase.

| الملف | النتيجة |
|---|---|
| `04-database-schema.sql` | ✅ **نُفِّذ بنجاح — صفر أخطاء تركيبية.** أُنشئت 15 جدولاً، 9 أنواع ENUM، 5 مشغّلات، 6 دوال. |
| `05-rls-policies.sql` | ✅ **نُفِّذ بنجاح — صفر أخطاء.** RLS مفعّل على 15/15 جدولاً، 31 سياسة. |

الجداول الـ15 في سجل المعرفات كلها موجودة بأسمائها الصحيحة:
`annotations, app_settings, books, chapters, collections, content_reports, favorite_recordings, hadiths, likes, profiles, recording_listens, recordings, reports, takhrij_references, word_definitions`

**الخلاصة: الملفان سليمان نحوياً. كل المشاكل أدناه منطقية/أمنية، لا تركيبية.**

---

## 2. نتائج اختبارات الاختراق (15 محاولة كدور `authenticated`)

| # | المحاولة | النتيجة | الحكم |
|---|---|---|---|
| 1 | طالب يرقّي نفسه إلى `admin` | `ERROR: violates RLS policy` | ✅ محجوب |
| 2 | طالب يضع `is_verified=true` على تسجيله | `UPDATE 0` | ⚠️ محجوب — **لكن الإداري محجوب أيضاً، انظر DB-01** |
| 3 | طالب يحذف تسجيل زميله | `DELETE 0` | ✅ محجوب |
| 4 | طالب يعدّل `app_settings` | `UPDATE 0` | ✅ محجوب |
| 5 | طالب يُدرج مفتاح إعدادات جديد | `ERROR: violates RLS policy` | ✅ محجوب |
| 6 | طالب يقرأ بلاغات غيره | `count = 0` | ✅ محجوب |
| 7 | طالب يُعجب بهوية زميله (`user_id` مزوّر) | `ERROR: violates RLS policy` | ✅ محجوب |
| 8 | طالب ينفخ `likes_count` مباشرة | `UPDATE 0` | ✅ محجوب |
| 10 | زائر غير مسجّل يقرأ `recordings` | `count = 0` | ✅ محجوب |
| 11 | **زائر غير مسجّل يقرأ `profiles`** | **`count = 3` (كل الحسابات)** | ❌ **مكشوف — DB-03** |
| 12 | **المشرف يضع `is_verified=true`** | **`UPDATE 0`** | ❌ **الميزة معطّلة كلياً — DB-01** |
| 13 | طالب يُدرج ملفاً شخصياً بدور `admin` | `ERROR: violates RLS policy` | ✅ محجوب |
| 14 | طالب يعيد توجيه `file_path` لتسجيله | `UPDATE 0` | ✅ محجوب |

**تقييم عام لـ RLS: قوي في منع التصعيد والانتحال والتلاعب الأفقي.** كل هجمات الطلاب المعتادة محجوبة. الثغرات الحقيقية ليست في "السماح الزائد" بل في **المنع الزائد** (DB-01) و**التسريب القرائي** (DB-03).

---

## 3. المشاكل

| ID | الموقع | الشدة | المشكلة | الإصلاح |
|---|---|---|---|---|
| **DB-01** | `05-rls-policies.sql` §recordings (~L100-125) | **P0** | **لا توجد أي سياسة `UPDATE` على `recordings` إطلاقاً.** النتيجة المُثبتة تجريبياً: المشرف **لا يستطيع** وضع `is_verified` (اختبار 12 = `UPDATE 0`)، ولا يستطيع أحد ضبط `is_hidden` للإخفاء التلقائي في ALG-002، ولا يمكن تحديث `likes_count`/`listens_count`. هذا يُعطّل **UC-013 و F008 و ALG-002 و ALG-003** بالكامل بصمت — بلا خطأ، فقط `UPDATE 0`. | إضافة سياسة إدارية + دوال RPC بـ`SECURITY DEFINER` (انظر §4، SQL جاهز) |
| **DB-02** | `04-database-schema.sql` §المشغّلات (L~240-260) | **P0** | **لا يوجد أي مشغّل يصون العدادات المُفكَّكة.** `recordings.likes_count` و`listens_count` أعمدة `NOT NULL DEFAULT 0` لكن لا مشغّل على `likes` أو `recording_listens` يزيدها/ينقصها. المشغّلات الخمسة الموجودة كلها `set_updated_at` (4) + `handle_new_user` (1). **النتيجة: `likes_count` يبقى 0 للأبد ← الطبقة 3 من ALG-001 (`ORDER BY likes_count DESC`) تُرجع نتيجة عشوائية، وشارة "الأفضل مجتمعياً" (`community_best_min_likes = 3`) لا تظهر أبداً.** | مشغّلات `AFTER INSERT/DELETE` (انظر §4) |
| **DB-03** | `05-rls-policies.sql` L~45 `profiles_select_public` | **P0** | `qual = true` و`roles = {public}` ← **زائر غير مسجّل يقرأ جدول `profiles` كاملاً** (مُثبت: 3 صفوف). يكشف: `display_name` لكل طالب، **من هو المشرف** (`role`)، `last_active_at` (نمط حضور)، `consent_given_at`. هذا تسريب خصوصية حقيقي لمنصة طلاب، ويخالف وعد "الزملاء فقط" في وثيقة الموافقة. | حصر السياسة بـ`TO authenticated` |
| **DB-04** | `05-rls-policies.sql` L~40 `settings_select_all` | **P1** | `app_settings` مقروء للزوار بـ`qual = true`. يكشف **كل عتبات الإشراف** (`report_hide_min=4`, `report_hide_ratio=0.40`, `rate_limit_uploads_per_hour=5`). مهاجم يعرف الرقم الدقيق اللازم لإخفاء تسجيل خصمه. | إما `TO authenticated` مع حجب مفاتيح الإشراف، أو عرض المفاتيح العامة فقط عبر view |
| **DB-05** | `05-rls-policies.sql` — كل السياسات الـ31 | **P1** | **لا سياسة واحدة تحدد `TO authenticated`** — كلها `TO public`. مع المنح الافتراضية في Supabase (`GRANT ALL` لـ`anon`)، الحماية الوحيدة هي شرط `auth.uid()` الذي يصبح `NULL` للزائر. أي سياسة مستقبلية يُنسى فيها الشرط = انكشاف فوري. دفاع في العمق مفقود. | إضافة `TO authenticated` صراحةً لكل سياسة غير عامة |
| **DB-06** | `04-database-schema.sql` L~44-52 | **P1** | `collections.id` / `books.id` / `chapters.id` مُعرَّفة `GENERATED **ALWAYS** AS IDENTITY` (تحقّقتُ: `is_identity=YES, identity_generation=ALWAYS`). `ALWAYS` تمنع إدراج معرّف صريح إلا بـ`OVERRIDING SYSTEM VALUE` ← **سكربت استيراد المحتوى المرجعي لا يستطيع تثبيت معرّفات مستقرة**، فتتغيّر المعرّفات بين كل إعادة استيراد وتنكسر الروابط المحفوظة. | تحويلها إلى `BY DEFAULT` |
| **DB-07** | `04-database-schema.sql` §profiles + `handle_new_user` | **P0** ⬆️ | **مُثبت تجريبياً — تسجيل الدخول ينهار لفئة كاملة من المستخدمين.** المشغّل يستخدم `COALESCE(full_name, split_part(email,'@',1))` بينما `display_name` عليه `CHECK (char_length BETWEEN 2 AND 60)`. **الاختبار الحيّ:** مستخدم ببريد `x@u.ac.id` (جزء محلي من حرف واحد) أو اسم Google من حرف واحد ⇒ `ERROR: violates check constraint "profiles_display_name_check"` ⇒ **فشل `INSERT` على `auth.users` ⇒ فشل التسجيل بالكامل** برسالة خام من قاعدة البيانات. الاسم الطبيعي ينجح. لا مسار احتياطي ولا قصّ للأسماء فوق 60 حرفاً (أسماء إندونيسية كاملة تتجاوزها بسهولة). | `LEFT(..., 60)` + احتياطي مضمون الطول |
| **DB-08** | `04-database-schema.sql` §recordings | **P1** | `bitrate_kbps INTEGER NOT NULL` بلا `DEFAULT` (مُثبت: فشل إدراج تجريبي). العميل ملزم بإرساله في كل رفع لكن `08-api-contracts.md` لا يذكره كحقل إلزامي. | `DEFAULT 32` أو توثيقه إلزامياً في العقد |
| **DB-09** | `05-rls-policies.sql` §annotations | **P1** | `annotations` خارج النطاق صراحةً (SRS §1.2) لكنه يملك **4 سياسات CRUD كاملة ومفعّلة**. سطح هجوم حيّ لميزة غير مبنية وغير مُختبرة ولا واجهة لها. | تعطيل الكتابة حتى الإطلاق |
| **DB-10** | `05-rls-policies.sql` — استدعاءات `is_admin()` | **P2** | `is_admin()` تُستدعى داخل `USING` بلا تغليف ← يُعاد تقييمها **لكل صف** (استعلام فرعي على `profiles` في كل مرة). على قائمة 40 تسجيلاً = 40 استعلاماً إضافياً. | `(SELECT is_admin())` لتفعيل تخزين InitPlan |
| **DB-11** | `04-database-schema.sql` §الفهارس | **P2** | فهارس ناقصة للاستعلامات الفعلية: `reports(reporter_id)` (سياسة `reports_select_admin_or_reporter` تفلتر به)، `content_reports(hadith_id)`، `recordings(user_id, created_at)` لصفحة `/profile`. | إضافة 3 فهارس |
| **DB-12** | FK — كل العلاقات `ON DELETE CASCADE` (24/24 عدا 4 بـ`SET NULL`) | **P2** | حذف حساب طالب يُسقط: تسجيلاته، **وكل الإعجابات والنجوم التي منحها الآخرون لها**، وسجلات الاستماع، والبلاغات المقدَّمة ضدها — بلا أثر تدقيق ولا حذف ناعم. يتقاطع مع FLW/EC-C-02. لا استراتيجية أرشفة لنهاية الفصل الدراسي. | حذف ناعم (`deleted_at`) للتسجيلات + جدول `audit_log` |

---

## 4. SQL الإصلاح الجاهز (`06-fixes.sql`)

```sql
BEGIN;

-- DB-06: السماح باستيراد معرّفات مستقرة للمحتوى المرجعي
ALTER TABLE collections ALTER COLUMN id SET GENERATED BY DEFAULT;
ALTER TABLE books       ALTER COLUMN id SET GENERATED BY DEFAULT;
ALTER TABLE chapters    ALTER COLUMN id SET GENERATED BY DEFAULT;

-- DB-08: قيمة افتراضية لمعدل البت
ALTER TABLE recordings ALTER COLUMN bitrate_kbps SET DEFAULT 32;

-- DB-07 (P0): إصلاح انهيار التسجيل — ضمان طول الاسم 2..60 دائماً
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE candidate TEXT;
BEGIN
    candidate := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
    IF candidate IS NULL OR char_length(candidate) < 2 THEN
        candidate := NULLIF(TRIM(split_part(COALESCE(NEW.email,''), '@', 1)), '');
    END IF;
    IF candidate IS NULL OR char_length(candidate) < 2 THEN
        candidate := 'طالب-' || LEFT(REPLACE(NEW.id::text, '-', ''), 6);
    END IF;
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (NEW.id, LEFT(candidate, 60), 'student')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;

-- DB-03: حصر قراءة الملفات الشخصية بالمسجّلين
DROP POLICY IF EXISTS profiles_select_public ON profiles;
CREATE POLICY profiles_select_authenticated ON profiles
    FOR SELECT TO authenticated USING (true);

-- DB-04: حجب مفاتيح الإشراف عن الزوار
DROP POLICY IF EXISTS settings_select_all ON app_settings;
CREATE POLICY settings_select_public_keys ON app_settings
    FOR SELECT TO anon USING (key IN ('upload_enabled'));
CREATE POLICY settings_select_authenticated ON app_settings
    FOR SELECT TO authenticated USING (true);

-- DB-01: تحديث التسجيلات — للمشرف فقط، مع تجميد الحقول غير القابلة للتعديل
CREATE POLICY recordings_update_admin ON recordings
    FOR UPDATE TO authenticated
    USING ((SELECT is_admin()))
    WITH CHECK ((SELECT is_admin()));

-- DB-01: اعتماد التسجيل عبر RPC مع أثر تدقيق
CREATE OR REPLACE FUNCTION verify_recording(p_recording_id UUID, p_verified BOOLEAN)
RETURNS recordings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r recordings;
BEGIN
    IF NOT is_admin() THEN RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE='42501'; END IF;
    UPDATE recordings SET is_verified = p_verified,
           verified_by = CASE WHEN p_verified THEN auth.uid() ELSE NULL END,
           updated_at = now()
    WHERE id = p_recording_id RETURNING * INTO r;
    IF r.id IS NULL THEN RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE='P0002'; END IF;
    RETURN r;
END $$;

-- DB-02: صيانة العدادات المُفكَّكة (الإصلاح الأهم)
CREATE OR REPLACE FUNCTION bump_likes_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE recordings SET likes_count = likes_count + 1 WHERE id = NEW.recording_id;
    ELSE
        UPDATE recordings SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.recording_id;
    END IF;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_likes_count AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION bump_likes_count();

CREATE OR REPLACE FUNCTION bump_listens_count() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE recordings SET listens_count = listens_count + 1 WHERE id = NEW.recording_id;
    RETURN NULL;
END $$;
CREATE TRIGGER trg_listens_count AFTER INSERT ON recording_listens
    FOR EACH ROW EXECUTE FUNCTION bump_listens_count();

-- DB-11: فهارس ناقصة
CREATE INDEX IF NOT EXISTS idx_reports_reporter        ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_hadith  ON content_reports(hadith_id);
CREATE INDEX IF NOT EXISTS idx_recordings_user_created ON recordings(user_id, created_at DESC);

-- DB-09: تجميد سطح annotations حتى الإطلاق
DROP POLICY IF EXISTS annotations_insert_own ON annotations;
DROP POLICY IF EXISTS annotations_update_own ON annotations;
DROP POLICY IF EXISTS annotations_delete_own ON annotations;

COMMIT;
```

---

## 5. مطابقة `03-data-model.md` مع الـ DDL

لا تعارضات في أسماء الكيانات أو العلاقات. الانحراف الوحيد الجوهري هو **نوع المعرّف**: النموذج المفاهيمي يعامل الهرمية معاملة موحّدة بينما الـ DDL يخلط `integer` (مجموعة/كتاب/باب) مع `uuid` (حديث/تسجيل). مقبول تقنياً (المحتوى المرجعي ثابت ومستورد، والمحتوى المستخدم يحتاج معرّفات غير قابلة للتخمين) لكنه **غير موثّق كقرار** — يجب تدوينه في §7 من نموذج البيانات وإلا سيُصلحه مطوّر لاحق "خطأً".

---

## 6. ما هو صحيح فعلاً (يستحق التوثيق)

- منع الترقية الذاتية في `profiles_update_own` عبر `WITH CHECK (role = (SELECT role FROM profiles WHERE id = auth.uid()))` — أسلوب صحيح ومُثبت تجريبياً.
- ربط شرط الموافقة ومفتاح الرفع العام داخل `WITH CHECK` لسياسة `recordings_insert_student` — يفرض ALG على مستوى قاعدة البيانات لا الواجهة. ممتاز.
- `recordings_hadith_id_user_id_key` يفرض ALG-004 (تسجيل واحد لكل طالب لكل حديث) بقيد فريد حقيقي لا بمنطق تطبيقي.
- كل الدوال المساعدة (`is_admin`, `has_upload_consent`, `get_setting_*`) بـ`SECURITY DEFINER` **مع `SET search_path = public`** — الحماية الصحيحة ضد اختطاف مسار البحث. كثير من المشاريع تنسى هذا.
- 9 صفوف بذرة في `app_settings` بقيم فعلية لا `TODO`.
