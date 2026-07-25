# User Flow Specification

Document Version: v1.0

Use Case ID: UC-006  
Use Case Name: الإعجاب بتسجيل صوتي

Status: Draft  
Last Updated: 2026-07-23  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

يضغط الطالب أيقونة ❤️ على صف تسجيل في اللوحة المنزلقة، فتحدّث الواجهة الأيقونة والعدّاد فوراً (Optimistic UI)، ثم يؤكد الخادم العملية عبر RPC `toggle_like` بإدراج صف `likes` وزيادة `likes_count` ذرّياً — ويمكن إلغاء الإعجاب بالضغط مجدداً.

## 1.2 Goal

يريد الطالب التعبير عن إعجابه بقراءة زميله بنقرة واحدة، بما يغذي الترتيب المجتمعي وشارة "أفضل تسجيل"، مع إمكانية التراجع عن إعجابه في أي وقت.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F005|الإعجاب والتفضيل الشخصي|

## 1.4 Primary Actor

طالب موثق (Student)

## 1.5 Supporting Actors

نظام Supabase (RPC `toggle_like`)

---

# 2. TRIGGER

الطالب يضغط أيقونة ❤️ على صف تسجيل في اللوحة المنزلقة (PAGE-005-SUB-01).

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
| 1 | الطالب يضغط أيقونة ❤️ على تسجيل | الواجهة تحدّث الأيقونة والعدّاد فوراً (Optimistic UI) قبل رد الخادم |
| 2 | | النظام يستدعي RPC `toggle_like` |
| 3 | | الخادم يدرج صفاً في `likes` ويزيد `recordings.likes_count` ذرّياً |
| 4 | | الخادم يرد بالتأكيد النهائي للواجهة (الحالة والعدّاد النهائيان) |

---

# 5. ALTERNATIVE FLOWS

## AF-001: إلغاء الإعجاب

### Condition

عند ضغط الطالب أيقونة ❤️ على تسجيل معجب به سابقاً.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الطالب يضغط ❤️ على تسجيل معجب به|الواجهة تحدّث الأيقونة والعدّاد فوراً (Optimistic UI)|
|2||RPC `toggle_like` يحذف صف `likes` وينقص `likes_count` ذرّياً|
|3||الخادم يؤكد الحالة النهائية للواجهة|

---

# 6. EXCEPTION FLOWS

## EF-001: زائر يضغط الإعجاب

### Condition

عند ضغط زائر (غير موثّق) على أيقونة ❤️.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|الزائر يضغط أيقونة ❤️|النظام لا ينفّذ أي عملية إعجاب|
|2||النظام يعرض دعوة لتسجيل الدخول (تقود إلى UC-001)|

---

## EF-002: فشل الشبكة/الخادم

### Condition

عند فشل استدعاء RPC `toggle_like` (انقطاع شبكة أو خطأ خادم) بعد التحديث المتفائل.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|فشل استدعاء `toggle_like`|الواجهة تتراجع عن التحديث المتفائل (تعيد الأيقونة والعدّاد لحالتهما السابقة)|
|2||النظام يعرض رسالة خطأ للمستخدم|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|إعجاب واحد كحد أقصى لكل (مستخدم، تسجيل) — القيد الفريد `(recording_id, user_id)` في `likes` هو الحارس|
|POST-002|عدّاد `likes_count` متسق تماماً مع عدد صفوف `likes` الفعلية للتسجيل|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|لا نجوم تقييم عامة في النظام — التقييم المجتمعي بالايكات (❤️) فقط|
|BR-002|الإعجاب قابل للإلغاء في أي وقت بالضغط مجدداً (Toggle)|
|BR-003|عدّاد `likes_count` يُعدَّل عبر RPC `toggle_like` فقط — يُمنع التعديل المباشر من العميل|
|BR-004|الإعجاب لا علاقة له بالنجمة ⭐ إطلاقاً (ALG-006): فعل الإعجاب منفصل تماماً عن فعل التفضيل، ويمكن الجمع أو الانفراد بينهما|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-005-SUB-01|اللوحة المنزلقة للتسجيلات (Bottom Sheet داخل PAGE-005)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|recordings|قراءة العدّاد النهائي `likes_count` من رد الخادم للتأكيد|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|likes|إنشاء صف إعجاب جديد (فريد لكل زوج تسجيل/مستخدم) عند الإعجاب|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|recordings|زيادة/إنقاص `likes_count` ذرّياً عبر RPC `toggle_like`|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|likes|حذف صف الإعجاب عند إلغاء الإعجاب (AF-001)|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|زائر (Guest)|مرفوض (DENIED) — يرى العدّادات فقط دون تفاعل|
|طالب (Student)|مسموح (ALLOWED)|
|مشرف (Admin)|مسموح (ALLOWED)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|يتم الإعجاب وإلغاء الإعجاب بنقرة واحدة على الأيقونة|
|AC-002|يستحيل وجود إعجابين لنفس المستخدم على نفس التسجيل (القيد الفريد حارس)|
|AC-003|يبقى العدّاد `likes_count` متسقاً بعد عمليتي الإعجاب والإلغاء|
|AC-004|عند فشل الشبكة تتراجع الواجهة عن التحديث المتفائل وتعرض رسالة خطأ|

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

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|1.0|2026-07-23|System Analyst AI|Initial Draft|
