# User Flow Specification

Document Version: v1.0

Use Case ID: UC-007  
Use Case Name: تفضيل تسجيل بالنجمة

Status: Draft  
Last Updated: 2026-07-23  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

يضغط الطالب أيقونة ⭐ على صف تسجيل، فيدرج النظام صفاً في `favorite_recordings` وتتحول الأيقونة إلى نجمة ممتلئة، فيصبح هذا التسجيل مرشح الطبقة 1 في خوارزمية اختيار الصوت الافتراضي (ALG-001) عند التشغيل القادم — دون أي أثر على العدّادات أو الشارات العامة.

## 1.2 Goal

يريد الطالب تحديد قارئه المفضّل شخصياً لكل حديث ليكون مرجعه الافتراضي عند الاستماع، دون التأثير على تجربة الآخرين أو على التقييم المجتمعي.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F005|الإعجاب والتفضيل الشخصي|

## 1.4 Primary Actor

طالب موثق (Student)

## 1.5 Supporting Actors

نظام Supabase (RPC `toggle_favorite`)

---

# 2. TRIGGER

الطالب يضغط أيقونة ⭐ على صف تسجيل في اللوحة المنزلقة (PAGE-005-SUB-01).

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|المستخدم مسجّل الدخول (UC-001)|
|PRE-002|اللوحة المنزلقة بقائمة التسجيلات مفتوحة (UC-005)|
|PRE-003|التسجيل المستهدف ظاهر وغير مخفي|

---

# 4. MAIN FLOW

| Step | Actor Action | System Response |
| ---- | ------------ | --------------- |
| 1 | الطالب يضغط أيقونة ⭐ على تسجيل | النظام يستدعي RPC `toggle_favorite` |
| 2 | | الخادم يدرج صفاً في `favorite_recordings` |
| 3 | | النظام يحدّث الأيقونة إلى نجمة ممتلئة ⭐ |
| 4 | | هذا التسجيل يصبح مرشح الطبقة 1 في ALG-001 عند التشغيل القادم (مرجع الطالب الافتراضي) |

---

# 5. ALTERNATIVE FLOWS

## AF-001: إلغاء التفضيل

### Condition

عند ضغط الطالب أيقونة ⭐ على تسجيل مفضَّل سابقاً.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يضغط ⭐ مجدداً على تسجيل مفضَّل|RPC `toggle_favorite` يحذف الصف من `favorite_recordings`|
|2||النظام يعيد الأيقونة إلى نجمة فارغة، ويزول أثر التسجيل من الطبقة 1 في ALG-001|

---

## AF-002: تفضيل أكثر من تسجيل لنفس الحديث

### Condition

عند تفضيل الطالب تسجيلاً ثانياً (أو أكثر) لنفس الحديث — يُسمح بلا حد أقصى.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يضغط ⭐ على تسجيل ثانٍ لنفس الحديث|النظام يقبل التفضيل دون أي حد أقصى لعدد النجوم|
|2||عند التشغيل: يظهر Segmented Toggle في المشغل للتنقل اليدوي بين النجوم، والافتراضي هو الأعلى لايكات بينها (ALG-001 الطبقة 1)|

---

## AF-003: استعراض المفضلات عبر الفلتر

### Condition

عند رغبة الطالب في رؤية كل تسجيلاته المفضَّلة لحديث ما.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يختار فلتر "⭐ المفضّلة لدي" في اللوحة المنزلقة|النظام يعرض فقط تسجيلاته المفضَّلة لهذا الحديث (UC-005 AF-003)|

---

# 6. EXCEPTION FLOWS

## EF-001: زائر يضغط النجمة

### Condition

عند ضغط زائر (غير موثّق) على أيقونة ⭐.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الزائر يضغط أيقونة ⭐|النظام لا ينفّذ أي عملية تفضيل|
|2||النظام يعرض دعوة لتسجيل الدخول (تقود إلى UC-001)|

---

## EF-002: فشل الشبكة

### Condition

عند فشل استدعاء RPC `toggle_favorite` بعد تحديث الواجهة.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|فشل استدعاء `toggle_favorite`|الواجهة تتراجع عن تحديث الأيقونة (تعيدها لحالتها السابقة)|
|2||النظام يعرض رسالة خطأ للمستخدم|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|نجمة واحدة كحد أقصى لكل (مستخدم، تسجيل) — القيد الفريد `(recording_id, user_id)` في `favorite_recordings` هو الحارس|
|POST-002|لا حد أقصى لعدد النجوم لنفس الحديث|
|POST-003|لم يتغير أي عدّاد عام (`likes_count` وغيره) نتيجة التفضيل|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|التفضيل شخصي بحت: لا يؤثر إطلاقاً على `likes_count` ولا على شارة "أفضل تسجيل" العامة — منعاً لأي تلاعب بالشارة العامة (ALG-006)|
|BR-002|سياسات RLS على `favorite_recordings`: لا أحد يرى نجوم غيره — كل مستخدم يقرأ نجومه فقط (`auth.uid() = user_id`)|
|BR-003|فعل التفضيل منفصل تماماً عن فعل الإعجاب (ALG-006): يمكن الجمع بينهما أو الانفراد بأحدهما — كلها حالات صالحة|
|BR-004|الطبقة 1 في ALG-001 تقرأ نجوم المستخدم الحالي فقط لتحديد مرجعه الشخصي، ولا تُسهم النجوم في أي عدّاد عام|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-005-SUB-01|اللوحة المنزلقة للتسجيلات (Bottom Sheet داخل PAGE-005)|
|PAGE-005|صفحة الحديث `/hadiths/[hadithId]` (المشغل السفلي وSegmented Toggle)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|favorite_recordings|قراءة نجوم المستخدم الحالي لتحديد حالة الأيقونة والتشغيل الافتراضي (ALG-001 الطبقة 1)|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|favorite_recordings|إنشاء صف تفضيل جديد (فريد لكل زوج تسجيل/مستخدم) عند التفضيل|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|None|لا يُحدَّث أي عدّاد عام نتيجة التفضيل (ALG-006)|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|favorite_recordings|حذف صف التفضيل عند إلغاء النجمة (AF-001)|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|زائر (Guest)|مرفوض (DENIED) — لا يرى النجمة تفاعلياً ولا فلتر "المفضّلة لدي"|
|طالب (Student)|مسموح (ALLOWED)|
|مشرف (Admin)|مسموح (ALLOWED)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|يتم التفضيل وإلغاء التفضيل بنقرة واحدة على الأيقونة|
|AC-002|التشغيل الافتراضي التالي يحترم النجمة (الطبقة 1 في ALG-001 تسحق باقي الطبقات لهذا الطالب)|
|AC-003|لا تتأثر العدّادات العامة (`likes_count` وشارة "أفضل تسجيل") بأي عملية تفضيل|
|AC-004|يُسمح بتعدد النجوم لنفس الحديث مع ظهور Segmented Toggle للتنقل بينها|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F005|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-005-SUB-01|
|PAGE-005|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|1.0|2026-07-23|System Analyst AI|Initial Draft|
