-- =============================================================================
-- 05-rls-policies.sql
-- منصة الحديث الشريف التفاعلية — سياسات Row Level Security (SQL فعلي جاهز للتنفيذ)
-- Target: Supabase (PostgreSQL 15+)
-- Version: 1.0 | Last Updated: 2026-07-23 | Author: System Analyst AI
-- Source: Derived from SRS v1.0 §7 (Permissions) + §9 من SoT-0
--
-- المبادئ الحاكمة:
--   1) RLS مفعّل على كل جدول بلا استثناء.
--   2) SELECT على المحتوى المرجعي والتسجيلات الظاهرة: متاح للجميع (زائر وموثّق).
--   3) INSERT: للموثقين فقط، ومقيّد بشروط العمل (موافقة، مفتاح رفع، ملكية).
--   4) UPDATE/DELETE: للمالك أو المشرف فقط.
--   5) عدّادات التسجيلات: لا تُعدَّل مباشرة — عبر RPC SECURITY DEFINER فقط.
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
CREATE POLICY profiles_select_public ON profiles
    FOR SELECT USING (true);

-- تحديث: المستخدم يعدّل ملفه فقط، وممنوع يغيّر دوره بنفسه.
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (auth.uid() = id)
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
    FOR SELECT USING (
        is_hidden = false
        OR auth.uid() = user_id
        OR is_admin()
    );

-- إدراج: موثّق + موافقة صريحة + مفتاح الرفع العام مفعّل + لنفسه فقط.
CREATE POLICY recordings_insert_student ON recordings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND has_upload_consent()
        AND get_setting_bool('upload_enabled', true) = true
    );

-- تحديث: ممنوع مباشرة من العميل (العدّادات والاعتماد والإخفاء عبر RPCs فقط).
-- استثناء وحيد: لا يوجد. أي تعديل يتم عبر SECURITY DEFINER functions.

-- حذف: المالك في أي وقت (UC-009)، أو المشرف مطلقاً (F008).
CREATE POLICY recordings_delete_owner_or_admin ON recordings
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

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
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY likes_delete_own ON likes
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. favorite_recordings — خاص بحت (ALG-006)
-- -----------------------------------------------------------------------------
ALTER TABLE favorite_recordings ENABLE ROW LEVEL SECURITY;

-- كل مستخدم يرى ويدير نجومه الخاصة فقط — لا قراءة عامة.
CREATE POLICY favorites_select_own ON favorite_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY favorites_insert_own ON favorite_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY favorites_delete_own ON favorite_recordings
    FOR DELETE USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. recording_listens
-- -----------------------------------------------------------------------------
ALTER TABLE recording_listens ENABLE ROW LEVEL SECURITY;

-- قراءة: المستخدم يرى سجلات استماعه (لمعرفة ما احتُسب له)؛ المشرف يرى الكل.
CREATE POLICY listens_select_own_or_admin ON recording_listens
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- إدراج: المستخدم لنفسه فقط (ويُفضَّل عبر RPC register_listen للذرّية مع العدّاد).
CREATE POLICY listens_insert_own ON recording_listens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- لا UPDATE/DELETE.

-- -----------------------------------------------------------------------------
-- 7. reports (بلاغات الصوت)
-- -----------------------------------------------------------------------------
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- قراءة: المشرف يرى الكل؛ المبلِّغ يرى بلاغاته فقط (لمتابعة حالتها).
CREATE POLICY reports_select_admin_or_reporter ON reports
    FOR SELECT USING (is_admin() OR auth.uid() = reporter_id);

-- إدراج: موثّق يبلّغ بنفسه.
CREATE POLICY reports_insert_authenticated ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- تحديث (المعالجة): المشرف فقط.
CREATE POLICY reports_update_admin ON reports
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- 8. content_reports (بلاغات المحتوى)
-- -----------------------------------------------------------------------------
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_reports_select_admin_or_reporter ON content_reports
    FOR SELECT USING (is_admin() OR auth.uid() = reporter_id);

CREATE POLICY content_reports_insert_authenticated ON content_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY content_reports_update_admin ON content_reports
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- -----------------------------------------------------------------------------
-- 9. app_settings
-- -----------------------------------------------------------------------------
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- قراءة: الجميع (الواجهة تحتاج upload_enabled وحدود الشارة… إلخ).
CREATE POLICY settings_select_all ON app_settings
    FOR SELECT USING (true);

-- تعديل: المشرف فقط (UC-013) — يُفضَّل عبر RPC admin_update_setting لتسجيل updated_by.
CREATE POLICY settings_update_admin ON app_settings
    FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- لا INSERT/DELETE: المفاتيح ثابتة المعروفة من البذور.

-- -----------------------------------------------------------------------------
-- 10. annotations (مرحلة لاحقة — مقفلة حتى التفعيل الرسمي)
-- -----------------------------------------------------------------------------
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;

-- قراءة: المعتمدة فقط للجميع؛ غير المعتمدة للمالك والمشرف.
CREATE POLICY annotations_select_policy ON annotations
    FOR SELECT USING (
        status = 'approved'
        OR auth.uid() = user_id
        OR is_admin()
    );

-- إدراج: موثّق لنفسه (يبقى pending حتى اعتماد المشرف).
CREATE POLICY annotations_insert_own ON annotations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- تحديث/حذف: المالك أو المشرف.
CREATE POLICY annotations_update_owner_or_admin ON annotations
    FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY annotations_delete_owner_or_admin ON annotations
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

COMMIT;

-- =============================================================================
-- نهاية سياسات RLS — الخطوة التالية: دوال RPC في 08-api-contracts.md
-- =============================================================================
