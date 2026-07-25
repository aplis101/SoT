# Test Plan — خطة الاختبار

Document Version: v1.0

Project: منصة الحديث الشريف التفاعلية

Product: Interactive Hadith Memorization Platform (PWA + Supabase)

Status: Draft

Last Updated: 2026-07-23

Author: System Analyst AI

Source: Derived from SRS v1.0 (SoT-1) + ALG v1.0 (`09-business-logic-rules.md`)

---

# 1. المقدمة (INTRODUCTION)

## 1.1 الغرض (Purpose)

تعرّف هذه الوثيقة خطة الاختبار (Test Plan) لمنصة الحديث الشريف التفاعلية. وهي المرجع الرئيسي لجميع أنشطة الاختبار، وتشمل: الاستراتيجية، النطاق، الموارد، الجدول الزمني، ومعايير النجاح. تُنفَّذ الاختبارات على بيئة staging مطابقة للإنتاج (Supabase Free Tier + Vercel Preview).

## 1.2 الأهداف (Objectives)

- التحقق من أن جميع الميزات (F001–F008) تعمل وفق مواصفات متطلبات النظام (SRS).
- التحقق من أن كل تدفق مستخدم (UC-001–UC-013) يسير حسب المواصفات.
- التحقق من صحة الخوارزميات المرجعية الست (ALG-001–ALG-006) بأمثلة عددية قابلة للفحص.
- اكتشاف العيوب (Defects) قبل إطلاق النظام للفصل الدراسي.
- ضمان تحقق المتطلبات غير الوظيفية ذات الصلة (الأداء، الأمان/RLS، قابلية الاستخدام RTL/LTR).

## 1.3 المراجع (References)

| Document | Version | Location |
| --- | --- | --- |
| Software Requirements Specification (SRS) | v1.0 | `hadith-sot/01-srs.md` |
| Business Logic Rules (ALG-001…ALG-006) | v1.0 | `hadith-sot/09-business-logic-rules.md` |
| User Flow Specifications | v1.0 | `hadith-sot/user-flows/` |
| API Contracts (RPC) | v1.0 | `hadith-sot/08-api-contracts.md` |
| RLS Policies | v1.0 | `hadith-sot/05-rls-policies.sql` |
| Test Case Specification | v1.0 | `hadith-sot/16-test-cases.md` |
| Test Execution Sheet | v1.0 | `hadith-sot/17-test-execution-sheet.md` |

---

# 2. نطاق الاختبار (TEST SCOPE)

## 2.1 داخل النطاق (In Scope)

| Feature ID | Feature Name | Related Use Cases | Test Coverage |
| --- | --- | --- | --- |
| F001 | استعراض المكتبة الحديثية الهرمية | UC-002 | 4 TC |
| F002 | صفحة الحديث الشاملة (نص، ترجمة، غريب، تخريج، شرح) | UC-003 | 5 TC |
| F003 | المشغل الصوتي واختيار الصوت الافتراضي | UC-004, UC-005 | 10 TC |
| F004 | التسجيل والرفع الصوتي | UC-008, UC-009 | 9 TC |
| F005 | الإعجاب والتفضيل الشخصي | UC-006, UC-007 | 6 TC |
| F006 | البلاغات (صوتية + محتوى) | UC-010, UC-011 | 7 TC |
| F007 | المصادقة والملف الشخصي | UC-001 | 4 TC |
| F008 | لوحة تحكم المشرف | UC-012, UC-013 | 7 TC |
| **Total** | | | **52 TC** |

### 2.1.1 أنواع الاختبار المشمولة (Test Types Included)

| Test Type | Description |
| --- | --- |
| Functional Testing | التحقق من أن كل ميزة تعمل وفق SRS وUser Flows |
| UI/UX Testing | التحقق من التخطيط والاستجابة وسهولة الاستخدام، **بما في ذلك اختبار التخطيط ثنائي الاتجاه RTL/LTR بمحتوى عربي-إندونيسي مختلط حقيقي** (نصوص مشكولة + ترجمة إندونيسية + أرقام لاتينية) |
| Validation Testing | التحقق من مدخلات النماذج، قواعد العمل (Business Rules)، وسلامة البيانات (قيود UNIQUE، حدود المدة/الحجم) |
| Error Handling Testing | اختبار استجابة النظام لحالات الخطأ (رفض الأذونات، انقطاع الشبكة، رموز 409/429، فشل الرفع) |
| Integration Testing | التحقق من تكامل الواجهة مع Supabase: استدعاءات RPC (`get_default_recording`, `toggle_like`, `submit_report`, `create_recording`, `replace_recording`...) + تفعّل سياسات RLS |
| Audio Pipeline Testing | اختبار خط الأنابيب الصوتي كاملاً: تسجيل (MediaRecorder) ← ضغط على الجهاز (Opus/AAC 24–32kbps أحادي) ← رفع إلى Storage ← تشغيل عبر CDN |
| Security Testing | التحقق من سياسات RLS (عدم قراءة نجوم الآخرين، منع كتابة غير المالك) + محاولات MIME Spoofing (رفع ملف متنكر بامتداد/نوع مخالف لمحتواه الحقيقي) |
| Regression Testing | التأكد من أن تغييرات الكود لا تكسر الميزات العاملة (إعادة تنفيذ الحزمة كاملة بعد الإصلاحات) |

## 2.2 خارج النطاق (Out of Scope)

- اختبار الحمل (Load Testing) بما يتجاوز حجم الفصل الدراسي (~100 طالب).
- تطبيقات الجوال الأصلية (Native Mobile Apps) — المنتج PWA فقط.
- ميزة `annotations` (التعليقات/الفوائد المجتمعية) — مؤجلة لمرحلة لاحقة.
- الوضع دون اتصال الكامل (Offline-First) — يقتصر على التخزين المؤقت للصوتيات.
- البحث النصي الشامل في المتون (اعتبار مستقبلي).
- إدارة الأدوار عبر واجهة رسومية (ترقية `admin` يدوية في قاعدة البيانات).

---

# 3. استراتيجية الاختبار (TEST STRATEGY)

## 3.1 مستويات الاختبار (Testing Levels)

### Level 1: Component Testing (Unit)

| Aspect | Detail |
| --- | --- |
| **Target** | دوال الخوارزميات (ALG-001…ALG-006) داخل RPC Functions، ومكونات الواجهة الحرجة (المشغل، المسجل) |
| **Approach** | اختبارات آلية (مسؤولية المطور) + اختبارات SQL مباشرة لدوال RPC على قاعدة staging |
| **Tool** | Jest (Frontend)، pgTAP / SQL scripts (Supabase) |
| **Responsibility** | Developer |

### Level 2: Integration Testing

| Aspect | Detail |
| --- | --- |
| **Target** | التفاعل بين الواجهة ← RPC ← قاعدة البيانات ← Storage، وتفعّل سياسات RLS لكل دور |
| **Approach** | اختبار يدوي للـ RPC عبر Postman/Supabase SQL Editor + سيناريوهات واجهة موجهة |
| **Tool** | Postman، Supabase Dashboard، Chrome DevTools (Network) |
| **Responsibility** | Tester |

### Level 3: System Testing

| Aspect | Detail |
| --- | --- |
| **Target** | جميع الميزات end-to-end عبر المتصفح (52 حالة اختبار) |
| **Approach** | تنفيذ يدوي وفق مواصفات حالات الاختبار `16-test-cases.md` وتسجيل النتائج في `17-test-execution-sheet.md` |
| **Tool** | Chrome / Firefox / Safari (أحدث إصدار)، Android Chrome، iOS Safari |
| **Responsibility** | Tester |

### Level 4: User Acceptance Testing (UAT)

| Aspect | Detail |
| --- | --- |
| **Target** | سيناريوهات حقيقية: طالب يسجّل تلاوة فعلية ويسمعها، والمشرف يعتمدها |
| **Approach** | اختبار استكشافي يدوي بعيّنات تلاوة حقيقية (للتحقق من كفاية جودة 24kbps للتلاوة) |
| **Tool** | بيئة staging شبه إنتاجية + ميكروفونات اختبار |
| **Responsibility** | End User (طالب/مشرف) + Tester |

## 3.2 منهجية الاختبار (Testing Approach)

### Functional Testing Approach

تُنفَّذ حالات الاختبار حسب أولوية الميزة:
1. **High Priority (F001–F007):** تنفيذ 100% من حالات الاختبار (45 TC).
2. **Medium Priority (F008):** تنفيذ 100% من حالات الاختبار (7 TC).

### Algorithm Verification Approach

لكل خوارزمية (ALG-001…ALG-006) تُحضَّر بيانات اختبار عددية مضبوطة مسبقاً (مثال: 5 تسجيلات بلايكات 0/2/5/10، عدد طلاب نشطين = 8 أو 20)، وتُقارن النتيجة الفعلية مع النتيجة المحسوبة يدوياً من الـ Pseudocode في `09-business-logic-rules.md`.

### Defect Management

| Stage | Action |
| --- | --- |
| Defect Found | يسجّل المختبِر العيب في سجل العيوب (Defect Log) مع خطوات الإعادة والبيئة |
| Severity Level | Critical / Major / Minor / Trivial |
| Critical Defect | يتوقف الاختبار حتى إصلاح العيب (مثال: كسر RLS يكشف بيانات، فقدان تسجيلات) |
| Major Defect | يتوقف اختبار الميزة المعنية حتى الإصلاح (مثال: ALG-001 تختار تسجيلاً خاطئاً) |
| Minor/Trivial | يستمر الاختبار ويُصلَّح العيب لاحقاً |

---

# 4. بيئة الاختبار (TEST ENVIRONMENT)

## 4.1 متطلبات العتاد (Hardware Requirements)

| الجهاز | المواصفات الدنيا |
| --- | --- |
| حاسوب / لابتوب | معالج Intel i3 / AMD Ryzen 3، ذاكرة 4GB، تخزين 256GB |
| هاتف Android | متصفح Chrome حديث + ميكروفون صالح |
| هاتف iPhone / iPad | متصفح Safari حديث + ميكروفون صالح |
| ميكروفونات اختبار | ميكروفون مدمج + ميكروفون خارجي (للمقارنة بجودة التلاوة) |

## 4.2 متطلبات البرمجيات (Software Requirements)

### Frontend Testing

| Software | Version |
| --- | --- |
| Google Chrome | Latest stable |
| Mozilla Firefox | Latest stable |
| Safari | Latest stable (iOS/macOS) |
| Android Chrome | Latest stable (Mobile-First) |
| iOS Safari | Latest stable (Mobile-First) |

### Backend & API Testing

| Software | Version |
| --- | --- |
| Supabase Project (staging) | Free Tier — مشروع مستقل عن الإنتاج |
| Postman (لاختبار RPC/RLS مباشرة) | Latest stable |
| Chrome DevTools | مدمج (فحص Network للتحقق من عدم إرسال أي بايت عند الرفض المحلي) |

### Deployment

| Component | Specification |
| --- | --- |
| Frontend | Vercel Preview Deployment (مرتبط بفرع staging) |
| Backend | Supabase Free Tier (PostgreSQL + Auth + Storage + RPC) مع تفعيل RLS الكامل |

## 4.3 متطلبات الشبكة (Network Requirements)

- اتصال إنترنت مستقر بزمن استجابة < 100ms إلى خوادم Supabase.
- **ملف اختبار الأداء:** ملف تعريف شبكة مُقيَّد بسرعة 3G (Throttled 3G Profile) في Chrome DevTools للتحقق من متطلبات الأداء (تحميل صفحة الحديث < 2ث، بدء التشغيل < 1ث).

## 4.4 متطلبات بيانات الاختبار (Test Data Requirements)

| Data Item | Quantity | Description |
| --- | --- | --- |
| حسابات طلاب Google | 2 | `student1@univ.ac.id`، `student2@univ.ac.id` (نطاق جامعي لتفعيل اختبار `hd`) |
| حساب مشرف | 1 | `admin@univ.ac.id` (مُرقّى يدوياً إلى `admin` في `profiles`) |
| مجموعات حديثية | ≥ 3 | متداخلة: كتب ← أبواب ← أحاديث، **تشمل حديثاً طويلاً واحداً على الأقل** (length_class = طويل) |
| حديث اختبار قصير رئيسي | 1 | حديث "إنما الأعمال بالنيات" مع غريب وتخريج وترجمة وشرح |
| حديث ناقص الأقسام | 1 | حديث بلا ترجمة/شرح (لاختبار الإخفاء الأنيق) |
| تسجيلات على حديث واحد | ≥ 5 | بلايكات متنوعة (0، 2، 5، 10) لاختبارات ALG-001 + تسجيل أحدث بلا لايكات |
| تسجيل معتمد | 1 | `is_verified = true` (ولاختبار تعدد المعتمدين: تسجيلان معتمدان بتاريخين مختلفين) |
| بذور `app_settings` | افتراضية | `upload_enabled=true`، `community_best_min_likes=3`، `report_alert_ratio=0.15`/`min=2`، `report_hide_ratio=0.40`/`min=4`، `active_users_window_days=30`، `rate_limit_uploads_per_hour=5`، `listen_count_threshold_seconds=5` |
| طلاب نشطون (لاختبار ALG-002) | 8 و20 | ضبط `last_active_at` لحسابات وهمية للتحقق من صيغة العتبة بعددين مختلفين |

---

# 5. الأدوار والمسؤوليات (ROLES & RESPONSIBILITIES)

| Role | Name / Team | Responsibility |
| --- | --- | --- |
| Test Manager | System Analyst | إعداد خطة الاختبار، الإشراف على التنفيذ، إعداد التقارير |
| Tester | QA Team | تنفيذ حالات الاختبار، تسجيل العيوب، التحقق من الإصلاحات |
| Developer | Dev Team | إصلاح العيوب المكتشفة، كتابة اختبارات الوحدة |
| End User (طالب/مشرف) | ممثلو الفصل الدراسي | تنفيذ UAT، تسجيل عيّنات تلاوة حقيقية، تقديم الملاحظات |
| Sponsor (الأستاذ) | الأستاذ المشرف | اعتماد نتائج الاختبار وقرار الإطلاق |

---

# 6. جدول الاختبار (TEST SCHEDULE)

## 6.1 المراحل (Phases)

| Phase | Activity | Duration | Deliverable |
| --- | --- | --- | --- |
| **P1: Test Planning** | إعداد خطة الاختبار، تجهيز بيئة staging وبيانات الاختبار | 2 أيام | Test Plan Document |
| **P2: Test Case Preparation** | إعداد مواصفات حالات الاختبار (52 TC) | 2 أيام | Test Case Specification |
| **P3: Test Execution** | تنفيذ حالات الاختبار وتسجيل النتائج | 3 أيام | Test Execution Report |
| **P4: Defect Fixing** | إصلاح المطور للعيوب | 2 أيام | Fixed Build |
| **P5: Re-testing** | التحقق من الإصلاحات + Regression | 1 يوم | Updated Test Report |
| **P6: UAT** | اختبار قبول المستخدم (طالب/مشرف) بعيّنات تلاوة حقيقية | 1 يوم | UAT Sign-off |
| **P7: Test Closure** | إعداد تقرير الاختبار الختامي | 1 يوم | Test Summary Report |

**الإجمالي التقديري:** 12 يوم عمل

---

# 7. معايير الدخول والخروج (ENTRY & EXIT CRITERIA)

## 7.1 معايير الدخول (Entry Criteria)

| No | Criteria |
| --- | --- |
| EC-01 | SRS وUser Flows ومواصفات حالات الاختبار مُراجعة ومعتمدة |
| EC-02 | بيئة staging (Vercel Preview + Supabase Free Tier) منشورة ومستقرة، مع مهمة ping لمنع إيقاف المشروع |
| EC-03 | بيانات الاختبار (§4.4) محمّلة ومتحقق منها (مجموعات، تسجيلات بلايكات متنوعة، تسجيل معتمد، بذور app_settings) |
| EC-04 | حسابات Google الاختبارية (طالبان + مشرف) جاهزة، وGoogle OAuth مفعّل في Supabase Auth بشاشة موافقة صحيحة الإعداد |
| EC-05 | المختبِرون يفهمون حالات الاختبار وسيناريوهاتها، وأجهزة الميكروفون مختبَرة مسبقاً |

## 7.2 معايير الخروج (Exit Criteria)

| No | Criteria |
| --- | --- |
| XC-01 | تنفيذ 100% من حالات الاختبار (52/52) |
| XC-02 | لا توجد عيوب Critical أو Major مفتوحة (خاصة: أي خرق RLS، أو اختيار افتراضي خاطئ في ALG-001) |
| XC-03 | جميع عيوب Minor/Trivial موثقة ومقبولة كـ Known Issues |
| XC-04 | اكتمال UAT وتوقيعه من المستخدم النهائي (طالب/مشرف) والراعي (الأستاذ) |
| XC-05 | تقرير الاختبار الختامي مُعدّ ومعتمد |

## 7.3 معايير التعليق (Suspension Criteria)

| No | Criteria |
| --- | --- |
| SC-01 | عيب Critical يمنع اختبار أكثر من 50% من حالات الاختبار (مثال: تعذر تسجيل الدخول عبر Google OAuth إطلاقاً) |
| SC-02 | بيئة staging غير مستقرة أو تتعطل بشكل متكرر (تجاوز حدود Supabase Free Tier، إيقاف المشروع للخمول) |
| SC-03 | تغيير جوهري مفاجئ في المتطلبات (Major Requirement Change) |

---

# 8. مخرجات الاختبار (TEST DELIVERABLES)

| Deliverable | Description | Due |
| --- | --- | --- |
| Test Plan | وثيقة خطة الاختبار هذه | نهاية P1 |
| Test Case Specification | تفاصيل 52 حالة اختبار (`16-test-cases.md`) | نهاية P2 |
| Test Execution Report | نتائج التنفيذ (`17-test-execution-sheet.md` معبأة) | نهاية P3 |
| Defect Log | قائمة العيوب المكتشفة مع الخطورة وخطوات الإعادة | نهاية P3 |
| Re-test Report | نتائج التحقق من الإصلاحات + Regression | نهاية P5 |
| UAT Sign-off | اعتماد المستخدم النهائي والراعي | نهاية P6 |
| Test Summary Report | تقرير الاختبار الختامي | نهاية P7 |

---

# 9. المخاطر والتخفيف (RISK & MITIGATION)

| Risk ID | Risk Description | Probability | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R-01 | تجاوز حدود Supabase Free Tier (تخزين ~1GB / بيانات صادرة ~5GB / إيقاف بعد 7 أيام خمول) أثناء الاختبار | Medium | High | تخصيص مشروع staging مستقل، مراقبة الاستهلاك من Dashboard، تفعيل مهمة ping مجدولة، حذف ملفات الاختبار الكبيرة بعد كل جولة |
| R-02 | إعداد شاشة موافقة Google OAuth (Consent Screen) خاطئ يمنع تسجيل الدخول في الاختبار | Medium | High | التحقق من إعداد OAuth ونطاق `hd` مسبقاً ضمن معايير الدخول EC-04، وتوثيق الإعداد خطوة بخطوة |
| R-03 | اختلاف سلوك MediaRecorder بين المتصفحات (دعم Opus/حاوية WebM في Safari vs Chrome) | High | Medium | تنفيذ اختبارات التسجيل (TC-F004-xxx) على Chrome وFirefox وSafari وiOS Safari كلٍّ على حدة، واعتماد ترميز بديل (AAC) عند الحاجة |
| R-04 | جودة الصوت عند 24kbps غير كافية لتقييم دقة التلاوة والتشكيل | Medium | High | **التخفيف:** اختبار عيّنات تلاوة حقيقية من الطلاب في UAT (P6) والمقارنة بين 24 و32kbps قبل اعتماد القيمة النهائية (مسألة مفتوحة في `18-open-tasks.md`) |
| R-05 | إعداد RLS خاطئ يكشف بيانات خاصة (مثال: قراءة نجوم `favorite_recordings` لمستخدم آخر) | Low | Critical | **التخفيف:** حالات اختبار أمان مخصصة (RLS Policies Verification) تتضمن قراءة مباشرة عبر Postman بحسابين مختلفين، ومحاولات MIME Spoofing على الرفع |
| R-06 | بيانات الاختبار لا تغطي كل السيناريوهات العددية للخوارزميات | Low | Medium | مراجعة بيانات الاختبار مقابل جداول الأمثلة العددية في `09-business-logic-rules.md` قبل التنفيذ |
| R-07 | تغيير المتطلبات في منتصف الاختبار | Low | High | تجميد المتطلبات قبل بدء P3، وأي تغيير يمر عبر تحديث وثائق SoT أولاً |

---

# 10. الاعتماد (APPROVAL)

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Test Manager | System Analyst AI | | |
| Developer Lead | | | |
| End User Representative (طالب/مشرف) | | | |
| Project Sponsor (الأستاذ) | | | |

---

# 11. سجل المراجعات (REVISION HISTORY)

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 1.0 | 2026-07-23 | System Analyst AI | الإنشاء الأولي لخطة الاختبار (52 حالة اختبار عبر F001–F008) |
