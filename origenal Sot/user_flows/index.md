Document Version: v0.1

Project: Aplikasi Kasir Toko
Product: Web-Based Point of Sale (POS)
Status: Draft
Last Updated: 2026-06-14
Author: System Analyst AI

## 1. PURPOSE

This document serves as the master index for all User Flow Specifications.

Each User Flow is maintained in a separate document.

## 2. FILE STRUCTURE

```text
user_flows/
├── index.md
├── userflow_uc_001.md
├── userflow_uc_002.md
├── userflow_uc_003.md
├── userflow_uc_004.md
├── userflow_uc_005.md
└── userflow_uc_006.md
```


## 3. USER FLOW CATALOG

|Use Case ID|Use Case Name|File Path|Status|
|---|---|---|---|
|UC-001|User Login|./userflow_uc_001.md|Draft|
|UC-002|Create Sales Transaction|./userflow_uc_002.md|Draft|
|UC-003|Print Receipt|./userflow_uc_003.md|Draft|
|UC-004|Add New Product|./userflow_uc_004.md|Draft|
|UC-005|View Daily Report|./userflow_uc_005.md|Draft|
|UC-006|View Monthly Report|./userflow_uc_006.md|Draft|

---

## 4. REQUIREMENT → USER FLOW MAPPING

|Feature ID|Feature Name|Use Cases|
|---|---|---|
|F001|Pencatatan Transaksi Penjualan|UC-001, UC-002, UC-003|
|F002|Manajemen Stok (Tambah Barang Baru)|UC-004|
|F003|Laporan Pendapatan & Stok Harian|UC-005|
|F004|Laporan Pendapatan & Stok Bulanan|UC-006|

---

## 5. PAGE → USER FLOW MAPPING

|Page ID|Page Name|Use Cases|
|---|---|---|
|PAGE-001|Login|UC-001|
|PAGE-002|POS Terminal (Transaksi)|UC-002, UC-003|
|PAGE-003|Kelola Stok & Katalog|UC-004|
|PAGE-003-SUB-01|Form Tambah Barang Baru (Modal)|UC-004|
|PAGE-004|Laporan Harian|UC-005|
|PAGE-005|Laporan Bulanan|UC-006|

---

## 6. USER FLOW DEPENDENCIES

|Use Case|Depends On|
|---|---|
|UC-001|None|
|UC-002|UC-001|
|UC-003|UC-002|
|UC-004|UC-001|
|UC-005|UC-001|
|UC-006|UC-001|

---

## 7. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
