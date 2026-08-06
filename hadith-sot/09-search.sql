-- =============================================================================
-- 09-search.sql — البحث النصّي بثلاث لغات
-- منصة الحديث الشريف | Version 1.0 | 2026-08-06
--
-- كانت أهم ميزة ناقصة على الإطلاق: ٣٥٬٧٩٨ حديثاً بلا أي وسيلة للبحث. الطالب
-- الذي يذكر «إنما الأعمال بالنيات» ولا يذكر موضعه لا يجد شيئاً.
--
-- المبدأ: كل شيء داخل Postgres. لا Algolia ولا Elasticsearch — لا تكلفة، لا
-- مفتاح جديد، لا خدمة قد تُغلق فتموت الميزة. صدقة جارية يجب أن تبقى تعمل.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- ١. تطبيع النص العربي — أساس كل شيء
-- -----------------------------------------------------------------------------
-- بلا تطبيع، البحث العربي يفشل عملياً:
--   • من يكتب «انما» لا يجد «إنَّما»       (همزة + شدّة)
--   • من يكتب «الاعمال» لا يجد «الأعمال»   (ألف)
--   • من يكتب «النيه» لا يجد «النية»       (تاء مربوطة)
-- نصوصنا مشكَّلة بالكامل، والطالب لا يكتب التشكيل أبداً. فالتطبيع ليس تحسيناً
-- بل شرط عمل الميزة أصلاً.
--
-- IMMUTABLE ضرورية لأن الدالة تُستعمل في عمود مولَّد وفهرس.
CREATE OR REPLACE FUNCTION ar_normalize(t TEXT)
RETURNS TEXT AS $$
    SELECT regexp_replace(
        translate(
            -- حذف الحركات (064B-0652) والتطويل (0640) وعلامات القرآن (06D6-06ED)
            regexp_replace(COALESCE(t, ''), '[ً-ْـۖ-ٰۭ]', '', 'g'),
            -- توحيد: أ إ آ ٱ ← ا | ى ← ي | ة ← ه | ؤ ئ ← و ي
            'أإآٱىةؤئ',
            'اااايهوي'
        ),
        '\s+', ' ', 'g'
    );
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- -----------------------------------------------------------------------------
-- ٢. عمود البحث المولَّد — اللغات الثلاث في متجه واحد
-- -----------------------------------------------------------------------------
-- استعلام واحد يبحث في العربي والإنجليزي والإندونيسي معاً، فلا يحتاج الطالب
-- أن يخبرنا بأي لغة يبحث. الوزن يرفع المتن فوق الإسناد: من يبحث عن كلمة في
-- المتن يريد الحديث، لا كل حديث رواه راوٍ بنفس الاسم.
--   A = المتن (الأهم) · B = الترجمات · C = الإسناد
--
-- 'simple' للعربي والإندونيسي لأن Postgres لا يملك قاموساً لهما؛ التطبيع
-- يعوّض ذلك. و'english' للإنجليزية لأن قاموسها موجود ويفيد (running←run).
ALTER TABLE hadiths DROP COLUMN IF EXISTS search_vector;
ALTER TABLE hadiths ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
    setweight(to_tsvector('simple',  ar_normalize(COALESCE(matn_ar, ''))),        'A') ||
    setweight(to_tsvector('english', COALESCE(translation_en, '')),               'B') ||
    setweight(to_tsvector('simple',  COALESCE(translation_id, '')),               'B') ||
    setweight(to_tsvector('simple',  ar_normalize(COALESCE(isnad_ar, ''))),       'C')
) STORED;

CREATE INDEX IF NOT EXISTS idx_hadiths_search ON hadiths USING GIN (search_vector);

-- فهرس ثلاثيات للبحث الجزئي والمتساهل مع الخطأ الإملائي
CREATE INDEX IF NOT EXISTS idx_hadiths_trgm
    ON hadiths USING GIN (ar_normalize(matn_ar) gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- ٣. دالة البحث
-- -----------------------------------------------------------------------------
-- STABLE لا DEFINER: تحترم RLS. ولا تُرجع إلا ما يحق للمستخدم رؤيته.
CREATE OR REPLACE FUNCTION search_hadiths(
    p_query      TEXT,
    p_collection TEXT DEFAULT NULL,
    p_limit      INT  DEFAULT 30,
    p_offset     INT  DEFAULT 0
)
RETURNS TABLE (
    id              UUID,          -- [تصحيح] المفتاح UUID لا BIGINT
    chapter_id      INT,
    book_id         INT,
    collection_slug TEXT,
    hadith_number   NUMERIC,
    matn_ar         TEXT,
    isnad_ar        TEXT,
    translation_en  TEXT,
    translation_id  TEXT,
    book_name_ar    TEXT,
    book_name_en    TEXT,
    book_name_id    TEXT,
    collection_ar   TEXT,
    collection_en   TEXT,
    collection_id_n TEXT,
    snippet         TEXT,
    rank            REAL
) AS $$
DECLARE
    q_norm  TEXT;
    tsq     tsquery;
BEGIN
    q_norm := ar_normalize(TRIM(COALESCE(p_query, '')));
    IF char_length(q_norm) < 2 THEN RETURN; END IF;

    -- websearch_to_tsquery يفهم "عبارة مقتبسة" و OR و - للاستبعاد،
    -- ولا يرمي خطأً على مدخل عابث — بخلاف to_tsquery.
    tsq := websearch_to_tsquery('simple', q_norm);
    IF tsq IS NULL OR tsq::text = '' THEN RETURN; END IF;

    -- التسلسل الفعلي في المخطط: collections ← books ← chapters ← hadiths
    RETURN QUERY
    SELECT h.id, h.chapter_id, b.id, c.slug, h.hadith_number,
           h.matn_ar, h.isnad_ar, h.translation_en, h.translation_id,
           b.name_ar, b.name_en, b.name_id,
           c.name_ar, c.name_en, c.name_id,
           ts_headline('simple', ar_normalize(h.matn_ar), tsq,
                       'StartSel=<mark>,StopSel=</mark>,MaxWords=32,MinWords=12,MaxFragments=1'),
           ts_rank(ARRAY[0.1, 0.3, 0.6, 1.0]::real[], h.search_vector, tsq)
    FROM hadiths h
    JOIN chapters ch   ON ch.id = h.chapter_id
    JOIN books b       ON b.id  = ch.book_id
    JOIN collections c ON c.id  = b.collection_id
    WHERE h.search_vector @@ tsq
      AND (p_collection IS NULL OR c.slug = p_collection)
    ORDER BY 17 DESC, h.hadith_number
    LIMIT  LEAST(GREATEST(p_limit, 1), 100)     -- سقف صلب: لا يستنزف Egress
    OFFSET GREATEST(p_offset, 0);
END;
$$ LANGUAGE plpgsql STABLE PARALLEL SAFE;

COMMIT;

-- تحقّق
SELECT count(*) AS "ahadith_indexed" FROM hadiths WHERE search_vector IS NOT NULL;
-- استعلام بلا تشكيل يجب أن يجد النصّ المشكَّل — هذا اختبار التطبيع الحقيقي
SELECT collection_ar, hadith_number, left(matn_ar, 70)
FROM search_hadiths('انما الاعمال بالنيات', NULL, 3);
