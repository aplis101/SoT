# Test Plan

Document Version: v0.1

Project: Aplikasi Kasir Toko
Product: Web-Based Point of Sale (POS)

Status: Draft
Last Updated: 2026-06-14
Author: System Analyst AI

---

# 1. INTRODUCTION

## 1.1 Purpose

Dokumen ini mendefinisikan rencana pengujian (test plan) untuk sistem Aplikasi Kasir Berbasis Web. Test Plan ini merupakan acuan utama dalam pelaksanaan seluruh aktivitas pengujian, mencakup strategi, lingkup, sumber daya, jadwal, serta kriteria kelulusan.

## 1.2 Objectives

- Memverifikasi bahwa seluruh fitur (F001–F004) berfungsi sesuai dengan Software Requirements Specification (SRS).
- Memvalidasi bahwa setiap user flow (UC-001–UC-006) berjalan sesuai spesifikasi.
- Mengidentifikasi defect sebelum sistem dirilis ke production.
- Memastikan sistem memenuhi non-functional requirements (NFR) yang telah ditetapkan.

## 1.3 References

| Document | Version | Location |
| --- | --- | --- |
| Software Requirements Specification (SRS) | v0.2 | `docs/srs.md` |
| User Flow Specifications | v0.1 | `docs/user_flows/` |
| Test Case Specification | v0.1 | `docs/test_cases.md` |

---

# 2. TEST SCOPE

## 2.1 In Scope

| Feature ID | Feature Name | Related Use Cases | Test Coverage |
| --- | --- | --- | --- |
| F001 | Pencatatan Transaksi Penjualan & Cetak Struk | UC-001, UC-002, UC-003 | 16 TC |
| F002 | Manajemen Stok (Tambah Barang Baru) | UC-004 | 6 TC |
| F003 | Laporan Pendapatan & Stok Harian | UC-005 | 4 TC |
| F004 | Laporan Pendapatan & Stok Bulanan | UC-006 | 4 TC |

### 2.1.1 Test Types Included

| Test Type | Description |
| --- | --- |
| Functional Testing | Memverifikasi setiap fitur berfungsi sesuai SRS dan user flow |
| UI/UX Testing | Memverifikasi tata letak, responsivitas, dan kemudahan penggunaan antarmuka |
| Validation Testing | Memvalidasi input form, business rules, dan data integrity |
| Error Handling Testing | Menguji response sistem terhadap kondisi error (server error, network failure, invalid input) |
| Integration Testing | Memverifikasi integrasi frontend-backend melalui REST API |
| Print Testing | Menguji fungsionalitas cetak struk melalui browser print dialog |
| Regression Testing | Menguji bahwa perubahan kode tidak merusak fitur yang sudah berjalan |

## 2.2 Out of Scope

- Performance / load testing (akan dilakukan di fase terpisah)
- Security penetration testing (akan dilakukan di fase terpisah)
- Multi-branch inventory management (out of scope SRS)
- Payment gateway integration (out of scope SRS)
- Mobile native application testing (web responsive only)
- Cross-browser compatibility beyond Chrome, Firefox, Edge, Safari

---

# 3. TEST STRATEGY

## 3.1 Testing Levels

### Level 1: Component Testing (Unit)

| Aspect | Detail |
| --- | --- |
| **Target** | Setiap fungsi di frontend components dan backend API endpoints |
| **Approach** | Automated unit test (developer responsibility) |
| **Tool** | Jest (Frontend), Pytest / Jest (Backend) |
| **Responsibility** | Developer |

### Level 2: Integration Testing

| Aspect | Detail |
| --- | --- |
| **Target** | Interaksi antara frontend → API → database |
| **Approach** | Automated integration test + manual API testing |
| **Tool** | Postman / Insomnia untuk API, script integration test |
| **Responsibility** | Tester |

### Level 3: System Testing

| Aspect | Detail |
| --- | --- |
| **Target** | Seluruh fitur end-to-end via browser |
| **Approach** | Manual test execution berdasarkan test case specification |
| **Tool** | Browser (Chrome/Firefox/Edge), print dialog |
| **Responsibility** | Tester |

### Level 4: User Acceptance Testing (UAT)

| Aspect | Detail |
| --- | --- |
| **Target** | Skenario bisnis nyata yang dijalankan oleh Kasir |
| **Approach** | Manual exploratory testing oleh end user |
| **Tool** | Production-like environment |
| **Responsibility** | End User (Kasir) + Tester |

## 3.2 Testing Approach

### Functional Testing Approach

Setiap test case dieksekusi berdasarkan prioritas fitur:
1. **High Priority (F001, F002):** 100% test case dieksekusi
2. **Medium Priority (F003, F004):** 100% test case dieksekusi

### Defect Management

| Stage | Action |
| --- | --- |
| Defect Found | Tester mencatat defect di log |
| Severity Level | Critical / Major / Minor / Trivial |
| Critical Defect | Pengujian dihentikan sampai defect diperbaiki |
| Major Defect | Pengujian fitur terkait dihentikan sampai diperbaiki |
| Minor/Trivial | Pengujian tetap berjalan, defect diperbaiki setelahnya |

---

# 4. TEST ENVIRONMENT

## 4.1 Hardware Requirements

| Perangkat | Spesifikasi Minimum |
| --- | --- |
| Komputer / Laptop | Processor Intel i3 / AMD Ryzen 3, RAM 4GB, Storage 256GB |
| Tablet / iPad | Layar minimal 10 inci, RAM 3GB |
| Printer | Thermal / Inkjet printer dengan koneksi USB atau network |

## 4.2 Software Requirements

### Frontend Testing

| Software | Version |
| --- | --- |
| Google Chrome | Latest stable |
| Mozilla Firefox | Latest stable |
| Microsoft Edge | Latest stable |
| Safari | Latest stable (macOS) |

### Backend & API Testing

| Software | Version |
| --- | --- |
| Postman / Insomnia | Latest stable |
| Node.js / Python | Sesuai environment development |

### Database

| Software | Version |
| --- | --- |
| PostgreSQL / MySQL | Sesuai environment development |

## 4.3 Network Requirements

- Koneksi internet stabil dengan latency < 100ms ke server backend
- Local development environment dapat menggunakan localhost

## 4.4 Test Data Requirements

| Data Item | Quantity | Description |
| --- | --- | --- |
| Akun Kasir | 1 | Username: `kasir01`, Password: `password123` |
| Produk aktif | 5+ | Variasi stok (0, 1, 5, 10, 100) |
| Produk dengan stok = 0 | 1 | Untuk test case produk habis |
| Transaksi hari ini | 3+ | Data transaksi yang sudah selesai |
| Transaksi bulan sebelumnya | 5+ | Data historis untuk laporan bulanan |

---

# 5. ROLES & RESPONSIBILITIES

| Role | Name / Team | Responsibility |
| --- | --- | --- |
| Test Manager | System Analyst | Menyusun test plan, mengawasi pelaksanaan, melaporkan hasil |
| Tester | QA Team | Mengeksekusi test case, mencatat defect, memverifikasi perbaikan |
| Developer | Dev Team | Memperbaiki defect yang ditemukan |
| End User (Kasir) | Klien / Perwakilan | Menjalankan UAT, memberikan feedback |
| Project Sponsor | Pemilik Toko | Menyetujui hasil pengujian dan keputusan rilis |

---

# 6. TEST SCHEDULE

## 6.1 Phases

| Phase | Activity | Duration | Deliverable |
| --- | --- | --- | --- |
| **P1: Test Planning** | Menyusun test plan, menyiapkan lingkungan dan data uji | 2 hari | Test Plan Document |
| **P2: Test Case Preparation** | Menyusun test case specification | 2 hari | Test Case Specification |
| **P3: Test Execution** | Menjalankan test case, mencatat hasil | 3 hari | Test Execution Report |
| **P4: Defect Fixing** | Developer memperbaiki defect | 2 hari | Fixed Build |
| **P5: Re-testing** | Verifikasi perbaikan, regression test | 1 hari | Updated Test Report |
| **P6: UAT** | User acceptance testing oleh Kasir | 1 hari | UAT Sign-off |
| **P7: Test Closure** | Menyusun laporan akhir pengujian | 1 hari | Test Summary Report |

**Total estimasi:** 12 hari kerja

---

# 7. ENTRY & EXIT CRITERIA

## 7.1 Entry Criteria

| No | Criteria |
| --- | --- |
| EC-01 | SRS, User Flow, dan Test Case Specification sudah di-review dan disetujui |
| EC-02 | Lingkungan pengujian (staging) sudah siap dan terdeploy |
| EC-03 | Test data sudah disiapkan dan terisi di database |
| EC-04 | Semua perangkat keras (printer) terkonfigurasi |
| EC-05 | Tester sudah memahami test case dan skenario pengujian |

## 7.2 Exit Criteria

| No | Criteria |
| --- | --- |
| XC-01 | 100% test case dieksekusi |
| XC-02 | Tidak ada defect dengan severity Critical atau Major yang masih open |
| XC-03 | Seluruh defect Minor/Trivial sudah didokumentasikan dan diterima sebagai known issue |
| XC-04 | UAT sudah selesai dan mendapatkan sign-off dari end user |
| XC-05 | Test Summary Report sudah disusun dan disetujui |

## 7.3 Suspension Criteria

| No | Criteria |
| --- | --- |
| SC-01 | Terdapat critical defect yang menghalangi pengujian lebih dari 50% test case |
| SC-02 | Lingkungan pengujian tidak stabil atau sering down |
| SC-03 | Perubahan kebutuhan mendadak yang signifikan (major requirement change) |

---

# 8. TEST DELIVERABLES

| Deliverable | Description | Due |
| --- | --- | --- |
| Test Plan | Dokumen perencanaan pengujian ini | Akhir P1 |
| Test Case Specification | Detail test case untuk setiap fitur | Akhir P2 |
| Test Execution Report | Hasil eksekusi test case (pass/fail) | Akhir P3 |
| Defect Log | Daftar defect yang ditemukan | Akhir P3 |
| Re-test Report | Hasil verifikasi perbaikan defect | Akhir P5 |
| UAT Sign-off | Persetujuan dari end user | Akhir P6 |
| Test Summary Report | Laporan akhir pengujian | Akhir P7 |

---

# 9. RISK & MITIGATION

| Risk ID | Risk Description | Probability | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R-01 | Lingkungan staging tidak representatif dengan production | Medium | High | Gunakan konfigurasi yang identik dengan production |
| R-02 | Printer tidak terdeteksi atau kompatibilitas bermasalah | Medium | Medium | Siapkan minimal 2 jenis printer untuk pengujian |
| R-03 | Test data tidak mencakup semua skenario | Low | Medium | Lakukan review test data sebelum eksekusi |
| R-04 | Perubahan requirement di tengah pengujian | Low | High | Freeze requirement sebelum P3 dimulai |
| R-05 | Keterbatasan akses ke browser tertentu (Safari) | Low | Low | Gunakan BrowserStack untuk simulasi jika perangkat tidak tersedia |

---

# 10. APPROVAL

| Role | Name | Signature | Date |
| --- | --- | --- | --- |
| Test Manager | System Analyst AI | | |
| Developer Lead | | | |
| Project Sponsor (Pemilik Toko) | | | |

---

# 11. REVISION HISTORY

| Version | Date | Author | Description |
| --- | --- | --- | --- |
| 0.1 | 2026-06-14 | System Analyst AI | Initial Draft |
