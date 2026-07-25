# User Flow Specification

Document Version: v1.0

Use Case ID: UC-001  
Use Case Name: تسجيل الدخول عبر Google OAuth

Status: Draft  
Last Updated: 2026-07-23  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

يفتح المستخدم التطبيق دون جلسة نشطة، فيُعاد توجيهه إلى صفحة تسجيل الدخول، فيضغط زر "المتابعة بحساب Google"، يختار حسابه ويوافق، ثم ينشئ النظام ملفه الشخصي تلقائياً عند أول دخول ويوجهه إلى الصفحة الرئيسية.

## 1.2 Goal

يريد المستخدم (طالب/مشرف) الدخول إلى المنصة بأقل عدد ممكن من الخطوات عبر حساب Google الخاص به، دون الحاجة إلى كلمة مرور أو نموذج تسجيل.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F007|المصادقة والملف الشخصي|

## 1.4 Primary Actor

مستخدم (طالب/مشرف)

## 1.5 Supporting Actors

Google OAuth، نظام Supabase Auth

---

# 2. TRIGGER

المستخدم يفتح التطبيق (PWA) دون وجود جلسة JWT نشطة.

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|لدى المستخدم حساب Google متاح|
|PRE-002|إعداد Google OAuth مفعّل في Supabase Auth (Provider مفعّل بالمفاتيح الصحيحة)|

---

# 4. MAIN FLOW

| Step | Actor Action | System Response |
| ---- | ------------ | --------------- |
| 1 | المستخدم يفتح التطبيق دون جلسة نشطة | النظام يعيد التوجيه إلى صفحة تسجيل الدخول `/login` |
| 2 | المستخدم يضغط زر "المتابعة بحساب Google" | النظام يستدعي Supabase Auth ويفتح نافذة Google OAuth |
| 3 | المستخدم يختار حساب Google ويوافق على الأذونات | Google تعيد المستخدم إلى التطبيق بجلسة JWT صالحة |
| 4 | | النظام يتحقق هل هو أول دخول: إن نعم، ينشئ مشغّل قاعدة البيانات (DB Trigger) صفاً في `profiles` تلقائياً بالدور الافتراضي `student` واسم العرض من حساب Google |
| 5 | | النظام يوجه المستخدم إلى الصفحة الرئيسية `/` |

---

# 5. ALTERNATIVE FLOWS

## AF-001: جلسة نشطة موجودة مسبقاً

### Condition

عند فتح المستخدم التطبيق مع وجود جلسة JWT صالحة من دخول سابق.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|المستخدم يفتح التطبيق|النظام يكتشف الجلسة النشطة ويدخله مباشرة إلى الصفحة الرئيسية `/` متخطياً `/login`|

---

## AF-002: تقييد النطاق الجامعي مفعّل

### Condition

عند تفعيل تقييد النطاق الجامعي عبر معامل `hd` في إعداد Google OAuth.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|المستخدم يضغط زر "المتابعة بحساب Google"|نافذة Google OAuth تعرض حسابات نطاق الجامعة فقط|
|2|المستخدم يختار حسابه الجامعي ويوافق|يكمل التدفق الرئيسي من الخطوة 4|

---

# 6. EXCEPTION FLOWS

## EF-001: المستخدم يُلغي نافذة Google

### Condition

عند إغلاق المستخدم نافذة Google OAuth دون إتمام اختيار الحساب والموافقة.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|المستخدم يُغلق نافذة Google OAuth دون اختيار حساب|النظام يبقي المستخدم في صفحة `/login`|
|2||النظام يعرض رسالة محايدة تفيد بعدم اكتمال تسجيل الدخول|

---

## EF-002: حساب من خارج النطاق الجامعي

### Condition

عند محاولة الدخول بحساب Google خارج نطاق الجامعة أثناء تفعيل معامل `hd`.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|المستخدم يحاول الدخول بحساب من خارج النطاق الجامعي|النظام يرفض إنشاء الجلسة|
|2||النظام يعرض رسالة "يُرجى استخدام البريد الجامعي"|

---

## EF-003: فشل الشبكة

### Condition

عند انقطاع الاتصال بالشبكة أثناء عملية المصادقة.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|المستخدم يضغط زر الدخول أثناء انقطاع الشبكة|فشل الاتصال بـ Google OAuth / Supabase Auth|
|2||النظام يعرض رسالة "تعذر الاتصال، حاول مجدداً"|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|جلسة JWT نشطة للمستخدم تُدار عبر Supabase SDK|
|POST-002|صف `profiles` موجود للمستخدم (أُنشئ تلقائياً عند أول دخول بالدور `student`)|
|POST-003|حقل `profiles.last_active_at` محدّث بوقت الدخول|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|لا كلمات مرور إطلاقاً — الدخول حصرياً عبر زر "المتابعة بحساب Google" (لا استرجاع كلمة مرور ولا نماذج تسجيل)|
|BR-002|الدور الافتراضي لكل حساب جديد هو `student` ويُنشأ عبر DB Trigger على `auth.users`|
|BR-003|ترقية الدور إلى `admin` تتم يدوياً في قاعدة البيانات فقط — لا توجد واجهة إدارة أدوار|
|BR-004|الجلسات تُدار بالكامل عبر Supabase SDK (JWT) وتعتمد سياسات RLS على `auth.uid()` مباشرة|
|BR-005|تقييد النطاق الجامعي عبر معامل `hd` إعداد اختياري في Google OAuth (إعداد لا كود)|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-001|تسجيل الدخول (`/login`)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|Auth Session|قراءة جلسة المصادقة الحالية للتحقق من وجود JWT صالح|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|profiles|إنشاء صف الملف الشخصي تلقائياً عند أول دخول (الدور `student` واسم العرض من حساب Google)|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|profiles|تحديث حقل `last_active_at` بوقت آخر نشاط للمستخدم|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|None|لا توجد بيانات تُحذف في هذا التدفق|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|طالب (Student)|مسموح (ALLOWED)|
|مشرف (Admin)|مسموح (ALLOWED)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|يستطيع المستخدم إتمام الدخول الناجح خلال نقرتين من صفحة `/login`|
|AC-002|يُنشأ صف `profiles` تلقائياً عند أول دخول دون أي تدخل يدوي|
|AC-003|يكون الدور الافتراضي للحساب الجديد `student`|
|AC-004|يظهر اسم العرض (display_name) في الواجهة بعد الدخول|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F007|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-001|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|1.0|2026-07-23|System Analyst AI|Initial Draft|
