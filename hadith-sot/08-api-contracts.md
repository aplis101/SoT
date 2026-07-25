# API Contracts — عقود الواجهات البرمجية (RPC Contracts)

Document Version: v1.0

Project: منصة الحديث الشريف التفاعلية

Product: Interactive Hadith Memorization Platform (PWA + Supabase)

Status: Draft

Last Updated: 2026-07-23

Author: System Analyst AI

Source: Derived from SRS v1.0 + `09-business-logic-rules.md` + `system-logics/`

---

## 1. نظرة عامة

الخادم الوحيد هو Supabase. يوجد نمطان للوصول:

1. **قراءة المحتوى المرجعي:** PostgREST التلقائي (`GET /rest/v1/<table>`) — خاضع لـ RLS.
2. **كل العمليات الكاتبة والمنطقية:** دوال RPC (`POST /rpc/<function>`) — `SECURITY DEFINER` مع فحوص داخلية، لضمان الذرّية وتنفيذ الخوارزميات.

### تنسيق الاستجابة الموحد

```json
{ "success": true, "data": {}, "message": "نص عربي", "errors": [] }
```

### رموز الحالة المعتمدة

| Code | الاستخدام |
|---|---|
| 200 / 201 | نجاح / إنشاء |
| 400 | مدخلات غير صالحة |
| 401 | غير موثّق |
| 403 | ممنوع (صلاحية/موافقة/مفتاح رفع) |
| 404 | غير موجود |
| 409 | تعارض (بلاغ مكرر / تسجيل موجود) |
| 413 | حجم مرفوض |
| 415 | نوع ملف مرفوض |
| 429 | تجاوز معدل الرفع |
| 500 | خطأ خادم |

---

## 2. جرد الدوال (RPC Inventory)

| RPC | الغرض | الاستدعاء من | ALG |
|---|---|---|---|
| `get_default_recording` | الصوت الافتراضي (3 طبقات) | UC-004 | ALG-001 |
| `list_recordings` | قائمة قرّاء الحديث مع الفرز | UC-005 | — |
| `register_listen` | عدّاد الاستماع الذكي | UC-004 | ALG-003 |
| `toggle_like` | إعجاب/إلغاء (ذرّي مع العدّاد) | UC-006 | ALG-006 |
| `toggle_favorite` | نجمة/إلغاء | UC-007 | ALG-006 |
| `give_upload_consent` | توثيق الموافقة على النشر | UC-008 | — |
| `create_recording` | إنشاء تسجيل جديد | UC-008 | ALG-004/005 |
| `replace_recording` | استبدال التسجيل الواحد | UC-008 | ALG-004/005 |
| `delete_recording` | حذف تسجيل (مالك/مشرف) | UC-009/012 | — |
| `submit_report` | بلاغ صوتي + تقييم العتبات | UC-010 | ALG-002 |
| `submit_content_report` | بلاغ محتوى (بلا عتبة) | UC-011 | — |
| `get_active_students_count` | عدد الطلاب النشطين | داخلي (ALG-002) | ALG-002 |
| `admin_verify_recording` | اعتماد/سحب اعتماد ✅ | UC-013 | — |
| `admin_list_recordings_queue` | قائمة بلاغات الصوت للمشرف | UC-012 | — |
| `admin_resolve_report` | معالجة بلاغ صوتي | UC-012 | — |
| `admin_resolve_content_report` | معالجة بلاغ محتوى | UC-012 | — |
| `admin_update_setting` | تعديل إعداد | UC-013 | — |

> العقود التفصيلية مع أمثلة JSON ومخططات التسلسل لكل دالة موجودة في ملفات `system-logics/sys_uc_*.md` المقابلة. هذه الوثيقة هي المرجع المجمّع الملزم للأسماء والتواقيع.

---

## 3. عقود دوال الطالب (Student-Facing RPCs)

### 3.1 `get_default_recording`

أهم دالة في النظام — تنفذ ALG-001 حرفياً.

**Input:**

| Param | Type | Required |
|---|---|---|
| p_hadith_id | uuid | نعم |

**Output (200):**

```json
{
  "success": true,
  "data": {
    "recording_id": "uuid",
    "user_id": "uuid",
    "display_name": "أحمد الفلاني",
    "file_url": "https://<project>.supabase.co/storage/v1/object/public/recordings/audio/hadith_.../user_....opus",
    "duration_seconds": 24,
    "likes_count": 12,
    "listens_count": 48,
    "is_verified": true,
    "selection_layer": "verified",
    "favorites_count": 0
  },
  "message": "تم تحديد التسجيل الافتراضي",
  "errors": []
}
```

* `selection_layer`: `favorite` | `verified` | `community` | `latest` — تقود واجهة المشغل (اسم الطبقة + الشارة).
* عند `selection_layer = 'favorite'` ووجود أكثر من نجمة: يُعاد أيضاً `favorite_recordings[]` (قائمة نجوم المستخدم لهذا الحديث) لتغذية Segmented Toggle.
* عند عدم وجود أي تسجيل ظاهر: `data: null` + `message: "لا توجد تسجيلات لهذا الحديث بعد"`.

**Errors:** 400 (معرّف ناقص)، 404 (حديث غير موجود)، 500.

---

### 3.2 `list_recordings`

**Input:**

| Param | Type | Required | Default |
|---|---|---|---|
| p_hadith_id | uuid | نعم | — |
| p_sort | text | لا | `'top'` — القيم: `top` / `most_listened` / `latest` |
| p_favorites_only | boolean | لا | `false` (يتطلب موثّقاً عند `true`) |

**Output (200):** قائمة صفوف:

```json
{
  "success": true,
  "data": {
    "recordings": [{
      "id": "uuid", "user_id": "uuid", "display_name": "أحمد",
      "duration_seconds": 24, "likes_count": 12, "listens_count": 48,
      "is_verified": true, "is_community_best": false, "created_at": "2026-07-20T10:00:00Z",
      "is_liked_by_me": false, "is_favorited_by_me": true, "is_mine": false,
      "file_url": "https://..."
    }],
    "total": 5
  },
  "message": "نجاح",
  "errors": []
}
```

* تستبعد `is_hidden = true` إلا للمشرف والمالك.
* `is_community_best = true` فقط للأعلى لايكات عند بلوغ `community_best_min_likes`.

**Errors:** 401 (عند `p_favorites_only=true` لزائر)، 400 (فرز غير معروف)، 404.

---

### 3.3 `register_listen`

**Input:** `p_recording_id uuid`.

**Output (200):**

```json
{ "success": true, "data": { "counted": true, "listens_count": 49 }, "message": "تم احتساب الاستماع", "errors": [] }
```

* `counted: false` إذا احتُسب سابقاً (قيد فريد — لا خطأ، سلوك طبيعي).
* يستدعى من العميل بعد 5 ثوانٍ تشغيل متواصلة فقط (ALG-003).

**Errors:** 401، 404.

---

### 3.4 `toggle_like`

**Input:** `p_recording_id uuid`.

**Output (200):**

```json
{ "success": true, "data": { "liked": true, "likes_count": 13 }, "message": "تم تسجيل الإعجاب", "errors": [] }
```

* ذرّي: INSERT/DELETE في `likes` + تحديث `likes_count` في معاملة واحدة.
* `liked: false` عند الإلغاء مع `likes_count` الجديد.

**Errors:** 401 («سجّل الدخول للإعجاب»)، 404.

---

### 3.5 `toggle_favorite`

**Input:** `p_recording_id uuid`.

**Output (200):**

```json
{ "success": true, "data": { "favorited": true, "favorites_count_for_hadith": 2 }, "message": "أُضيف إلى مفضلتك", "errors": [] }
```

* **لا يمسّ أي عدّاد عام** (ALG-006). `favorites_count_for_hadith` = عدد نجوم المستخدم نفسه على هذا الحديث (يقود ظهور Segmented Toggle).

**Errors:** 401 («سجّل الدخول لاستخدام المفضلة»)، 404.

---

### 3.6 `give_upload_consent`

**Input:** لا شيء (يأخذ `auth.uid()`).

**Output (200):** `{ "success": true, "data": { "consent_given_at": "2026-07-23T09:00:00Z" }, "message": "تم توثيق موافقتك، يمكنك الآن النشر", "errors": [] }`

* idempotent: الاستدعاء المتكرر لا يغيّر التاريخ الأصلي.

**Errors:** 401.

---

### 3.7 `create_recording`

**Input:**

| Param | Type | Constraints |
|---|---|---|
| p_hadith_id | uuid | موجود + ظاهر |
| p_file_path | text | يُبنى خادمياً: `audio/hadith_{id}/user_{uid}.opus` |
| p_duration_seconds | int | >0 و≤ حد `length_class` |
| p_file_size_bytes | int | >0 و≤ حد `length_class` |
| p_codec | text | `opus` أو `aac` |
| p_bitrate_kbps | int | 16–64 |

**فحوص الخادم بالترتيب:** موثّق → `upload_enabled` → الموافقة → حد الرفع (ALG-005) → صحة الحدود حسب `length_class` → عدم وجود تسجيل سابق (وإلا 409) → إدراج.

**Output (201):** صف التسجيل الكامل.

**Errors:**

| Code | message |
|---|---|
| 403 | `الرفع متوقف مؤقتاً من الإدارة` |
| 403 | `الموافقة على سياسة النشر مطلوبة أولاً` |
| 409 | `لديك تسجيل لهذا الحديث — استخدم الاستبدال` |
| 413 | `حجم الملف يتجاوز الحد المسموح` |
| 415 | `نوع الملف غير مدعوم — الترميز المعتمد Opus/AAC` |
| 429 | `تجاوزت الحد الأقصى للرفع (5 تسجيلات/ساعة)` |

---

### 3.8 `replace_recording`

نفس مدخلات `create_recording`. ينفذ ALG-004 ذرّياً:

```text
BEGIN
  حذف الصف القديم (CASCADE: likes/favorites/listens/reports)
  إدراج الصف الجديد (عدّادات من الصفر)
  جدولة حذف ملف Storage القديم
COMMIT
```

**Output (200):** الصف الجديد + `message: "تم استبدال تسجيلك بنجاح"`.

**Errors:** نفس `create_recording` عدا 409.

---

### 3.9 `delete_recording`

**Input:** `p_recording_id uuid`.

* يسمح للمالك أو المشرف فقط. يحذف الصف (CASCADE) + ملف Storage.
* فشل حذف الملف لا يفشل العملية — يُسجَّل يتيماً للتنظيف الدوري (EC-011).

**Output (200):** `{ "success": true, "data": { "deleted": true }, "message": "تم حذف التسجيل", "errors": [] }`

**Errors:** 401، 403 («لا تملك حذف هذا التسجيل»)، 404.

---

### 3.10 `submit_report`

**Input:**

| Param | Type | Constraints |
|---|---|---|
| p_recording_id | uuid | موجود |
| p_reason | report_reason | `incorrect_recitation` / `poor_quality` / `inappropriate` / `other` |
| p_details | text | اختياري، ≤500 حرف |

**Output (201):**

```json
{
  "success": true,
  "data": { "report_id": "uuid", "threshold_result": "none" },
  "message": "وصل بلاغك للإدارة، شكراً لك",
  "errors": []
}
```

* `threshold_result`: `none` | `alerted` | `hidden` — نتيجة تقييم ALG-002 الفوري بعد الإدراج.

**Errors:** 401، 404، 409 («لقد أبلغت عن هذا التسجيل مسبقاً»).

---

### 3.11 `submit_content_report`

**Input:** `p_hadith_id uuid`، `p_error_type content_error_type`، `p_description text` (إلزامي ≤1000).

**Output (201):** صف البلاغ + `message: "وصل بلاغك عن المحتوى للإدارة"`.

* **بلا عتبات إطلاقاً** — يظهر في قائمة المشرف فوراً. التكرار مسموح.

**Errors:** 400 («نوع الخطأ والوصف مطلوبان»)، 401، 404.

---

### 3.12 `get_active_students_count`

**Input:** لا شيء. **Output:** عدد صحيح — طلاب (`role='student'`) لهم `last_active_at` ضمن `active_users_window_days`. دالة داخلية تخدم ALG-002 وتُعرض للمشرف في لوحة الإعدادات.

---

## 4. عقود دوال المشرف (Admin RPCs)

> كلها تفحص `is_admin()` داخلياً أولاً وتعيد 403 «الوصول مقيد بالمشرفين» عند الفشل.

### 4.1 `admin_verify_recording`

**Input:** `p_recording_id uuid`، `p_verify boolean`.

* `true`: يضبط `is_verified=true, verified_by=auth.uid(), verified_at=now()`.
* `false`: يصفّر الحقول الثلاثة.

**Output (200):** الصف المحدّث + `message: "تم اعتماد التسجيل ✅"` / `"تم سحب الاعتماد"`.

**Errors:** 403، 404.

---

### 4.2 `admin_list_recordings_queue`

**Input:** اختياري `p_status report_status` (افتراضي `'open'`)، `p_limit int`.

**Output (200):** بلاغات مجمعة حسب التسجيل:

```json
{
  "success": true,
  "data": {
    "queue": [{
      "recording_id": "uuid", "hadith_id": "uuid", "hadith_excerpt": "إنما الأعمال بالنيات...",
      "owner_real_name": "Ahmad Fulan", "owner_email": "ahmad@student.univ.ac.id",
      "owner_display_name": "أحمد الفلاني",
      "report_count": 4, "reasons": ["incorrect_recitation", "poor_quality"],
      "is_hidden": false, "is_verified": false, "oldest_report_at": "2026-07-22T08:00:00Z"
    }]
  },
  "message": "نجاح",
  "errors": []
}
```

* SECURITY DEFINER — يعرض الهوية الحقيقية (SoT-0 §9-د). مرتبة: `report_count DESC, oldest_report_at ASC`.

**Errors:** 403.

---

### 4.3 `admin_resolve_report`

**Input:** `p_report_id uuid`، `p_action text` — القيم: `dismiss` / `hide` / `delete_recording` / `restore`.

| Action | الأثر |
|---|---|
| `dismiss` | `status='dismissed'` للبلاغ — التسجيل يبقى |
| `hide` | `is_hidden=true, hidden_reason='admin_manual'` + `status='resolved'` |
| `delete_recording` | حذف التسجيل (صف + ملف، CASCADE) + `status='resolved'` |
| `restore` | `is_hidden=false` (استرجاع مخفي تلقائياً بالخطأ) + رفض البلاغات المفتوحة |

كلها تضبط `resolved_by=auth.uid(), resolved_at=now()`.

**Output (200):** `message` مناسب لكل إجراء. **Errors:** 403، 404، 400 («إجراء غير معروف»).

---

### 4.4 `admin_resolve_content_report`

**Input:** `p_report_id uuid`، `p_status content_report_status` — `in_progress` / `resolved` / `dismissed`.

**Output (200):** الصف المحدّث. **Errors:** 403، 404، 400.

---

### 4.5 `admin_update_setting`

**Input:** `p_key text`، `p_value jsonb`.

**التحقق من القيم (جدول إلزامي):**

| key | النوع | المجال المقبول |
|---|---|---|
| `upload_enabled` | boolean | true/false |
| `report_alert_ratio` | number | 0 < x ≤ 1 |
| `report_alert_min` | int | ≥ 1 |
| `report_hide_ratio` | number | 0 < x ≤ 1 |
| `report_hide_min` | int | ≥ 1 |
| `community_best_min_likes` | int | ≥ 0 |
| `active_users_window_days` | int | 1–365 |
| `rate_limit_uploads_per_hour` | int | 1–100 |
| `listen_count_threshold_seconds` | int | 1–60 |

* مفتاح غير معروف → 400 «مفتاح إعداد غير معروف». قيمة خارج المجال → 400 «قيمة غير صالحة لهذا الإعداد».
* يسجّل `updated_by=auth.uid(), updated_at=now()`.

**Output (200):** الإعداد المحدّث + `message: "تم حفظ الإعداد"`. **Errors:** 403، 400، 404.

---

## 5. نقاط قراءة المحتوى (PostgREST Read Endpoints)

قراءة عامة خاضعة لـ RLS — بلا دوال مخصصة:

| Endpoint | الغرض | UC |
|---|---|---|
| `GET /rest/v1/collections?select=*&order=sort_order` | قائمة المجموعات | UC-002 |
| `GET /rest/v1/books?collection_id=eq.{id}&order=sort_order` | كتب المجموعة | UC-002 |
| `GET /rest/v1/chapters?book_id=eq.{id}&order=sort_order` | أبواب الكتاب | UC-002 |
| `GET /rest/v1/hadiths?chapter_id=eq.{id}&select=id,hadith_number,matn_ar,grade&order=hadith_number` | أحاديث الباب | UC-002 |
| `GET /rest/v1/hadiths?id=eq.{id}&select=*,word_definitions(*),takhrij_references(*)` | صفحة الحديث كاملة (طلب واحد مضمّن) | UC-003 |
| `GET /rest/v1/app_settings?select=key,value` | الإعدادات العامة للواجهة (مفتاح الرفع، حد الشارة…) | متفرق |
| `GET /rest/v1/profiles?select=id,display_name` | أسماء العرض للقرّاء | UC-005 |

---

## 6. قواعد إلزامية للتنفيذ

1. **كل عدّاد عام يُعدَّل عبر RPC فقط** — لا يوجد UPDATE مباشر مسموح به على `likes_count`/`listens_count` (لا سياسة UPDATE على `recordings` للعميل إطلاقاً).
2. **كل دالة كاتبة `SECURITY DEFINER`** مع `SET search_path = public` وفحص صلاحية داخلي صريح — لا تعتمد على العميل.
3. **رسائل الخطأ للمستخدم بالعربية دائماً**، وأكواد الخطأ الآلية بالإنجليزية snake_case (مثل `domain_not_allowed`).
4. **العمليات المركبة معاملات** — إنشاء/استبدال/حذف التسجيلات وتبديل الإعجاب ذرّية بالكامل.

---

## 7. مصفوفة التتبع (Traceability)

| RPC | SRS | ALG | UC | System Logic | TC |
|---|---|---|---|---|---|
| get_default_recording | F003 | ALG-001 | UC-004 | sys_uc_004 | TC-F003-001…006, 010 |
| list_recordings | F003/F005 | — | UC-005 | sys_uc_005 | TC-F003-* (القائمة) |
| register_listen | F003 | ALG-003 | UC-004 | sys_uc_004 | TC-F003-007…009 |
| toggle_like | F005 | ALG-006 | UC-006 | sys_uc_006 | TC-F005-001…003 |
| toggle_favorite | F005 | ALG-006 | UC-007 | sys_uc_007 | TC-F005-004…006 |
| give_upload_consent / create / replace | F004 | ALG-004/005 | UC-008 | sys_uc_008 | TC-F004-001…009 |
| delete_recording | F004 | — | UC-009 | sys_uc_009 | TC-F004-006 (ضمنياً) |
| submit_report | F006 | ALG-002 | UC-010 | sys_uc_010 | TC-F006-001…005 |
| submit_content_report | F006 | — | UC-011 | sys_uc_011 | TC-F006-006…007 |
| admin_* | F008 | — | UC-012/013 | sys_uc_012/013 | TC-F008-001…007 |

---

## 8. سجل المراجعات

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-07-23 | System Analyst AI | الإنشاء الأولي — توحيد العقود من ملفات system-logics |
