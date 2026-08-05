-- =============================================================================
-- 07-bug-reports.sql
-- منصة الحديث الشريف — قناة بلاغات المشاكل التقنية (F009)
-- Version: 1.0 | 2026-08-06
--
-- لماذا جدول منفصل عن reports و content_reports؟
--   reports          → بلاغ عن تسجيل صوتي لطالب (إشراف تربوي)
--   content_reports  → بلاغ عن خطأ في نصّ حديث (تصحيح علمي)
--   bug_reports      → بلاغ عن عطل في المنصة نفسها (صيانة تقنية)
-- خلطها يجعل قائمة المشرف بلا معنى، ولكلٍّ دورة حياة وحقول مختلفة.
--
-- الخصوصية: التشخيص التلقائي يجمع بيانات تقنية فقط (المسار، المتصفح، الأخطاء).
--   لا يجمع نصّ ما كتبه المستخدم في الحقول، ولا موقعه، ولا أي بيانات شخصية
--   غير معرّفه إن كان مسجّلاً — وهذا معلَن له صراحةً في نموذج البلاغ.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS bug_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL للزائر
    kind        TEXT NOT NULL DEFAULT 'bug'
                CHECK (kind IN ('bug', 'idea', 'content', 'other')),
    message     TEXT NOT NULL CHECK (char_length(message) BETWEEN 5 AND 2000),

    -- سياق تقني يُجمع تلقائياً — يختصر رحلة تشخيص كاملة
    page_url    TEXT,
    user_agent  TEXT,
    app_version TEXT,
    viewport    TEXT,
    diagnostics JSONB,     -- آخر أخطاء الطرفية ووعود مرفوضة
    error_stack TEXT,      -- يُملأ حين يأتي البلاغ من شاشة الانهيار

    status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'triaged', 'fixed', 'wontfix')),
    admin_note  TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bug_status ON bug_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_user   ON bug_reports (user_id);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- إدراج: للجميع بمن فيهم الزائر.
-- السبب: إن انهارت المنصة قبل تسجيل الدخول فلن يستطيع أحد الإبلاغ عنها —
-- وهذه بالضبط الحالة التي نحتاج فيها البلاغ أكثر من غيرها.
CREATE POLICY bugs_insert_any ON bug_reports
    FOR INSERT TO authenticated, anon WITH CHECK (true);

-- قراءة: المشرف يرى الكل، والمستخدم يرى بلاغاته لمتابعة حالتها.
CREATE POLICY bugs_select_own_or_admin ON bug_reports
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR (SELECT is_admin()));

-- تحديث الحالة: المشرف فقط.
CREATE POLICY bugs_update_admin ON bug_reports
    FOR UPDATE TO authenticated
    USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

COMMIT;

SELECT 'bug_reports ready' AS done;
