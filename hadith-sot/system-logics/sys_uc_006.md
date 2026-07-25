# System Logic: UC-006 الإعجاب بتسجيل صوتي

Document Version: v1.0

Use Case ID: UC-006

Use Case Name: الإعجاب بتسجيل صوتي

Status: Draft

Last Updated: 2026-07-23

Author: System Analyst AI

---

## 1. Overview

يعرّف هذا المستند منطق النظام للإعجاب العام (❤️) بتسجيل صوتي — قناة التقييم المجتمعي التي تغذي فرز "الأعلى تقييماً" وشارة "أفضل تسجيل" والطبقة 3 في ALG-001. العملية ذرّية عبر RPC `toggle_like` داخل معاملة: إدراج/حذف صف في `likes` مع تحديث `recordings.likes_count` بالتزامن، والقيد الفريد `UNIQUE(recording_id, user_id)` هو الحارس ضد الإعجاب المزدوج. الواجهة تطبق Optimistic UI مع تراجع كامل عند الفشل. الإعجاب منفصل تماماً عن النجمة (ALG-006).

---

## 2. Sequence Diagram

### 2.1 الإعجاب (Like — Atomic Transaction)

```mermaid
sequenceDiagram
    actor الطالب
    participant Frontend
    participant Supabase
    participant Database

    الطالب->>Frontend: الضغط على زر ❤️ في صف التسجيل
    Frontend->>Frontend: Optimistic UI: تفعيل القلب وزيادة العدّاد فوراً
    Frontend->>Supabase: POST /rpc/toggle_like {p_recording_id}
    Supabase->>Database: BEGIN
    Database->>Database: فحص likes WHERE recording_id = X AND user_id = auth.uid()

    alt لا يوجد إعجاب سابق
        Database->>Database: INSERT INTO likes (recording_id, user_id)
        Database->>Database: UPDATE recordings SET likes_count = likes_count + 1 WHERE id = X
        Database->>Database: COMMIT
        Database-->>Supabase: liked: true, likes_count: N
        Supabase-->>Frontend: 200 OK {liked: true, likes_count: N}
        Frontend->>Frontend: تثبيت الحالة المتفائلة بالقيمة المؤكدة من الخادم
        Frontend-->>الطالب: قلب مفعّل + عدّاد محدّث
    end
```

### 2.2 إلغاء الإعجاب (Unlike)

```mermaid
sequenceDiagram
    actor الطالب
    participant Frontend
    participant Supabase
    participant Database

    الطالب->>Frontend: الضغط على ❤️ مفعّل لإلغاء الإعجاب
    Frontend->>Frontend: Optimistic UI: تعطيل القلب وإنقاص العدّاد فوراً
    Frontend->>Supabase: POST /rpc/toggle_like {p_recording_id}
    Supabase->>Database: BEGIN
    Database->>Database: فحص likes WHERE recording_id = X AND user_id = auth.uid()

    alt يوجد إعجاب سابق
        Database->>Database: DELETE FROM likes WHERE recording_id = X AND user_id = auth.uid()
        Database->>Database: UPDATE recordings SET likes_count = likes_count - 1 WHERE id = X
        Database->>Database: COMMIT
        Database-->>Supabase: liked: false, likes_count: N-1
        Supabase-->>Frontend: 200 OK {liked: false, likes_count: N-1}
        Frontend->>Frontend: تثبيت الحالة المتفائلة بالقيمة المؤكدة
        Frontend-->>الطالب: قلب معطّل + عدّاد منقوص
    end
```

### 2.3 حارس التعارض والتراجع (Conflict Guard + Optimistic Rollback)

```mermaid
sequenceDiagram
    actor الطالب
    participant Frontend
    participant Supabase
    participant Database

    الطالب->>Frontend: ضغط متكرر سريع على زر ❤️
    Frontend->>Frontend: Optimistic UI + تعطيل الزر مؤقتاً حتى الرد

    alt تعارض: إعجاب مكرر في نفس اللحظة
        Frontend->>Supabase: POST /rpc/toggle_like {p_recording_id}
        Supabase->>Database: BEGIN
        Database->>Database: INSERT INTO likes ... ON CONFLICT (recording_id, user_id)
        Database->>Database: القيد الفريد UNIQUE(recording_id, user_id) يمنع الصف المزدوج
        Database-->>Supabase: الحالة النهائية المتسقة {liked, likes_count}
        Supabase-->>Frontend: 200 OK (الخادم مصدر الحقيقة)
        Frontend->>Frontend: مطابقة الواجهة مع استجابة الخادم النهائية
    else فشل شبكة بعد التحديث المتفائل
        Frontend->>Supabase: POST /rpc/toggle_like {p_recording_id}
        Supabase-->>Frontend: خطأ شبكة / مهلة (لا استجابة)
        Frontend->>Frontend: Rollback: عكس التحديث المتفائل (إعادة القلب والعدّاد لحالتهما السابقة)
        Frontend-->>الطالب: رسالة "تعذر حفظ الإعجاب، تحقق من الاتصال"
    else زائر غير موثّق
        Frontend->>Supabase: POST /rpc/toggle_like {p_recording_id}
        Supabase-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Rollback + توجيه لتسجيل الدخول
        Frontend-->>الطالب: رسالة "سجّل الدخول للإعجاب"
    end
```

---

## 3. API Contract

### 3.1 POST /rpc/toggle_like

تبديل الإعجاب بتسجيل: يُعجب إن لم يكن معجباً، ويلغي إن كان معجباً. العملية ذرّية (إدراج/حذف + تحديث العدّاد في معاملة واحدة).

**Request Body Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| p_recording_id | uuid | Yes | معرّف التسجيل |

**Success Response (200 OK — بعد الإعجاب):**

```json
{
  "success": true,
  "data": {
    "liked": true,
    "likes_count": 26
  },
  "message": "تم تسجيل إعجابك",
  "errors": []
}
```

**Success Response (200 OK — بعد إلغاء الإعجاب):**

```json
{
  "success": true,
  "data": {
    "liked": false,
    "likes_count": 25
  },
  "message": "تم إلغاء الإعجاب",
  "errors": []
}
```

**Error Response (401 Unauthorized — زائر):**

```json
{
  "success": false,
  "data": null,
  "message": "سجّل الدخول للإعجاب",
  "errors": []
}
```

**Error Response (404 Not Found — تسجيل غير موجود أو مخفي):**

```json
{
  "success": false,
  "data": null,
  "message": "التسجيل المطلوب غير موجود",
  "errors": []
}
```

---

## 4. Business Rules

| Rule | Description |
| --- | --- |
| BR-001 | إعجاب واحد فقط لكل زوج (تسجيل، مستخدم) — القيد الفريد `UNIQUE(recording_id, user_id)` في `likes` هو الحارس النهائي ضد الإعجاب المزدوج |
| BR-002 | العدّاد `recordings.likes_count` يُعدَّل حصرياً عبر RPC `toggle_like` داخل معاملة ذرّية — ممنوع التعديل المباشر عبر RLS (03-data-model §5.2) |
| BR-003 | نفس الدالة تبدّل الحالتين: لا إعجاب → INSERT + زيادة؛ يوجد إعجاب → DELETE + إنقاص؛ و`likes_count` مقيد بـ CHECK (≥ 0) |
| BR-004 | الإعجاب يتطلب تسجيل الدخول؛ الزائر يرى العدّادات فقط دون تفاعل (401 برسالة عربية) |
| BR-005 | الإعجاب منفصل تماماً عن النجمة (ALG-006): لا Trigger ولا منطق يربط `likes` بـ `favorite_recordings`؛ الإعجاب هو وحده الذي يغذي الفرز المجتمعي والشارات |
| BR-006 | الواجهة تطبق Optimistic UI مع Rollback كامل عند فشل الشبكة أو رفض الخادم — الاستجابة النهائية من الخادم هي مصدر الحقيقة |

---

## 5. Traceability

| User Flow | Requirement | API Endpoints |
| --- | --- | --- |
| userflow_uc_006.md | F005 | POST /rpc/toggle_like |

---

## 6. سجل المراجعات

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 1.0 | 2026-07-23 | System Analyst AI | الإنشاء الأولي لمنطق UC-006 اشتقاقاً من SRS F005 وALG-006 |
