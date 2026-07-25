# Business Logic Rules — قواعد وخوارزميات المنطق المرجعية

Document Version: v1.0

Project: منصة الحديث الشريف التفاعلية

Product: Interactive Hadith Memorization Platform (PWA + Supabase)

Status: Draft

Last Updated: 2026-07-23

Author: System Analyst AI

Source: Derived from SRS v1.0 (SoT-1) §3 — يُنفَّذ عبر RPCs في `08-api-contracts.md`

---

## 1. الغرض

هذه الوثيقة هي **المرجع الدقيق الوحيد** لكل خوارزميات النظام. تُكتب الخوارزميات هنا كـ Pseudocode محكم، وتُنفَّذ في دوال RPC (انظر `08-api-contracts.md`)، وتُختبَر بحالات اختبار في `16-test-cases.md`. أي تعديل في سلوك الخوارزمية يبدأ من هذه الوثيقة.

---

## 2. سجل الخوارزميات

| ALG ID | الاسم | المصدر في SoT-0 | مكان التنفيذ |
|---|---|---|---|
| ALG-001 | اختيار الصوت الافتراضي (الطبقات الثلاث) | §5-أ | RPC `get_default_recording` |
| ALG-002 | عتبات البلاغات النسبية | §6-أ | RPC `submit_report` + `get_active_students_count` |
| ALG-003 | عداد الاستماع الذكي | §5-د | عميل (مؤقّت) + RPC `register_listen` |
| ALG-004 | قاعدة التسجيل الواحد والاستبدال | §4-أ | قيد DB + RPC `replace_recording` |
| ALG-005 | تحديد معدل الرفع | §9-ج | RPC `create_recording` / `replace_recording` |
| ALG-006 | فصل التفضيل الشخصي عن التقييم العام | §5-أ | تصميم الجداول + RPCs `toggle_like`/`toggle_favorite` |

---

## 3. ALG-001: اختيار الصوت الافتراضي (الطبقات الثلاث)

> **مبدأ التصميم:** الشعبية (اللايكات) ليست الحَكَم الوحيد على الدقة. الدقة العلمية (اعتماد المشرف) والتفضيل الشخصي يسبقانها دائماً.

### المدخلات

* `hadith_id` — الحديث المطلوب.
* `current_user_id` — المستخدم الحالي (قد يكون NULL للزائر).

### Pseudocode

```text
FUNCTION get_default_recording(hadith_id, current_user_id):

    # جلب كل التسجيلات الظاهرة للحديث (المخفية مستبعدة دائماً)
    visible ← SELECT * FROM recordings
              WHERE hadith_id = hadith_id AND is_hidden = false

    IF visible IS EMPTY:
        RETURN NULL                      # لا يوجد صوت — يُخفى زر التشغيل

    # ─── الطبقة 1: ⭐ التفضيل الشخصي (موثّقون فقط) ─────────────────
    IF current_user_id IS NOT NULL:
        my_favorites ← visible ∩ (
            SELECT recording_id FROM favorite_recordings
            WHERE user_id = current_user_id
        )
        IF COUNT(my_favorites) = 1:
            RETURN my_favorites[0]                       # يُشغَّل دائماً
        IF COUNT(my_favorites) > 1:
            default ← argmax(my_favorites, likes_count)  # الأعلى لايكات بين نجومه
            RETURN default                               # + مفتاح Segmented Toggle
                                                           # للتنقل اليدوي بين نجومه

    # ─── الطبقة 2: ✅ المعتمد ───────────────────────────────────────
    verified ← visible WHERE is_verified = true
    IF verified IS NOT EMPTY:
        RETURN FIRST(verified ORDER BY verified_at DESC, likes_count DESC)
        # الأحدث اعتماداً، ثم الأعلى لايكات عند التعادل

    # ─── الطبقة 3: الأعلى تقييماً المجتمعي ──────────────────────────
    min_likes ← app_settings['community_best_min_likes']     # الافتراضي 3
    best ← argmax(visible, likes_count)
    IF best.likes_count >= min_likes:
        RETURN best                                          # يحمل شارة "أفضل تسجيل"

    # ─── السقوط الأخير: الأحدث ──────────────────────────────────────
    RETURN FIRST(visible ORDER BY created_at DESC)
```

### قواعد ثابتة

* التسجيل المخفي (`is_hidden = true`) لا يدخل الحساب إطلاقاً — حتى لو كان مفضَّلاً أو معتمداً سابقاً.
* الزائر (غير الموثّق) يبدأ مباشرة من الطبقة 2.
* التفضيل الشخصي خاص بحت: لا يؤثر على نتيجة الخوارزمية لأي مستخدم آخر (ALG-006).
* شارة "أفضل تسجيل" تُفعَّل فقط عند بلوغ `community_best_min_likes`؛ دونها لا توجد شارة مجتمعية ويُشغَّل الأحدث.

### مثال عددي

| الحالة | النتيجة |
|---|---|
| للطالب نجمة على تسجيل A، ويوجد معتمد B، والأعلى لايكات C | يُشغَّل **A** (الطبقة 1 تسحق الكل لهذا الطالب) |
| للطالب نجمتان: A (10 لايكات) وD (25 لايكة) | يُشغَّل **D** افتراضياً + مفتاح تبديل بين A/D |
| لا نجوم، معتمدان: B1 (معتمد أمس) وB2 (معتمد اليوم) | يُشغَّل **B2** (الأحدث اعتماداً) |
| لا نجوم ولا معتمد، الأعلى لايكات = 2 والحد الأدنى 3 | يُشغَّل **الأحدث** رفعاً — لا شارة مجتمعية |

---

## 4. ALG-002: عتبات البلاغات النسبية

> **السبب:** أرقام ثابتة (3 و10 بلاغات) لا تناسب كل حجم فصل دراسي؛ العتبات نسبية من الطلاب النشطين مع حد أدنى مطلق يمنع التلاعب في الفصول الصغيرة.

### الصيغة

```text
العتبة = MAX(الحد الأدنى المطلق, CEIL(عدد الطلاب النشطين × النسبة))
```

### Pseudocode

```text
FUNCTION evaluate_report_thresholds(recording_id):

    settings ← app_settings
    active_students ← get_active_students_count()     # انظر §4.1
    report_count ← COUNT(reports WHERE recording_id = recording_id
                         AND status IN ('open','reviewing'))

    alert_threshold ← MAX(settings.report_alert_min,
                          CEIL(active_students × settings.report_alert_ratio))
    hide_threshold  ← MAX(settings.report_hide_min,
                          CEIL(active_students × settings.report_hide_ratio))

    IF report_count >= hide_threshold AND NOT recording.is_hidden:
        UPDATE recordings SET is_hidden = true,
               hidden_reason = 'auto_hidden_threshold'
        NOTIFY admin_panel URGENT('تسجيل أُخفي تلقائياً — مراجعة عاجلة')
        RETURN 'hidden'

    IF report_count >= alert_threshold:
        NOTIFY admin_panel('تسجيل عليه ملاحظات')       # يبقى ظاهراً
        RETURN 'alerted'

    RETURN 'none'
```

### 4.1 حساب "الطلاب النشطين"

```text
FUNCTION get_active_students_count():
    window_days ← app_settings['active_users_window_days']    # الافتراضي 30
    RETURN COUNT(profiles
                 WHERE role = 'student'
                   AND last_active_at >= now() - (window_days || ' days')::interval)
```

> ⚠️ مسألة مفتوحة (انظر `18-open-tasks.md` T-04): هل يُحسب من كل المسجّلين أم من نشطي آخر 30 يوماً فقط؟ القيمة الافتراضية المعتمدة أعلاه: **نشطو آخر 30 يوماً**، قابلة للتغيير من `app_settings` دون كود.

### أمثلة عددية (بالقيم الافتراضية: تنبيه 15%/حد2، إخفاء 40%/حد4)

| الطلاب النشطون | عتبة التنبيه | عتبة الإخفاء |
|---|---|---|
| 8 | max(2, ⌈1.2⌉) = **2** | max(4, ⌈3.2⌉) = **4** |
| 20 | max(2, 3) = **3** | max(4, 8) = **8** |
| 40 | max(2, 6) = **6** | max(4, 16) = **16** |
| 3 (فصل صغير جداً) | **2** (الحد الأدنى يمنع التلاعب) | **4** |

### قواعد ثابتة

* الإخفاء التلقائي **ليس حذفاً**: القرار النهائي للمشرف (إبقاء/إخفاء دائم/حذف) — UC-012.
* بلاغات المحتوى (`content_reports`) **لا تدخل هذه الخوارزمية إطلاقاً** — تصل الإدارة فوراً بلا عتبة.
* تُحتسب البلاغات المفتوحة وقيد المراجعة فقط؛ المحلولة والمرفوضة لا تُعاد في العدّ.

---

## 5. ALG-003: عداد الاستماع الذكي

> **الهدف:** عدّ استماع حقيقي فقط — لا تشغيل عابر ولا تضخيم ذاتي.

### Pseudocode (العميل + الخادم)

```text
# ─── على جهاز العميل ───
ON playback_started(recording):
    listen_timer ← START_TIMER()

ON playback_time_update:
    IF listen_timer.elapsed >= app_settings['listen_count_threshold_seconds']  # 5 ثوانٍ
       AND NOT already_counted_locally(recording):
        CALL RPC register_listen(recording.id)
        mark_counted_locally(recording)

# ─── على الخادم (RPC register_listen) ───
FUNCTION register_listen(recording_id):
    IF EXISTS(recording_listens WHERE recording_id = recording_id
              AND user_id = auth.uid()):
        RETURN { counted: false }                    # احتُسب سابقاً — مرة واحدة فقط
    INSERT INTO recording_listens (recording_id, user_id) VALUES (...)
    UPDATE recordings SET listens_count = listens_count + 1 WHERE id = recording_id
    RETURN { counted: true, listens_count: NEW }
```

### قواعد ثابتة

* عتبة 5 ثوانٍ **متواصلة** من التشغيل الفعلي (لا يكفي فتح الملف).
* احتساب واحد فقط لكل (مستخدم، تسجيل) مدى الحياة — القيد الفريد هو الحارس النهائي على الخادم.
* إيقاف مؤقت ثم استئناف: المؤقّت يجمع الزمن التراكمي للتشغيل لا زمن الساعة.
* الزائر: لا يُحتسب له استماع (لا `user_id`) — القرار موثق في `10-edge-cases.md` EC-014.

---

## 6. ALG-004: قاعدة التسجيل الواحد والاستبدال

> **القاعدة:** لكل طالب تسجيل واحد نشط لكل حديث. الجديد يستبدل القديم بعد تأكيد صريح.

### Pseudocode

```text
FUNCTION replace_recording(hadith_id, new_file, metadata):
    ASSERT has_upload_consent(auth.uid())
    ASSERT app_settings['upload_enabled'] = true
    check_rate_limit(auth.uid())                        # ALG-005
    validate_metadata(metadata, hadith_id)              # مدة/حجم حسب length_class

    existing ← SELECT * FROM recordings
               WHERE hadith_id = hadith_id AND user_id = auth.uid()

    BEGIN TRANSACTION:
        IF existing IS NOT NULL:
            # يحدث فقط بعد تأكيد المستخدم في الواجهة: "تأكيد الاستبدال"
            DELETE FROM recordings WHERE id = existing.id
            # CASCADE يحذف: likes, favorites, listens, reports المرتبطة
            enqueue_storage_delete(existing.file_path)  # حذف الملف القديم
        INSERT INTO recordings (...) VALUES (...)
    COMMIT

    upload_to_storage(new_file, path = 'audio/hadith_{id}/user_{uid}.opus')
```

### قواعد ثابتة

* الحارس الأول: `UNIQUE(hadith_id, user_id)` في قاعدة البيانات.
* الحارس الثاني: الواجهة تعرض تأكيد الاستبدال قبل أي حذف.
* الاستبدال **يعيد تعيين كل العدّادات** (لايكات/استماعات/نجوم/بلاغات) لأنها تخص التسجيل القديم لا الحديث.
* العملية ذرّية: فشل رفع الملف بعد حذف الصف القديم يُشغّل تعويضاً (انظر EC-011).

---

## 7. ALG-005: تحديد معدل الرفع (Rate Limiting)

```text
FUNCTION check_rate_limit(user_id):
    limit ← app_settings['rate_limit_uploads_per_hour']        # الافتراضي 5
    recent ← COUNT(recordings WHERE user_id = user_id
                   AND created_at >= now() - interval '1 hour')
    IF recent >= limit:
        RAISE ERROR code 'RATE_LIMITED'
              message 'تجاوزت الحد الأقصى للرفع (5 تسجيلات/ساعة). حاول لاحقاً.'
```

* يُفحص قبل كل إدراج جديد وقبل كل استبدال.
* الحد قابل للتعديل من لوحة التحكم (UC-013) دون نشر كود.

---

## 8. ALG-006: فصل التفضيل الشخصي عن التقييم العام

> **مبدأ التصميم:** "ما أفضّله أنا" ≠ "ما يفضّله الفصل". الفصل التام يمنع تلاعب النجوم بالشارة العامة.

### القواعد الإلزامية

1. `favorite_recordings` و`likes` جدولان مستقلان بلا أي Trigger أو منطق يربط بينهما.
2. سياسات RLS على `favorite_recordings`: كل مستخدم يرى نجومه فقط (`auth.uid() = user_id`) — لا توجد قراءة عامة لنجوم الآخرين.
3. شارة "أفضل تسجيل" والفرز المجتمعي يعتمدان `likes_count` حصرياً — لا يقرأان النجوم إطلاقاً.
4. الطبقة 1 في ALG-001 تقرأ نجوم المستخدم الحالي فقط لتحديد **مرجعه الشخصي**، ولا تُسهم في أي عدّاد عام.
5. يُسمح بالجمع: إعجاب بدون نجمة، نجمة بدون إعجاب، كلاهما، أو لا شيء — كلها حالات صالحة.

---

## 9. مصفوفة التتبع (Traceability)

| ALG ID | SRS | SoT-0 | RPC (08-api-contracts) | UC | TC |
|---|---|---|---|---|---|
| ALG-001 | F003 | §5-أ | `get_default_recording` | UC-004 | TC-F003-001…005 |
| ALG-002 | F006 | §6-أ | `submit_report`, `get_active_students_count` | UC-010 | TC-F006-001…004 |
| ALG-003 | F003 | §5-د | `register_listen` | UC-004 | TC-F003-006…008 |
| ALG-004 | F004 | §4-أ | `create_recording`, `replace_recording` | UC-008 | TC-F004-001…006 |
| ALG-005 | F004 | §9-ج | `create_recording`, `replace_recording` | UC-008 | TC-F004-007 |
| ALG-006 | F005 | §5-أ/ب | `toggle_like`, `toggle_favorite` | UC-006, UC-007 | TC-F005-001…006 |

---

## 10. سجل المراجعات

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-07-23 | System Analyst AI | الإنشاء الأولي للخوارزميات الست المرجعية |
