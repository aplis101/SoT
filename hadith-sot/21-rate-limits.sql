-- =============================================================================
-- 21-rate-limits.sql — تحديد معدل البلاغات
-- منصة الحديث الشريف | Version 1.0 | 2026-08-06
--
-- الثغرة التي يسدّها هذا الملف (SEC-09)
-- -----------------------------------------------------------------------------
-- سياسة `bugs_insert_any` في 07-bug-reports.sql تسمح للزائر غير المسجَّل
-- بالإدراج، وهذا قرار صحيح ومقصود: «إن انهارت المنصة قبل تسجيل الدخول فلن
-- يستطيع أحد الإبلاغ عنها». لكنها بلا حدّ للمعدّل تعني أن أي متصفّح يستطيع
-- إدراج آلاف الصفوف في دقيقة واحدة بحلقة `fetch` بسيطة — والمفتاح `anon`
-- مكشوف بالتصميم، فالمهاجم لا يحتاج اختراق شيء.
--
-- الأثر ليس نظرياً: الخطة المجانية في Supabase ٥٠٠MB قاعدةً و٥GB خروجاً.
-- إغراق الجدول يملأ الحصة فتتوقف الكتابة عن **كل** المنصة — لا البلاغات
-- وحدها — فينهار رفع التسجيلات وتضيع أعمال الطلاب. تعطيل خدمة لا تسريب.
--
-- لماذا الحدّ في القاعدة لا في الواجهة
-- -----------------------------------------------------------------------------
-- أي حدّ في المتصفح (عدّاد، مؤقّت، `localStorage`) يُتجاوَز بفتح أدوات المطوّر
-- أو باستدعاء REST مباشرةً بلا متصفح أصلاً. قاعدة المشروع صريحة:
-- «RLS هو الحارس الأمني لا كود الواجهة» (CLAUDE.md). الحدّ هنا مشغّل
-- `BEFORE INSERT` لا يمكن تخطّيه من أي عميل.
--
-- الواجهة تبقى مسؤولة عن **الرسالة اللطيفة** لا عن المنع.
--
-- الحدود المختارة ولماذا
-- -----------------------------------------------------------------------------
-- المعيار: ما أقصى عدد يبلّغه إنسانٌ صادق في ساعة؟ طالب يجد ثلاثة أخطاء
-- تشكيل في جلسة مراجعة أمرٌ وارد؛ عشرون في الساعة ليست سلوك إنسان يقرأ.
--
--   bug_reports     مسجَّل: ١٠/ساعة    زائر (إجمالي): ٤٠/ساعة
--   content_reports مسجَّل: ٢٠/ساعة    (لا زائر — يتطلّب دخولاً)
--   reports         مسجَّل: ٢٠/ساعة    (ومحمي أصلاً بـUNIQUE لكل تسجيل)
--
-- الزائر يُحدَّد إجمالياً لا فردياً: لا هوية له نميّزها، وPostgres لا يرى
-- عنوان IP خلف PostgREST. الحدّ الإجمالي يقبل ضرراً صغيراً (زائر مزعج قد
-- يمنع زائراً آخر ساعةً) مقابل منع الضرر الكبير (امتلاء القاعدة). والمسجَّل
-- لا يتأثر بحدّ الزائر إطلاقاً، فباب البلاغ يبقى مفتوحاً لمن سجّل دخوله.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- ١. جدول الحدود — قابل للضبط بلا نشر جديد
-- -----------------------------------------------------------------------------
-- لو ثبتنا الأرقام في نصّ الدالة لاحتاج كل تعديل هجرةً جديدة. المشرف قد
-- يحتاج رفع الحدّ يوم تسليم الواجب حين يبلّغ عشرون طالباً معاً.
CREATE TABLE IF NOT EXISTS rate_limits (
    table_name   TEXT PRIMARY KEY,
    per_user     INT  NOT NULL CHECK (per_user > 0),
    per_anon_all INT  NOT NULL CHECK (per_anon_all > 0),
    window_secs  INT  NOT NULL DEFAULT 3600 CHECK (window_secs > 0),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO rate_limits (table_name, per_user, per_anon_all) VALUES
    ('bug_reports',     10, 40),
    ('content_reports', 20,  1),   -- الزائر لا يصل إليه أصلاً (RLS)
    ('reports',         20,  1)
ON CONFLICT (table_name) DO NOTHING;

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- القراءة للمشرف وحدها: الحدود معلومة تشغيلية تفيد من يريد الالتفاف عليها.
DROP POLICY IF EXISTS rate_limits_read_admin ON rate_limits;
CREATE POLICY rate_limits_read_admin ON rate_limits
    FOR SELECT TO authenticated USING ((SELECT is_admin()));

DROP POLICY IF EXISTS rate_limits_write_admin ON rate_limits;
CREATE POLICY rate_limits_write_admin ON rate_limits
    FOR UPDATE TO authenticated
    USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- -----------------------------------------------------------------------------
-- ٢. المشغّل العام
-- -----------------------------------------------------------------------------
-- TG_ARGV[0] = اسم عمود صاحب البلاغ في الجدول (user_id أو reporter_id).
--
-- SECURITY DEFINER لازمة: العدّ يجب أن يرى **كل** الصفوف الحديثة، بينما RLS
-- تُخفي عن المستخدم بلاغات غيره. بلا هذا لكان الحدّ الإجمالي للزائر صفراً
-- دائماً (الزائر لا يقرأ شيئاً) فيمرّ كل إدراج.
-- `SET search_path = public` تسدّ اختطاف المسار — وهو الخطر الملازم لـDEFINER.
CREATE OR REPLACE FUNCTION enforce_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_col     TEXT := TG_ARGV[0];
    v_uid     UUID := auth.uid();
    v_owner   UUID;
    v_lim     rate_limits%ROWTYPE;
    v_count   INT;
    v_since   TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_lim FROM rate_limits WHERE table_name = TG_TABLE_NAME;
    IF NOT FOUND THEN RETURN NEW; END IF;   -- جدول بلا حدّ مضبوط: لا نمنع

    v_since := now() - make_interval(secs => v_lim.window_secs);

    -- صاحب الصفّ المُدرَج. نقرأه عبر to_jsonb لا عبر EXECUTE على السجلّ:
    -- تمرير NEW كمعامل في SQL ديناميكي يعتمد على تسجيل نوع الجدول المركَّب،
    -- وهو سلوك هشّ يختلف بين الإصدارات. to_jsonb يعمل على أي جدول بلا شروط.
    v_owner := NULLIF(to_jsonb(NEW) ->> v_col, '')::UUID;
    -- auth.uid() أوثق من الحقل المُرسَل: العميل يملك ما يكتبه في الصفّ
    IF v_uid IS NOT NULL THEN v_owner := v_uid; END IF;

    IF v_owner IS NOT NULL THEN
        EXECUTE format(
            'SELECT count(*) FROM public.%I WHERE %I = $1 AND created_at > $2',
            TG_TABLE_NAME, v_col
        ) INTO v_count USING v_owner, v_since;

        IF v_count >= v_lim.per_user THEN
            RAISE EXCEPTION
                'وصلت الحدّ الأقصى للبلاغات (% في الساعة). بلاغاتك السابقة وصلت ولم تضع — انتظر قليلاً ثم أرسل البقية.',
                v_lim.per_user
                USING ERRCODE = 'check_violation', HINT = 'rate_limit_user';
        END IF;
    ELSE
        -- زائر غير مسجَّل — حدّ إجمالي على كل الزوار
        EXECUTE format(
            'SELECT count(*) FROM public.%I WHERE %I IS NULL AND created_at > $1',
            TG_TABLE_NAME, v_col
        ) INTO v_count USING v_since;

        IF v_count >= v_lim.per_anon_all THEN
            RAISE EXCEPTION
                'تعذّر استقبال البلاغ الآن — وصلت بلاغات الزوّار حدّها في هذه الساعة. سجّل دخولك ليصل بلاغك فوراً، أو أعد المحاولة بعد قليل.'
                USING ERRCODE = 'check_violation', HINT = 'rate_limit_anon';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- ٣. حارس التكرار — الإرسال المزدوج بالنقر المتعجّل
-- -----------------------------------------------------------------------------
-- أكثر التكرار عندنا ليس هجوماً بل مستخدماً ضغط «إرسال» مرتين لأن الشبكة
-- بطؤت. حجبه يحمي قائمة المشرف من الازدواج ولا يكلّف المستخدم شيئاً.
CREATE OR REPLACE FUNCTION block_duplicate_bug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM bug_reports
        WHERE message = NEW.message
          AND user_id IS NOT DISTINCT FROM NEW.user_id
          AND created_at > now() - interval '5 minutes'
    ) THEN
        RAISE EXCEPTION 'هذا البلاغ وصل قبل قليل — لا حاجة لإرساله مرةً أخرى.'
            USING ERRCODE = 'check_violation', HINT = 'duplicate_report';
    END IF;
    RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- ٤. الربط
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS bug_reports_rate_limit     ON bug_reports;
DROP TRIGGER IF EXISTS bug_reports_no_duplicate   ON bug_reports;
DROP TRIGGER IF EXISTS content_reports_rate_limit ON content_reports;
DROP TRIGGER IF EXISTS reports_rate_limit         ON reports;

CREATE TRIGGER bug_reports_rate_limit
    BEFORE INSERT ON bug_reports
    FOR EACH ROW EXECUTE FUNCTION enforce_rate_limit('user_id');

CREATE TRIGGER bug_reports_no_duplicate
    BEFORE INSERT ON bug_reports
    FOR EACH ROW EXECUTE FUNCTION block_duplicate_bug();

CREATE TRIGGER content_reports_rate_limit
    BEFORE INSERT ON content_reports
    FOR EACH ROW EXECUTE FUNCTION enforce_rate_limit('reporter_id');

CREATE TRIGGER reports_rate_limit
    BEFORE INSERT ON reports
    FOR EACH ROW EXECUTE FUNCTION enforce_rate_limit('reporter_id');

-- الفهارس التي يقف عليها العدّ — بلا هذه يصير كل إدراج مسحاً كاملاً للجدول
CREATE INDEX IF NOT EXISTS idx_bug_rate     ON bug_reports     (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_anon     ON bug_reports     (created_at DESC) WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_creport_rate ON content_reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_rate  ON reports         (reporter_id, created_at DESC);

COMMIT;

-- -----------------------------------------------------------------------------
-- ٥. تحقّق يدوي
-- -----------------------------------------------------------------------------
-- شغّل هذا مرّتين متتاليتين: الثانية يجب أن تُرفض برسالة «وصل قبل قليل».
--
--   INSERT INTO bug_reports (kind, message) VALUES ('bug', 'تجربة حدّ المعدل');
--
SELECT table_name AS "الجدول", per_user AS "للمسجَّل/ساعة",
       per_anon_all AS "للزوّار إجمالاً/ساعة"
FROM rate_limits ORDER BY table_name;
