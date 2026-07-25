-- =============================================================================
-- 04-database-schema.sql
-- منصة الحديث الشريف التفاعلية — مخطط قاعدة البيانات الكامل (DDL)
-- Target: Supabase (PostgreSQL 15+)
-- Version: 1.0 | Last Updated: 2026-07-23 | Author: System Analyst AI
-- Source: Derived from 03-data-model.md (SRS v1.0 §4)
--
-- تعليمات التنفيذ: يُنفَّذ هذا الملف مرة واحدة على مشروع Supabase جديد
-- (SQL Editor أو CLI migrations) قبل 05-rls-policies.sql.
-- دوال RPC التفصيلية موثقة في 08-api-contracts.md وتُنشأ في ملف لاحق.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. الإضافات (Extensions)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- 1. الأنواع المخصصة (Enums) — المرجع: 03-data-model.md §7
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE hadith_grade AS ENUM ('sahih', 'hasan', 'daif');
CREATE TYPE hadith_length AS ENUM ('short', 'long');
CREATE TYPE report_reason AS ENUM ('incorrect_recitation', 'poor_quality', 'inappropriate', 'other');
CREATE TYPE report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE content_error_type AS ENUM ('tashkeel', 'translation', 'isnad', 'takhrij', 'other');
CREATE TYPE content_report_status AS ENUM ('open', 'in_progress', 'resolved', 'dismissed');
CREATE TYPE annotation_type AS ENUM ('text', 'audio');
CREATE TYPE annotation_status AS ENUM ('pending', 'approved', 'rejected');

-- -----------------------------------------------------------------------------
-- 2. الهوية والإعدادات
-- -----------------------------------------------------------------------------

-- 2.1 profiles — يمتد من auth.users، يُنشأ تلقائياً بالمشغّل في §7
CREATE TABLE profiles (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name     TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
    role             user_role NOT NULL DEFAULT 'student',
    consent_given_at TIMESTAMPTZ,
    last_active_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 app_settings — كل الثوابت التشغيلية القابلة للتعديل من لوحة التحكم
CREATE TABLE app_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    description TEXT,
    updated_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. المحتوى المرجعي (الهرمية + علم الحديث) — للقراءة فقط من الواجهة
-- -----------------------------------------------------------------------------

CREATE TABLE collections (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name_ar    TEXT NOT NULL,
    name_id    TEXT,
    slug       TEXT NOT NULL UNIQUE,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE books (
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    collection_id INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name_ar       TEXT NOT NULL,
    name_id       TEXT,
    sort_order    INT NOT NULL DEFAULT 0
);

CREATE TABLE chapters (
    id         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    book_id    INT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    name_ar    TEXT NOT NULL,
    name_id    TEXT,
    sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE hadiths (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id     INT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    hadith_number  INT NOT NULL,
    isnad_ar       TEXT NOT NULL,
    matn_ar        TEXT NOT NULL,
    translation_id TEXT,
    grade          hadith_grade,
    explanation    TEXT,
    length_class   hadith_length NOT NULL DEFAULT 'short',
    source_api     TEXT NOT NULL,          -- مثل 'hadithenc' — للتتبع والترخيص
    source_ref     TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (chapter_id, hadith_number)     -- منع ازدواج الترقيم عند إعادة الاستيراد
);

CREATE TABLE word_definitions (
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hadith_id     UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
    word          TEXT NOT NULL,
    definition_ar TEXT NOT NULL,
    definition_id TEXT,
    audio_url     TEXT
);

CREATE TABLE takhrij_references (
    id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hadith_id        UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
    source_book      TEXT NOT NULL,
    reference_number TEXT,
    grade            TEXT
);

-- -----------------------------------------------------------------------------
-- 4. تفاعل المستخدم (التسجيلات + التقييم + الاستماع)
-- -----------------------------------------------------------------------------

CREATE TABLE recordings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hadith_id       UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_path       TEXT NOT NULL,         -- audio/hadith_{id}/user_{id}.opus
    duration_seconds INT NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 180),
    file_size_bytes INT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 5242880),
    codec           TEXT NOT NULL DEFAULT 'opus' CHECK (codec IN ('opus', 'aac')),
    bitrate_kbps    INT NOT NULL CHECK (bitrate_kbps BETWEEN 16 AND 64),
    likes_count     INT NOT NULL DEFAULT 0 CHECK (likes_count >= 0),   -- RPC فقط
    listens_count   INT NOT NULL DEFAULT 0 CHECK (listens_count >= 0), -- RPC فقط
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    verified_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at     TIMESTAMPTZ,
    is_hidden       BOOLEAN NOT NULL DEFAULT false,
    hidden_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (hadith_id, user_id)            -- ALG-004: قاعدة التسجيل الواحد
);

CREATE TABLE likes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recording_id, user_id)         -- إعجاب واحد لكل مستخدم لكل تسجيل
);

CREATE TABLE favorite_recordings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recording_id, user_id)         -- نجمة واحدة لكل زوج؛ بلا حد لكل حديث
);

CREATE TABLE recording_listens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,  -- NULL للزائر
    listened_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recording_id, user_id)         -- ALG-003: احتساب واحد لكل مستخدم
);

-- -----------------------------------------------------------------------------
-- 5. البلاغات (قناتان منفصلتان — F006)
-- -----------------------------------------------------------------------------

CREATE TABLE reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reason       report_reason NOT NULL,
    details      TEXT CHECK (char_length(details) <= 500),
    status       report_status NOT NULL DEFAULT 'open',
    resolved_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (recording_id, reporter_id)     -- بلاغ واحد لكل مستخدم لكل تسجيل
);

CREATE TABLE content_reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hadith_id    UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
    reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    error_type   content_error_type NOT NULL,
    description  TEXT NOT NULL CHECK (char_length(description) <= 1000),
    status       content_report_status NOT NULL DEFAULT 'open',
    resolved_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. annotations — بنية تحتية لمرحلة لاحقة (بلا واجهة في v1)
-- -----------------------------------------------------------------------------
CREATE TABLE annotations (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hadith_id  UUID NOT NULL REFERENCES hadiths(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type       annotation_type NOT NULL,
    content    TEXT,
    file_path  TEXT,
    status     annotation_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((type = 'text' AND content IS NOT NULL) OR (type = 'audio' AND file_path IS NOT NULL))
);

-- -----------------------------------------------------------------------------
-- 7. المشغّلات (Triggers)
-- -----------------------------------------------------------------------------

-- 7.1 تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at   BEFORE UPDATE ON profiles        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_hadiths_updated_at    BEFORE UPDATE ON hadiths         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_recordings_updated_at BEFORE UPDATE ON recordings      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_settings_updated_at   BEFORE UPDATE ON app_settings    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7.2 إنشاء profile تلقائياً عند أول تسجيل دخول (F007 / UC-001)
-- يلتقط الاسم الحقيقي من بيانات Google كاسم عرض مبدئي قابل للتخصيص لاحقاً.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'student'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------------------------------
-- 8. الفهارس (Indexes) — المرجع: 03-data-model.md §6
-- -----------------------------------------------------------------------------
CREATE INDEX idx_books_collection          ON books (collection_id);
CREATE INDEX idx_chapters_book             ON chapters (book_id);
CREATE INDEX idx_hadiths_chapter           ON hadiths (chapter_id, hadith_number);
CREATE INDEX idx_worddefs_hadith           ON word_definitions (hadith_id);
CREATE INDEX idx_takhrij_hadith            ON takhrij_references (hadith_id);
CREATE INDEX idx_recordings_hadith_visible ON recordings (hadith_id) WHERE is_hidden = false;
CREATE INDEX idx_recordings_user           ON recordings (user_id);
CREATE INDEX idx_recordings_likes          ON recordings (hadith_id, likes_count DESC);
CREATE INDEX idx_likes_user                ON likes (user_id);
CREATE INDEX idx_fav_user                  ON favorite_recordings (user_id, recording_id);
CREATE INDEX idx_listens_recording         ON recording_listens (recording_id);
CREATE INDEX idx_reports_status            ON reports (status, created_at DESC);
CREATE INDEX idx_reports_recording         ON reports (recording_id);
CREATE INDEX idx_content_reports_status    ON content_reports (status, created_at DESC);
CREATE INDEX idx_profiles_active           ON profiles (last_active_at);

-- -----------------------------------------------------------------------------
-- 9. البذور (Seeds) — القيم الافتراضية للإعدادات (03-data-model.md §3.14)
-- -----------------------------------------------------------------------------
INSERT INTO app_settings (key, value, description) VALUES
    ('upload_enabled',                'true',  'مفتاح الرفع العام — تعطيل مؤقت لرفع التسجيلات مع بقاء الاستماع'),
    ('report_alert_ratio',            '0.15',  'نسبة عتبة تنبيه الإدارة من الطلاب النشطين'),
    ('report_alert_min',              '2',     'الحد الأدنى المطلق لعتبة التنبيه (بلاغات)'),
    ('report_hide_ratio',             '0.40',  'نسبة عتبة الإخفاء التلقائي من الطلاب النشطين'),
    ('report_hide_min',               '4',     'الحد الأدنى المطلق لعتبة الإخفاء (بلاغات)'),
    ('community_best_min_likes',      '3',     'الحد الأدنى من اللايكات لتفعيل شارة "أفضل تسجيل"'),
    ('active_users_window_days',      '30',    'نافذة احتساب الطلاب النشطين (أيام)'),
    ('rate_limit_uploads_per_hour',   '5',     'الحد الأقصى لرفع التسجيلات في الساعة لكل طالب'),
    ('listen_count_threshold_seconds','5',     'الحد الأدنى لمدة الاستماع المحتسبة (ثوانٍ)');

COMMIT;

-- =============================================================================
-- نهاية المخطط — الخطوة التالية: تنفيذ 05-rls-policies.sql
-- =============================================================================
