# System Logic Specifications — الفهرس الرئيسي

Document Version: v1.0

Project: منصة الحديث الشريف التفاعلية

Product: Interactive Hadith Memorization Platform (PWA + Supabase)

Status: Draft

Last Updated: 2026-07-23

Author: System Analyst AI

---

## 1. PURPOSE

This document serves as the master index for all System Logic Specifications (SoT-5).

Each System Logic contains sequence diagrams and API/RPC contracts derived from the corresponding User Flow specification (SoT-4).

---

## 2. FILE STRUCTURE

```text
system-logics/
├── index.md
├── sys_uc_001.md
├── sys_uc_002.md
├── sys_uc_003.md
├── sys_uc_004.md
├── sys_uc_005.md
├── sys_uc_006.md
├── sys_uc_007.md
├── sys_uc_008.md
├── sys_uc_009.md
├── sys_uc_010.md
├── sys_uc_011.md
├── sys_uc_012.md
└── sys_uc_013.md
```

---

## 3. SYSTEM LOGIC CATALOG

| Use Case ID | Use Case Name | File Path | Status |
|---|---|---|---|
| UC-001 | تسجيل الدخول عبر Google OAuth | ./sys_uc_001.md | Draft |
| UC-002 | تصفح الهرمية حتى الحديث | ./sys_uc_002.md | Draft |
| UC-003 | عرض تفاصيل الحديث | ./sys_uc_003.md | Draft |
| UC-004 | الاستماع للتسجيل الافتراضي | ./sys_uc_004.md | Draft |
| UC-005 | استعراض وفلترة قائمة التسجيلات | ./sys_uc_005.md | Draft |
| UC-006 | الإعجاب بتسجيل صوتي | ./sys_uc_006.md | Draft |
| UC-007 | تفضيل تسجيل بالنجمة | ./sys_uc_007.md | Draft |
| UC-008 | تسجيل ورفع صوت جديد | ./sys_uc_008.md | Draft |
| UC-009 | حذف التسجيل الشخصي | ./sys_uc_009.md | Draft |
| UC-010 | الإبلاغ عن تسجيل صوتي | ./sys_uc_010.md | Draft |
| UC-011 | الإبلاغ عن خطأ في المحتوى | ./sys_uc_011.md | Draft |
| UC-012 | مراجعة البلاغات والإشراف | ./sys_uc_012.md | Draft |
| UC-013 | اعتماد التسجيلات وإدارة الإعدادات | ./sys_uc_013.md | Draft |

---

## 4. API/RPC OVERVIEW

### Architecture

الخادم الوحيد هو Supabase — لا خادم مخصص:

* **قراءة المحتوى المرجعي:** PostgREST التلقائي `GET /rest/v1/<table>` (خاضع لـ RLS).
* **العمليات الكاتبة والمنطقية:** دوال RPC `POST /rpc/<function>` (SECURITY DEFINER + فحوص داخلية).

### Common Response Format

```json
{
  "success": true,
  "data": {},
  "message": "رسالة عربية",
  "errors": []
}
```

### HTTP Status Codes

| Code | Description |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (غير موثّق) |
| 403 | Forbidden (صلاحية/موافقة/مفتاح رفع) |
| 404 | Not Found |
| 409 | Conflict (بلاغ مكرر / تسجيل موجود) |
| 413 | Payload Too Large |
| 415 | Unsupported Media Type |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### RPC Index

| RPC | System Logic | ALG |
|---|---|---|
| `get_default_recording` | sys_uc_004 | ALG-001 |
| `list_recordings` | sys_uc_005 | — |
| `register_listen` | sys_uc_004 | ALG-003 |
| `toggle_like` | sys_uc_006 | ALG-006 |
| `toggle_favorite` | sys_uc_007 | ALG-006 |
| `give_upload_consent` | sys_uc_008 | — |
| `create_recording` | sys_uc_008 | ALG-004/005 |
| `replace_recording` | sys_uc_008 | ALG-004/005 |
| `delete_recording` | sys_uc_009 | — |
| `submit_report` | sys_uc_010 | ALG-002 |
| `submit_content_report` | sys_uc_011 | — |
| `get_active_students_count` | sys_uc_010 | ALG-002 |
| `admin_verify_recording` | sys_uc_013 | — |
| `admin_list_recordings_queue` | sys_uc_012 | — |
| `admin_resolve_report` | sys_uc_012 | — |
| `admin_resolve_content_report` | sys_uc_012 | — |
| `admin_update_setting` | sys_uc_013 | — |

المرجع المجمّع الملزم للتواقيع: `../08-api-contracts.md`.

---

## 5. USER FLOW → SYSTEM LOGIC MAPPING

| User Flow | System Logic | Description |
|---|---|---|
| userflow_uc_001.md | sys_uc_001.md | OAuth flow + handle_new_user trigger |
| userflow_uc_002.md | sys_uc_002.md | PostgREST hierarchy lists |
| userflow_uc_003.md | sys_uc_003.md | Hadith detail embedded fetch |
| userflow_uc_004.md | sys_uc_004.md | Default selection + listen counter |
| userflow_uc_005.md | sys_uc_005.md | Recordings list + sorting |
| userflow_uc_006.md | sys_uc_006.md | Atomic like toggle |
| userflow_uc_007.md | sys_uc_007.md | Favorite toggle (no counters) |
| userflow_uc_008.md | sys_uc_008.md | Consent + compress + create/replace |
| userflow_uc_009.md | sys_uc_009.md | Delete own recording |
| userflow_uc_010.md | sys_uc_010.md | Report + threshold evaluation |
| userflow_uc_011.md | sys_uc_011.md | Content report (no threshold) |
| userflow_uc_012.md | sys_uc_012.md | Admin queues + resolutions |
| userflow_uc_013.md | sys_uc_013.md | Verification + settings |

---

## 6. REVISION HISTORY

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-07-23 | System Analyst AI | Initial Draft — 13 System Logics covering UC-001…UC-013 |
