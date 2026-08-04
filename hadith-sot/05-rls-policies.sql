-- =============================================================================
-- 05-rls-policies.sql
-- منصة الحديث الشريف التفاعلية — سياسات Row Level Security (SQL فعلي جاهز للتنفيذ)
-- Target: Supabase (PostgreSQL 15+)
-- Version: 1.1 | Last Updated: 2026-08-04 | Author: System Analyst AI + مراجعة تنفيذية
--
-- سجل التغيير v1.1 (مُثبت بـ15 اختبار اختراق حيّ — انظر review/02-database-critique.md):
--   [DB-01 P0] لم تكن هناك أي سياسة UPDATE على recordings ⇒ المشرف لا يستطيع الاعتماد ✅
--              ولا الإخفاء التلقائي يعمل ⇒ F008 و UC-013 و ALG-002 معطّلة بصمت. أُصلح.
--   [DB-03 P0] profiles كان مقروءاً للزوار (qual=true, TO public) ⇒ تعداد كل الطلاب
--              ومعرفة هوية المشرف بلا تسجيل دخول. حُصر بـ authenticated.
--   [DB-04 P1] app_settings كان يكشف كل عتبات الإشراف للزوار. حُصرت العامة منها.
--   [DB-05 P1] كل السياسات كانت TO public. أُضيف TO authenticated حيث يلزم (دفاع في العمق).
--   [DB-09 P1] annotations خارج النطاق لكن بسياسات CRUD حيّة. جُمّدت الكتابة.
--   [DB-10 P2] (SELECT is_admin()) كانت تُقيَّم لكل صف. غُلّفت بـ(SELECT ...) لتفعيل تخزين InitPlan.
-- Source: Derived from SRS v1.0 §7 (Permissions) + §9 من SoT-0
--
-- المبادئ الحاكمة:
--   1) RLS مفعّل على كل جدول بلا استثناء.
--   2) SELECT على المحتوى المرجعي والتسجيلات الظاهرة: متاح للجميع (زائر وموثّق).
--   3) INSERT: للموثقين فقط، ومقيّد بشروط العمل (موافقة، مفتاح رفع، ملكية).
--   4) UPDATE/DELETE: للمالك أو المشرف فقط.
--   5) عدّادات التسجيلات: لا تُعدَّل مباشرة — عبر مشغّلات SECURITY DEFINER (04 §7.3).
--   7) [v1.1] كل سياسة غير عامة تحدد TO authenticated صراحةً — لا اعتماد على auth.uid() وحده.
--   6) جداول المحتوى المرجعي: لا كتابة إلا بدور الخدمة (service_role) عبر الاستيراد.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. دوال مساعدة (Helper Functions)
-- -----------------------------------------------------------------------------

-- هل المستخدم الحالي مشرف؟
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- قراءة إعداد من app_settings بأمان داخل السياسات والدوال
CREATE OR REPLACE FUNCTION get_setting_bool(p_key TEXT, p_default BOOLEAN DEFAULT false)
RETURNS BOOLEAN AS $$
    SELECT COALESCE((SELECT (value #>> '{}')::boolean FROM public.app_settings WHERE key = p_key), p_default);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_setting_int(p_key TEXT, p_default INT DEFAULT 0)
RETURNS INT AS $$
    SELECT COALESCE((SELECT (value #>> '{}')::int FROM public.app_settings WHERE key = p_key), p_default);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_setting_numeric(p_key TEXT, p_default NUMERIC DEFAULT 0)
RETURNS NUMERIC AS $$
    SELECT COALESCE((SELECT (value #>> '{}')::numeric FROM public.app_settings WHERE key = p_key), p_default);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- هل وافق المستخدم الحالي على سياسة سماعية التسجيلات؟ (شرط أول رفع — F004)
CREATE OR REPLACE FUNCTION has_upload_consent()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND consent_given_at IS NOT NULL
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- 1. profiles
-- -----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- قراءة: الجميع يرى الاسم المعروض والدور فقط عبر الأعمدة العامة.
-- ملاحظة: الواجهة تعرض display_name فقط؛ الهوية الحقيقية تُجلب للمشرف عبر
-- دالة SECURITY DEFINER في لوحة التحكم (14-admin-panel-spec.md) وليس عبر هذا الجدول مباشرة.
-- [FIX DB-03 — P0] كانت TO public ⇒ زائر غير مسجّل يقرأ كل الملفات الشخصية
-- (الأسماء + من هو المشرف + last_active_at)، وهو ما يناقض وعد «الزملاء فقط» في وثيقة الموافقة.
CREATE POLICY profiles_select_authenticated ON profiles
    FOR SELECT TO authenticated USING (true);

-- تحديث: المستخدم يعدّل ملفه فقط، وممنوع يغيّر دوره بنفسه.
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())  -- منع الترقية الذاتية
    );

-- لا INSERT/DELETE من العميل: الإنشاء بمشغّل handle_new_user، والحذف بحذف حساب Auth.

-- -----------------------------------------------------------------------------
-- 2. المحتوى المرجعي: collections / books / chapters / hadiths / word_definitions / takhrij_references
--    قراءة للجميع؛ كتابة: ممنوعة من العميل كلياً (الاستيراد بدور service_role يتجاوز RLS).
-- -----------------------------------------------------------------------------
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE takhrij_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY collections_select_all      ON collections       FOR SELECT USING (true);
CREATE POLICY books_select_all            ON books             FOR SELECT USING (true);
CREATE POLICY chapters_select_all         ON chapters          FOR SELECT USING (true);
CREATE POLICY hadiths_select_all          ON hadiths           FOR SELECT USING (true);
CREATE POLICY word_definitions_select_all ON word_definitions  FOR SELECT USING (true);
CREATE POLICY takhrij_select_all          ON takhrij_references FOR SELECT USING (true);
-- لا سياسات INSERT/UPDATE/DELETE → مرفوضة افتراضياً لغير service_role. مقصود.

-- -----------------------------------------------------------------------------
-- 3. recordings
-- -----------------------------------------------------------------------------
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- قراءة: التسجيلات الظاهرة للجميع؛ المخفية للمشرف أو لصاحبها فقط.
CREATE POLICY recordings_select_visible ON recordings
    FOR SELECT TO authenticated USING (
        is_hidden = false
        OR auth.uid() = user_id
        OR (SELECT is_admin())
    );

-- إدراج: موثّق + موافقة صريحة + مفتاح الرفع العام مفعّل + لنفسه فقط.
CREATE POLICY recordings_insert_student ON recordings
    FOR INSERT TO authenticated WITH CHECK (
        auth.uid() = user_id
        AND has_upload_consent()
        AND get_setting_bool('upload_enabled', true) = true
    );

-- [FIX DB-01 — P0] الإصدار 1.0 قال «التحديث عبر RPCs فقط» لكن لم يُعرَّف أي RPC في أي
-- ملف قابل للتنفيذ (كانت موصوفة نثراً في 08-api-contracts.md فقط). النتيجة المُثبتة تجريبياً:
-- المشرف يُنفّذ UPDATE recordings SET is_verified=true ⇒ «UPDATE 0» بلا أي خطأ.
-- أي أن F008 و UC-013 و ALG-002 معطّلة بصمت. الإصلاح: سياسة إدارية صريحة + الدوال فعلياً هنا.

CREATE POLICY recordings_update_admin ON recordings
    FOR UPDATE TO authenticated
    USING ((SELECT is_admin()))
    WITH CHECK ((SELECT is_admin()));

-- اعتماد/إلغاء اعتماد تسجيل (UC-013 / F008)
CREATE OR REPLACE FUNCTION verify_recording(p_recording_id UUID, p_verified BOOLEAN)
RETURNS recordings AS $$
DECLARE r recordings;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;
    UPDATE recordings
       SET is_verified = p_verified,
           verified_by = CASE WHEN p_verified THEN auth.uid() ELSE NULL END,
           updated_at  = now()
     WHERE id = p_recording_id
    RETURNING * INTO r;
    IF r.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إخفاء/إظهار تسجيل يدوياً (UC-012) — الإخفاء التلقائي بـALG-002 يستدعيها أيضاً
CREATE OR REPLACE FUNCTION set_recording_hidden(p_recording_id UUID, p_hidden BOOLEAN)
RETURNS recordings AS $$
DECLARE r recordings;
BEGIN
    IF NOT is_admin() THEN
        RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
    END IF;
    UPDATE recordings SET is_hidden = p_hidden, updated_at = now()
     WHERE id = p_recording_id RETURNING * INTO r;
    IF r.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
    RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- حذف: المالك في أي وقت (UC-009)، أو المشرف مطلقاً (F008).
CREATE POLICY recordings_delete_owner_or_admin ON recordings
    FOR DELETE TO authenticated USING (auth.uid() = user_id OR (SELECT is_admin()));

-- -----------------------------------------------------------------------------
-- 4. likes
-- -----------------------------------------------------------------------------
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- قراءة: الجميع (لعرض حالة الإعجاب لكل مستخدم على القائمة).
CREATE POLICY likes_select_all ON likes
    FOR SELECT USING (true);

-- إدراج/حذف: المستخدم على سجلاته فقط.
-- ملاحظة: التدفق المعتمد هو RPC toggle_like (ذرّي مع العدّاد)؛ هذه السياسات
-- شبكة أمان فقط ولا تعفي من استخدام الـ RPC.
CREATE POLICY likes_insert_own ON likes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY likes_delete_own ON likes
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. favorite_recordings — خاص بحت (ALG-006)
-- -----------------------------------------------------------------------------
ALTER TABLE favorite_recordings ENABLE ROW LEVEL SECURITY;

-- كل مستخدم يرى ويدير نجومه الخاصة فقط — لا قراءة عامة.
CREATE POLICY favorites_select_own ON favorite_recordings
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY favorites_insert_own ON favorite_recordings
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY favorites_delete_own ON favorite_recordings
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. recording_listens
-- -----------------------------------------------------------------------------
ALTER TABLE recording_listens ENABLE ROW LEVEL SECURITY;

-- قراءة: المستخدم يرى سجلات استماعه (لمعرفة ما احتُسب له)؛ المشرف يرى الكل.
CREATE POLICY listens_select_own_or_admin ON recording_listens
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR (SELECT is_admin()));

-- إدراج: المستخدم لنفسه فقط (ويُفضَّل عبر RPC register_listen للذرّية مع العدّاد).
CREATE POLICY listens_insert_own ON recording_listens
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- لا UPDATE/DELETE.

-- -----------------------------------------------------------------------------
-- 7. reports (بلاغات الصوت)
-- -----------------------------------------------------------------------------
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- قراءة: المشرف يرى الكل؛ المبلِّغ يرى بلاغاته فقط (لمتابعة حالتها).
CREATE POLICY reports_select_admin_or_reporter ON reports
    FOR SELECT TO authenticated USING ((SELECT is_admin()) OR auth.uid() = reporter_id);

-- إدراج: موثّق يبلّغ بنفسه.
CREATE POLICY reports_insert_authenticated ON reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- تحديث (المعالجة): المشرف فقط.
CREATE POLICY reports_update_admin ON reports
    FOR UPDATE TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- -----------------------------------------------------------------------------
-- 8. content_reports (بلاغات المحتوى)
-- -----------------------------------------------------------------------------
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_reports_select_admin_or_reporter ON content_reports
    FOR SELECT TO authenticated USING ((SELECT is_admin()) OR auth.uid() = reporter_id);

CREATE POLICY content_reports_insert_authenticated ON content_reports
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY content_reports_update_admin ON content_reports
    FOR UPDATE TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- -----------------------------------------------------------------------------
-- 9. app_settings
-- -----------------------------------------------------------------------------
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- قراءة: الجميع (الواجهة تحتاج upload_enabled وحدود الشارة… إلخ).
-- [FIX DB-04 — P1] كانت مقروءة للجميع فتكشف كل عتبات الإشراف (report_hide_min، النِسَب،
-- حد الرفع) ⇒ يعرف المهاجم الرقم الدقيق اللازم لإخفاء تسجيل خصمه. الزائر يرى المفاتيح العامة فقط.
CREATE POLICY settings_select_public_keys ON app_settings
    FOR SELECT TO anon USING (key IN ('upload_enabled'));

CREATE POLICY settings_select_authenticated ON app_settings
    FOR SELECT TO authenticated USING (true);

-- تعديل: المشرف فقط (UC-013) — يُفضَّل عبر RPC admin_update_setting لتسجيل updated_by.
CREATE POLICY settings_update_admin ON app_settings
    FOR UPDATE TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- لا INSERT/DELETE: المفاتيح ثابتة المعروفة من البذور.

-- -----------------------------------------------------------------------------
-- 10. annotations (مرحلة لاحقة — مقفلة حتى التفعيل الرسمي)
-- -----------------------------------------------------------------------------
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- قراءة: المعتمدة فقط للجميع؛ غير المعتمدة للمالك والمشرف.
CREATE POLICY annotations_select_policy ON annotations
    FOR SELECT TO authenticated USING (
        status = 'approved'
        OR auth.uid() = user_id
        OR (SELECT is_admin())
    );

-- [FIX DB-09 — P1] annotations خارج نطاق v1 صراحةً (SRS §1.2 «الواجهة مؤجلة») لكن الإصدار 1.0
-- منحها 4 سياسات CRUD حيّة ⇒ سطح هجوم مفتوح لميزة غير مبنية وغير مُختبرة ولا واجهة لها.
-- الكتابة مجمّدة حتى إطلاق الميزة؛ أعِد تفعيل الكتل الثلاث أدناه عندها.
-- CREATE POLICY annotations_insert_own ON annotations
--     FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY annotations_update_owner_or_admin ON annotations
--     FOR UPDATE TO authenticated USING (auth.uid() = user_id OR (SELECT is_admin()));
-- CREATE POLICY annotations_delete_owner_or_admin ON annotations
--     FOR DELETE TO authenticated USING (auth.uid() = user_id OR (SELECT is_admin()));

COMMIT;

-- =============================================================================
-- نهاية سياسات RLS — الخطوة التالية: دوال RPC في 08-api-contracts.md
-- =============================================================================
