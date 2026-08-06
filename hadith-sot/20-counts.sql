-- =============================================================================
-- 20-counts.sql — عدّادات الأحاديث المحفوظة في القاعدة
-- منصة الحديث الشريف | Version 1.0 | 2026-08-06
--
-- الخلل الذي يعالجه هذا الملف (UI-07)
-- -----------------------------------------------------------------------------
-- كانت الصفحة الرئيسية تعرض «٠ حديث» تحت كل مجموعة رغم أن عدد الكتب صحيح.
-- السبب لم يكن في البيانات: بعد [FIX PERF-01] صار `loadContent()` يجلب
-- الهرمية وحدها (مجموعات/كتب/أبواب ≈ 800 صف) ولا يجلب الأحاديث — بينما بقي
-- العدّاد في الواجهة يحسب طول مصفوفة `hadiths` التي صارت فارغةً بالتصميم.
--
-- ولم يظهر الخلل في أي بناء ولا فحص أنواع: الشيفرة صحيحة نحوياً، والمصفوفة
-- فارغة فعلاً، والصفر عددٌ مشروع. لم يظهر إلا بفتح الموقع والنظر — وهذا نصّ
-- قاعدة المشروع: «تحقّق بالتشغيل الفعلي لا بالقراءة» (CLAUDE.md).
--
-- لماذا العدّ في القاعدة لا في المتصفح
-- -----------------------------------------------------------------------------
-- البديل الوحيد لعرض العدد في الواجهة هو جلب ٣٥٬٧٩٨ حديثاً (~67MB) عند كل
-- فتحة — أي إعادة الخلل الذي أصلحه PERF-01 بالضبط. العدد رقمٌ واحد؛ حسابه
-- في القاعدة وتخزينه يجعل كلفته صفراً على الشبكة.
--
-- عمود محفوظ لا VIEW: الأعمدة تسافر مع `select *` القائم في طبقة `repo`،
-- فلا تحتاج الواجهة رحلةً ثانية ولا استعلاماً جديداً. والمحتوى شبه ساكن
-- (يُستورد مرةً ويُعدّله المشرف نادراً) فكلفة التحديث لا تُذكر.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- ١. الأعمدة
-- -----------------------------------------------------------------------------
-- NOT NULL DEFAULT 0 لا NULL: الصفر هنا حقيقة (باب بلا أحاديث) لا «مجهول».
-- الواجهة يجب ألا تُجبَر على التمييز بينهما.
ALTER TABLE chapters    ADD COLUMN IF NOT EXISTS hadith_count INT NOT NULL DEFAULT 0;
ALTER TABLE books       ADD COLUMN IF NOT EXISTS hadith_count INT NOT NULL DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS hadith_count INT NOT NULL DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS book_count   INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN chapters.hadith_count    IS 'عدد أحاديث الباب — يُحدَّث بمشغّل، لا يُكتب يدوياً (20-counts.sql)';
COMMENT ON COLUMN books.hadith_count       IS 'مجموع أحاديث أبواب الكتاب — يُحدَّث بمشغّل';
COMMENT ON COLUMN collections.hadith_count IS 'مجموع أحاديث كتب المجموعة — يُحدَّث بمشغّل';
COMMENT ON COLUMN collections.book_count   IS 'عدد كتب المجموعة — يُحدَّث بمشغّل';

-- -----------------------------------------------------------------------------
-- ٢. إعادة الحساب الكاملة
-- -----------------------------------------------------------------------------
-- تُبنى من الأسفل إلى الأعلى فتبقى المستويات الثلاثة متّسقة دائماً: لا يمكن
-- أن يكون مجموع الكتب مخالفاً لمجموع الأبواب لأن أحدهما مشتقّ من الآخر.
--
-- SECURITY DEFINER لأنها تُستدعى من مشغّل قد يعمل بصلاحية مستخدم لا يملك
-- حقّ الكتابة على `collections` — والمشغّل ليس مدخلاً للمستخدم أصلاً.
CREATE OR REPLACE FUNCTION recount_hadiths()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH per_chapter AS (
        SELECT c.id, COUNT(h.id) AS n
        FROM chapters c LEFT JOIN hadiths h ON h.chapter_id = c.id
        GROUP BY c.id
    ), up_ch AS (
        UPDATE chapters c SET hadith_count = p.n
        FROM per_chapter p WHERE c.id = p.id AND c.hadith_count IS DISTINCT FROM p.n
        RETURNING 1
    ), per_book AS (
        SELECT b.id, COALESCE(SUM(pc.n), 0)::INT AS n, COUNT(pc.id) AS chapters
        FROM books b LEFT JOIN chapters ch ON ch.book_id = b.id
                     LEFT JOIN per_chapter pc ON pc.id = ch.id
        GROUP BY b.id
    ), up_bk AS (
        UPDATE books b SET hadith_count = p.n
        FROM per_book p WHERE b.id = p.id AND b.hadith_count IS DISTINCT FROM p.n
        RETURNING 1
    ), per_coll AS (
        SELECT co.id, COALESCE(SUM(pb.n), 0)::INT AS n, COUNT(pb.id)::INT AS books
        FROM collections co LEFT JOIN books b ON b.collection_id = co.id
                            LEFT JOIN per_book pb ON pb.id = b.id
        GROUP BY co.id
    )
    UPDATE collections co
    SET hadith_count = p.n, book_count = p.books
    FROM per_coll p
    WHERE co.id = p.id
      AND (co.hadith_count IS DISTINCT FROM p.n OR co.book_count IS DISTINCT FROM p.books);
$$;

-- -----------------------------------------------------------------------------
-- ٣. المشغّلات
-- -----------------------------------------------------------------------------
-- على مستوى **الجملة** (STATEMENT) لا الصفّ: استيراد ٣٥ ألف حديث بمشغّل صفّي
-- يعني ٣٥ ألف إعادة حساب. الجملة الواحدة تُعيد الحساب مرةً واحدة مهما بلغ
-- عدد صفوفها. وهذا هو نمط الكتابة عندنا فعلاً: استيراد دفعي، وتعديل مشرف
-- نادر — لا كتابة متواترة.
CREATE OR REPLACE FUNCTION trg_recount_hadiths()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM recount_hadiths();
    RETURN NULL;   -- AFTER STATEMENT: القيمة المُرجَعة مهملة
END;
$$;

DROP TRIGGER IF EXISTS hadiths_recount    ON hadiths;
DROP TRIGGER IF EXISTS chapters_recount   ON chapters;
DROP TRIGGER IF EXISTS books_recount      ON books;

CREATE TRIGGER hadiths_recount
    AFTER INSERT OR UPDATE OF chapter_id OR DELETE ON hadiths
    FOR EACH STATEMENT EXECUTE FUNCTION trg_recount_hadiths();

-- نقل باب إلى كتاب آخر، أو حذف باب، يغيّر مجاميع مستويين فوقه
CREATE TRIGGER chapters_recount
    AFTER INSERT OR UPDATE OF book_id OR DELETE ON chapters
    FOR EACH STATEMENT EXECUTE FUNCTION trg_recount_hadiths();

CREATE TRIGGER books_recount
    AFTER INSERT OR UPDATE OF collection_id OR DELETE ON books
    FOR EACH STATEMENT EXECUTE FUNCTION trg_recount_hadiths();

COMMIT;

-- -----------------------------------------------------------------------------
-- ٤. الحساب الأول للبيانات الموجودة
-- -----------------------------------------------------------------------------
-- خارج المعاملة عمداً: على ٣٥٬٧٩٨ حديثاً يستغرق ثوانيَ معدودة، ولا داعي
-- لإبقاء أقفال الكتابة قائمةً طوال المدة.
SELECT recount_hadiths();

-- -----------------------------------------------------------------------------
-- ٥. تحقّق — يجب أن يطابق ٣٥٬٧٩٨
-- -----------------------------------------------------------------------------
SELECT
    (SELECT SUM(hadith_count) FROM collections) AS "مجموع_المجموعات",
    (SELECT SUM(hadith_count) FROM books)       AS "مجموع_الكتب",
    (SELECT SUM(hadith_count) FROM chapters)    AS "مجموع_الأبواب",
    (SELECT COUNT(*)          FROM hadiths)     AS "العدد_الحقيقي";

SELECT name_ar AS "المجموعة", book_count AS "كتب", hadith_count AS "أحاديث"
FROM collections ORDER BY sort_order;
