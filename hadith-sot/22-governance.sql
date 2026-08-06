-- =============================================================================
-- 22-governance.sql — رتبة المدير الأعلى · منح الرتب · لوحة القرارات
-- منصة الحديث الشريف | Version 1.0 | 2026-08-06
--
-- المشكلة
-- -----------------------------------------------------------------------------
-- كان في المنصة رتبتان لا ثالثة: `student` و`admin`. ومعنى ذلك أن كل من أردتَ
-- أن يعينك في مراجعة التسجيلات يصير مالكاً للمنصة كاملةً: يبدّل الإعدادات،
-- ويرقّي غيره، ولا شيء يمنعه من نزع رتبتك أنت. رتبةٌ واحدة للمراقبة والملكية
-- معاً ليست تبسيطاً بل غياب تصميم.
--
-- والترقية كانت لا تتم إلا بفتح لوحة Supabase وكتابة UPDATE يدوياً — وهذا
-- مقبول لمرةٍ واحدة (تعيين المالك)، لكنه غير مقبول في كل مرة تريد فيها إشراك
-- زميل. النتيجة العملية: لا يُشرك أحد، فيبقى العبء كله على شخص واحد.
--
-- التصميم
-- -----------------------------------------------------------------------------
--   student     يقرأ، يسجّل، يبلّغ.
--   admin       + يعتمد التسجيلات ويخفيها · يعالج البلاغات · يفتح الرفع
--               ويغلقه · يُدخل الغريب والتخريج والشرح.
--   superadmin  + يمنح رتبة `admin` وينزعها · يرى بريد المستخدمين ·
--               يحرّر لوحة القرارات.
--
-- **`superadmin` لا تُمنح من الواجهة أبداً — من القاعدة وحدها.** هذا مقصود:
-- أخطر ثغرة في أي نظام رتب هي مسار يرقّي به أحدٌ نفسه أو يرقّي من يرقّيه.
-- إبقاء أعلى رتبة خارج التطبيق كلياً يقطع السلسلة من أصلها: مهما اخترق مهاجمٌ
-- حساباً أو ثغرةً في الواجهة، لا يجد طريقاً إلى أعلى.
--
-- لماذا `is_admin()` تشمل `superadmin`
-- -----------------------------------------------------------------------------
-- ثلاثون سياسة RLS مكتوبة أصلاً على `is_admin()`. لو جعلنا المدير الأعلى رتبةً
-- منفصلةً لا تدخل فيها، لوجب تعديل الثلاثين — وكل واحدة فرصة لخطأ صامت يفتح
-- أو يغلق ما لا نقصد. توسيع الدالة سطرٌ واحد يورّث المدير الأعلى كل صلاحيات
-- المشرف بالتعريف، فلا يمكن أن يملك المشرف ما لا يملكه من فوقه.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ١. القيمة الجديدة في نوع الرتبة
-- -----------------------------------------------------------------------------
-- تُنفَّذ أولاً ووحدها. وكل ما بعدها يقارن `role::text` لا القيمة المجرَّدة،
-- لأن PostgreSQL يمنع استعمال قيمة enum جديدة في المعاملة التي أضافتها.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin';

-- -----------------------------------------------------------------------------
-- ٢. دوال الصلاحية
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role::text = 'superadmin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- [توسيع] كانت: role = 'admin'. صارت تشمل الأعلى — فيرث كل سياسة قائمة.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role::text IN ('admin', 'superadmin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- ٣. منح الرتب ونزعها
-- -----------------------------------------------------------------------------
-- أربعة حرّاس، كلٌّ منها يسدّ طريقاً معروفاً للاستيلاء:
--   ١) غير المدير الأعلى لا يستدعيها أصلاً.
--   ٢) لا يُمنح `superadmin` من هنا — القاعدة وحدها.
--   ٣) لا يعدّل أحدٌ رتبة نفسه — فلا ينزل مدير أعلى نفسه سهواً فتبقى المنصة
--      بلا مالك، ولا يُخدع بنقرةٍ في واجهة مزوَّرة.
--   ٤) لا تُمسّ رتبة مدير أعلى آخر — الأقران لا يعزل بعضهم.
--
-- والأثر يُكتب في `audit_log` دائماً: من رقّى من، ومتى. تغيير الصلاحيات أخطر
-- ما يجري في المنصة، وأولى شيء بالمساءلة.
CREATE OR REPLACE FUNCTION set_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor   UUID := auth.uid();
    v_current TEXT;
    v_name    TEXT;
BEGIN
    IF NOT is_superadmin() THEN
        RAISE EXCEPTION 'هذا الإجراء للمدير الأعلى وحده.'
            USING ERRCODE = 'insufficient_privilege', HINT = 'not_superadmin';
    END IF;

    IF p_role NOT IN ('student', 'admin') THEN
        RAISE EXCEPTION 'الرتبة المسموح منحها هنا: طالب أو مشرف. رتبة المدير الأعلى تُمنح من قاعدة البيانات وحدها.'
            USING ERRCODE = 'invalid_parameter_value', HINT = 'role_not_grantable';
    END IF;

    IF p_user_id = v_actor THEN
        RAISE EXCEPTION 'لا يمكنك تغيير رتبة نفسك.'
            USING ERRCODE = 'invalid_parameter_value', HINT = 'self_role_change';
    END IF;

    SELECT role::text, display_name INTO v_current, v_name
    FROM profiles WHERE id = p_user_id;

    IF v_current IS NULL THEN
        RAISE EXCEPTION 'لا يوجد مستخدم بهذا المعرّف.'
            USING ERRCODE = 'no_data_found';
    END IF;

    IF v_current = 'superadmin' THEN
        RAISE EXCEPTION 'لا تُغيَّر رتبة مدير أعلى من الواجهة — من قاعدة البيانات وحدها.'
            USING ERRCODE = 'insufficient_privilege', HINT = 'target_is_superadmin';
    END IF;

    IF v_current = p_role THEN RETURN; END IF;   -- لا شيء ليتغيّر

    UPDATE profiles SET role = p_role::user_role WHERE id = p_user_id;

    INSERT INTO audit_log (actor_id, action, table_name, row_id, details)
    VALUES (v_actor, 'set_role', 'profiles', p_user_id::text,
            jsonb_build_object('from', v_current, 'to', p_role, 'display_name', v_name));
END;
$$;

REVOKE ALL ON FUNCTION set_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_user_role(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- ٤. قائمة المستخدمين للمدير الأعلى
-- -----------------------------------------------------------------------------
-- البريد في `auth.users` لا في `profiles`، ولا سبيل للعميل إليه — وهذا صواب.
-- لكن من يمنح رتبةً يجب أن يميّز «محمد» من «محمد»، والاسم المعروض وحده لا
-- يكفي. فنكشف البريد **للمدير الأعلى وحده**، ولا نضعه في جدول تقرؤه سياسة
-- عامة. أقلّ كشف يفي بالغرض.
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE (
    id             UUID,
    display_name   TEXT,
    email          TEXT,
    role           TEXT,
    consent_ok     BOOLEAN,
    last_active_at TIMESTAMPTZ,
    recordings     BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT p.id,
           p.display_name,
           CASE WHEN is_superadmin() THEN u.email::text ELSE NULL END,
           p.role::text,
           p.consent_given_at IS NOT NULL,
           p.last_active_at,
           (SELECT count(*) FROM recordings r WHERE r.user_id = p.id)
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE is_admin()
    ORDER BY
        CASE p.role::text WHEN 'superadmin' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
        p.display_name;
$$;

REVOKE ALL ON FUNCTION admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_list_users() TO authenticated;

-- -----------------------------------------------------------------------------
-- ٥. لوحة القرارات والتذكيرات
-- -----------------------------------------------------------------------------
-- المشروع فيه بنود معلَّقة حقيقية (18-open-tasks.md) لكنها في ملفٍ داخل مستودع
-- لا يفتحه صاحب المنصة في حياته اليومية. القرار الذي لا يراه صاحبه لا يُحسم،
-- والملف الذي لا يُقرأ لا يُحدَّث — فيصير أرشيفاً لا أداة.
--
-- الجدول هنا ليس بديلاً عن الوثيقة بل واجهةً لها: البذرة أدناه منقولة من
-- الوثيقة، وما يُحسم هنا يُنقل إليها عند أول تحديث للمشروع.
CREATE TABLE IF NOT EXISTS admin_decisions (
    id          BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title       TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
    note        TEXT CHECK (char_length(note) <= 2000),
    priority    TEXT NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('high', 'normal', 'low')),
    status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'done', 'dropped')),
    due_on      DATE,
    source      TEXT,                       -- مرجعه في الوثائق، مثل T-02
    created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decisions_open
    ON admin_decisions (status, priority, due_on);

ALTER TABLE admin_decisions ENABLE ROW LEVEL SECURITY;

-- القراءة والتحرير للمشرف: البنود تخصّ تشغيل المنصة، ومن يشرف عليها يحتاج
-- أن يراها. أما الحذف فللمدير الأعلى — لأن الحذف يمحو السبب مع البند.
DROP POLICY IF EXISTS decisions_select_admin ON admin_decisions;
CREATE POLICY decisions_select_admin ON admin_decisions
    FOR SELECT TO authenticated USING ((SELECT is_admin()));

DROP POLICY IF EXISTS decisions_insert_admin ON admin_decisions;
CREATE POLICY decisions_insert_admin ON admin_decisions
    FOR INSERT TO authenticated WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS decisions_update_admin ON admin_decisions;
CREATE POLICY decisions_update_admin ON admin_decisions
    FOR UPDATE TO authenticated
    USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS decisions_delete_superadmin ON admin_decisions;
CREATE POLICY decisions_delete_superadmin ON admin_decisions
    FOR DELETE TO authenticated USING ((SELECT is_superadmin()));

CREATE OR REPLACE FUNCTION touch_decision()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    IF NEW.status <> OLD.status AND NEW.status <> 'open' THEN
        NEW.resolved_by := auth.uid();
        NEW.resolved_at := now();
    ELSIF NEW.status = 'open' THEN
        NEW.resolved_by := NULL;
        NEW.resolved_at := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS decisions_touch ON admin_decisions;
CREATE TRIGGER decisions_touch
    BEFORE UPDATE ON admin_decisions
    FOR EACH ROW EXECUTE FUNCTION touch_decision();

-- -----------------------------------------------------------------------------
-- ٦. البذرة — البنود المعلَّقة فعلاً اليوم
-- -----------------------------------------------------------------------------
-- تُدرَج مرةً واحدة. `WHERE NOT EXISTS` تجعل إعادة تشغيل الملف بلا أثر.
INSERT INTO admin_decisions (title, note, priority, source)
SELECT * FROM (VALUES
    ('مصير التسجيلات آخر الفصل الدراسي',
     'حذف؟ أرشفة؟ تسليمها للطالب؟ القرار يمسّ بيانات شخصية ويجب أن يُعلَن للطلاب قبل جمعها لا بعده — وهذا شرط في نصّ الموافقة. راجع docs/PRIVACY-CONSENT.md §4.',
     'high', 'PRIVACY §4'),

    ('تدقيق الترجمة الإندونيسية قبل الفتح للعموم',
     'المترجم مجهول في المصدر (fawazahmed0/hadith-api). مقبول لمقرّر بين زملاء، غير مقبول لمنصة عامة تُنسب إليها ترجمة لا نعرف قائلها. راجع 11-licenses-audit.md.',
     'high', 'T-02'),

    ('مراجعة حدود البلاغات بعد فصل كامل',
     'الحدّ الآن 10 بلاغات/ساعة لكل مستخدم. القرار النهائي يُبنى على العدّ الفعلي من audit_log لا على التقدير.',
     'normal', 'T-14'),

    ('تدقيق translation_en قبل الاعتماد عليها',
     'صارت معروضة للمستخدم بعد F011 بعد أن كانت مخزَّنة بلا عرض، وتغطيتها أقلّ من الإندونيسية.',
     'normal', 'T-15'),

    ('نسخة احتياطية دورية',
     'الخطة المجانية بلا استرجاع زمني (PITR). حذف عارض = ضياع دائم. الأمر في DEPLOY.md §5 ويحتاج تشغيلاً شهرياً.',
     'high', 'REQ-05'),

    ('جدولة الرفع: موعد إغلاق تلقائي وحدّ أقصى للتسجيلات',
     'أُجّل عمداً — بدأنا بالمفتاح اليدوي وحده. يُنفَّذ حين يتبيّن من الاستعمال الفعلي أيّ الآليتين تُحتاج.',
     'low', 'قرار عبد 2026-08-06'),

    ('حذف عمود snippet من search_hadiths()',
     'الواجهة لم تعد تستعمله بعد SRCH-01. يُحذف في v2 بعد التأكّد من عدم وجود مستهلك.',
     'low', 'T-13')
) AS seed(title, note, priority, source)
WHERE NOT EXISTS (SELECT 1 FROM admin_decisions);

-- -----------------------------------------------------------------------------
-- ٧. تحقّق
-- -----------------------------------------------------------------------------
SELECT unnest(enum_range(NULL::user_role))::text AS "الرتب_المتاحة";

SELECT status AS "الحالة", count(*) AS "العدد"
FROM admin_decisions GROUP BY status;

-- بعد هذا الملف: عيّن نفسك مديراً أعلى مرةً واحدة (استبدل البريد إن لزم)
--   UPDATE profiles SET role = 'superadmin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = '2406016105@webmail.uad.ac.id');
