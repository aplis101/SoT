# User Flow Specifications — الفهرس الرئيسي

Document Version: v1.0

Project: منصة الحديث الشريف التفاعلية

Product: Interactive Hadith Memorization Platform (PWA + Supabase)

Status: Draft

Last Updated: 2026-07-23

Author: System Analyst AI

---

## 1. PURPOSE

This document serves as the master index for all User Flow Specifications (SoT-4).

Each User Flow is maintained in a separate document, derived from SRS v1.0 (SoT-1).

---

## 2. FILE STRUCTURE

```text
user-flows/
├── index.md
├── userflow_uc_001.md
├── userflow_uc_002.md
├── userflow_uc_003.md
├── userflow_uc_004.md
├── userflow_uc_005.md
├── userflow_uc_006.md
├── userflow_uc_007.md
├── userflow_uc_008.md
├── userflow_uc_009.md
├── userflow_uc_010.md
├── userflow_uc_011.md
├── userflow_uc_012.md
└── userflow_uc_013.md
```

---

## 3. USER FLOW CATALOG

| Use Case ID | Use Case Name | File Path | Status |
|---|---|---|---|
| UC-001 | تسجيل الدخول عبر Google OAuth | ./userflow_uc_001.md | Draft |
| UC-002 | تصفح الهرمية حتى الحديث | ./userflow_uc_002.md | Draft |
| UC-003 | عرض تفاصيل الحديث (غريب/تخريج/شرح) | ./userflow_uc_003.md | Draft |
| UC-004 | الاستماع للتسجيل الافتراضي | ./userflow_uc_004.md | Draft |
| UC-005 | استعراض وفلترة قائمة التسجيلات | ./userflow_uc_005.md | Draft |
| UC-006 | الإعجاب بتسجيل صوتي | ./userflow_uc_006.md | Draft |
| UC-007 | تفضيل تسجيل بالنجمة | ./userflow_uc_007.md | Draft |
| UC-008 | تسجيل ورفع صوت جديد | ./userflow_uc_008.md | Draft |
| UC-009 | حذف التسجيل الشخصي | ./userflow_uc_009.md | Draft |
| UC-010 | الإبلاغ عن تسجيل صوتي | ./userflow_uc_010.md | Draft |
| UC-011 | الإبلاغ عن خطأ في المحتوى | ./userflow_uc_011.md | Draft |
| UC-012 | مراجعة البلاغات والإشراف | ./userflow_uc_012.md | Draft |
| UC-013 | اعتماد التسجيلات وإدارة الإعدادات | ./userflow_uc_013.md | Draft |

---

## 4. REQUIREMENT → USER FLOW MAPPING

| Feature ID | Feature Name | Use Cases |
|---|---|---|
| F001 | استعراض المكتبة الحديثية الهرمية | UC-002 |
| F002 | صفحة الحديث الشاملة | UC-003 |
| F003 | المشغل الصوتي واختيار الصوت الافتراضي | UC-004, UC-005 |
| F004 | التسجيل والرفع الصوتي | UC-008, UC-009 |
| F005 | الإعجاب والتفضيل الشخصي | UC-006, UC-007 |
| F006 | البلاغات (صوتية + محتوى) | UC-010, UC-011 |
| F007 | المصادقة والملف الشخصي | UC-001 |
| F008 | لوحة تحكم المشرف | UC-012, UC-013 |

---

## 5. PAGE → USER FLOW MAPPING

| Page ID | Page Name | Use Cases |
|---|---|---|
| PAGE-001 | تسجيل الدخول | UC-001 |
| PAGE-002 | المجموعات (الرئيسية) | UC-002 |
| PAGE-003 | كتب المجموعة | UC-002 |
| PAGE-004 | أبواب الكتاب | UC-002 |
| PAGE-005 | صفحة الحديث | UC-003, UC-004, UC-005 |
| PAGE-005-SUB-01 | اللوحة المنزلقة للتسجيلات | UC-005, UC-006, UC-007, UC-009, UC-010 |
| PAGE-005-SUB-02 | نافذة التسجيل الصوتي | UC-008 |
| PAGE-005-SUB-03 | نموذج بلاغ خطأ المحتوى | UC-011 |
| PAGE-005-SUB-04 | نافذة معنى الكلمة الغريبة | UC-003 |
| PAGE-006 | الملف الشخصي | UC-001 |
| PAGE-007 | لوحة تحكم المشرف | UC-012, UC-013 |
| PAGE-007-SUB-01 | قائمة بلاغات الصوت | UC-012 |
| PAGE-007-SUB-02 | قائمة بلاغات المحتوى | UC-012 |
| PAGE-007-SUB-03 | إعدادات التطبيق | UC-013 |

---

## 6. USER FLOW DEPENDENCIES

| Use Case | Depends On |
|---|---|
| UC-001 | None |
| UC-002 | None (متاح للزائر) |
| UC-003 | UC-002 |
| UC-004 | UC-003 |
| UC-005 | UC-004 |
| UC-006 | UC-001, UC-005 |
| UC-007 | UC-001, UC-005 |
| UC-008 | UC-001, UC-005 |
| UC-009 | UC-001, UC-008 |
| UC-010 | UC-001, UC-005 |
| UC-011 | UC-001, UC-003 |
| UC-012 | UC-001 (بدور admin), UC-010, UC-011 |
| UC-013 | UC-001 (بدور admin) |

---

## 7. USER FLOW → SYSTEM LOGIC MAPPING

| User Flow | System Logic |
|---|---|
| userflow_uc_001.md | ../system-logics/sys_uc_001.md |
| userflow_uc_002.md | ../system-logics/sys_uc_002.md |
| userflow_uc_003.md | ../system-logics/sys_uc_003.md |
| userflow_uc_004.md | ../system-logics/sys_uc_004.md |
| userflow_uc_005.md | ../system-logics/sys_uc_005.md |
| userflow_uc_006.md | ../system-logics/sys_uc_006.md |
| userflow_uc_007.md | ../system-logics/sys_uc_007.md |
| userflow_uc_008.md | ../system-logics/sys_uc_008.md |
| userflow_uc_009.md | ../system-logics/sys_uc_009.md |
| userflow_uc_010.md | ../system-logics/sys_uc_010.md |
| userflow_uc_011.md | ../system-logics/sys_uc_011.md |
| userflow_uc_012.md | ../system-logics/sys_uc_012.md |
| userflow_uc_013.md | ../system-logics/sys_uc_013.md |

---

## 8. REVISION HISTORY

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-07-23 | System Analyst AI | Initial Draft — 13 User Flows covering F001–F008 |
