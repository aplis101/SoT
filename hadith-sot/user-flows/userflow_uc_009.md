# User Flow Specification

Document Version: v1.0

Use Case ID: UC-009  
Use Case Name: حذف التسجيل الشخصي

Status: Draft  
Last Updated: 2026-07-23  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

يحذف الطالب تسجيله الصوتي الخاص لحديث معين بعد تأكيد صريح، فيحذف النظام صف التسجيل من قاعدة البيانات مع كل تفاعلاته (CASCADE: لايكات/نجوم/استماعات/بلاغات) وملف الصوت من Storage، ويختفي التسجيل فوراً من قائمة القراء.

## 1.2 Goal

يريد الطالب إزالة تسجيله الخاص لحديث ما نهائياً — ليسجّل لاحقاً نسخة أفضل أو لينسحب من المشاركة الصوتية في هذا الحديث.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F004|التسجيل والرفع الصوتي|

## 1.4 Primary Actor

طالب موثّق (Student) — مالك التسجيل

## 1.5 Supporting Actors

نظام Supabase (PostgreSQL RPC + Storage)

---

# 2. TRIGGER

ضغط الطالب أيقونة الحذف 🗑️ على تسجيله الخاص في اللوحة المنزلقة للتسجيلات (PAGE-005-SUB-01).

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|جلسة الطالب نشطة وموثّقة عبر Supabase Auth (UC-001)|
|PRE-002|التسجيل المستهدف مملوك للمستخدم الحالي — زر الحذف 🗑️ يظهر فقط على تسجيلاته (للمشرف يظهر على كل التسجيلات — UC-012)|

---

# 4. MAIN FLOW

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يضغط أيقونة الحذف 🗑️ على تسجيله في اللوحة المنزلقة|النظام يعرض نافذة تأكيد: "هل تريد حذف تسجيلك نهائياً؟"|
|2|الطالب يؤكد الحذف|النظام يستدعي RPC `delete_recording`|
|3|—|الخادم يحذف صف التسجيل من قاعدة البيانات (CASCADE يحذف لايكاته ونجومه واستماعاته وبلاغاته) ويحذف ملف الصوت من Storage|
|4|—|يختفي التسجيل فوراً من قائمة القراء ويُحدَّث عدّاد التسجيلات|

---

# 5. ALTERNATIVE FLOWS

## AF-001: إلغاء نافذة التأكيد

### Condition

عندما يضغط الطالب أيقونة الحذف ثم يتراجع في نافذة التأكيد.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يضغط "إلغاء" في نافذة التأكيد|تُغلق النافذة دون أي إجراء — يبقى التسجيل كما هو ولا يحدث أي تغيير|

---

# 6. EXCEPTION FLOWS

## EF-001: فشل حذف ملف Storage بعد حذف الصف

### Condition

عندما ينجح حذف الصف من قاعدة البيانات لكن حذف ملف الصوت من Storage يفشل.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|—|حُذف الصف من قاعدة البيانات لكن حذف الملف من Storage فشل|
|2|—|النظام يسجّل الملف اليتيم للتنظيف الدوري (EC-011) دون إظهار أي خطأ للمستخدم — العملية تُعتبر ناجحة من وجهة نظره|

---

## EF-002: فشل الشبكة

### Condition

عندما ينقطع الاتصال بالخادم قبل تنفيذ عملية الحذف.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يؤكد الحذف|فشل الاتصال بالخادم قبل تنفيذ RPC `delete_recording`|
|2|—|النظام يعرض رسالة خطأ مع زر "إعادة المحاولة"، ويبقى التسجيل ظاهراً في القائمة|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|لا يوجد للطالب أي تسجيل نشط لهذا الحديث (يستطيع تسجيل واحد جديد لاحقاً عبر UC-008)|
|POST-002|حُذفت كل التفاعلات المرتبطة بالتسجيل (لايكات/نجوم/استماعات/بلاغات) عبر CASCADE|
|POST-003|حُذف ملف الصوت من Storage، أو سُجّل يتيماً للتنظيف الدوري (EC-011)|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|يملك الطالب حذف تسجيله الشخصي في أي وقت|
|BR-002|يملك المشرف الحذف المطلق لأي تسجيل (UC-012)|
|BR-003|الحذف نهائي ولا رجعة فيه، ويشمل كل التفاعلات المرتبطة (CASCADE)|
|BR-004|الحذف يتطلب تأكيداً صريحاً دائماً — لا حذف بنقرة واحدة|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-005-SUB-01|اللوحة المنزلقة للتسجيلات|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|recordings|قراءة صف التسجيل للتحقق من الملكية وعرض بياناته|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|None|لا بيانات تُنشأ في هذه العملية|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|None|لا بيانات تُحدَّث — العملية حذف كلي|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|recordings|حذف صف التسجيل من قاعدة البيانات|
|likes / favorite_recordings / recording_listens / reports|حذف كل التفاعلات المرتبطة تلقائياً عبر CASCADE|
|Storage Object|حذف ملف الصوت من Storage (`audio/hadith_{id}/user_{uid}.opus`)|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|طالب موثّق — مالك التسجيل|مسموح (ALLOWED)|
|زائر (Guest)|مرفوض (DENIED)|
|مشرف (Admin)|مسموح (ALLOWED) — حذف مطلق لأي تسجيل (UC-012)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|لا يُنفَّذ الحذف دون تأكيد صريح من نافذة التأكيد|
|AC-002|يختفي التسجيل فوراً من قائمة القراء بعد الحذف|
|AC-003|لا يبقى أي أثر للتسجيل في العدّادات (لايكات/استماعات/عدد التسجيلات)|
|AC-004|يحذف CASCADE كل التفاعلات المرتبطة بالتسجيل (لايكات/نجوم/استماعات/بلاغات)|
|AC-005|فشل حذف الملف من Storage لا يُظهر خطأ للمستخدم ويُسجَّل للتنظيف الدوري (EC-011)|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F004|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-005-SUB-01|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|1.0|2026-07-23|System Analyst AI|Initial Draft|
