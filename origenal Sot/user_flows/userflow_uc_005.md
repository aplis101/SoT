# User Flow Specification

Document Version: v0.1

Use Case ID: UC-005  
Use Case Name: View Daily Report

Status: Draft  
Last Updated: 2026-06-14  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

Kasir melihat laporan pendapatan dan stok harian untuk memantau performa penjualan hari ini.

## 1.2 Goal

Kasir ingin melihat rekap total uang masuk dan sisa stok barang hari ini.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F003|Laporan Pendapatan & Stok Harian|

## 1.4 Primary Actor

Kasir

## 1.5 Supporting Actors

Sistem Laporan

---

# 2. TRIGGER

Kasir mengakses halaman Laporan Harian (`/laporan/harian`).

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|Kasir sudah login (UC-001 selesai)|
|PRE-002|Ada data transaksi hari ini|

---

# 4. MAIN FLOW

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses halaman Laporan Harian|Sistem mengambil data transaksi hari ini|
|2||Sistem menampilkan KPI Cards: Total Pendapatan, Jumlah Transaksi, Rata-rata Transaksi|
|3||Sistem menampilkan tabel daftar transaksi hari ini|
|4|Kasir melihat data yang ditampilkan|Kasir dapat menganalisis performa penjualan|
|5|Kasir melihat indikator stok barang|Sistem menampilkan warna merah untuk produk dengan stok menipis/habis|

---

# 5. ALTERNATIVE FLOWS

## AF-001: Tidak Ada Transaksi Hari Ini

### Condition

Ketika belum ada transaksi yang tercatat hari ini.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses halaman Laporan Harian|Sistem menampilkan KPI Cards dengan nilai 0|
|2||Tabel transaksi menampilkan "Tidak ada data"|

---

## AF-002: Melihat Detail Transaksi

### Condition

Ketika Kasir ingin melihat detail transaksi tertentu.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik baris transaksi di tabel|Sistem menampilkan detail item yang dibeli|
|2||Detail mencakup: daftar produk, jumlah, subtotal per item|

---

# 6. EXCEPTION FLOWS

## EF-001: Server Error

### Condition

Ketika terjadi kesalahan server saat mengambil data.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses halaman Laporan Harian|Sistem mencoba mengambil data dari server|
|2||Sistem mendapat error dari server|
|3||Sistem menampilkan pesan "Gagal memuat laporan. Silakan coba lagi."|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|Kasir berhasil melihat laporan harian|
|POST-002|Data laporan tidak berubah (read-only)|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|Data laporan harian diakumulasikan dari transaksi hari ini|
|BR-002|Data laporan dikunci setiap pergantian hari (00:00)|
|BR-003|Produk dengan stok <= 5 ditampilkan dengan warna merah (indikator visual)|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-004|Laporan Harian|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|Transaction|Mengambil data transaksi hari ini|
|TransactionDetail|Mengambil rincian item per transaksi|
|Product|Mengambil data stok terkini|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|None|Tidak ada data yang dibuat|

---

## 10.3 Data Updated

|Entity|Description|
|---|---|
|None|Tidak ada data yang diupdate|

---

## 10.4 Data Deleted

|Entity|Description|
|---|---|
|None|Tidak ada data yang dihapus|

---

# 11. PERMISSIONS

|Role|Access|
|---|---|
|Kasir|AKSI (ALLOWED)|

---

# 12. ACCEPTANCE CRITERIA

|AC ID|Description|
|---|---|
|AC-001|Kasir dapat melihat Total Pendapatan hari ini|
|AC-002|Kasir dapat melihat jumlah transaksi hari ini|
|AC-003|Kasir dapat melihat rata-rata per transaksi|
|AC-004|Kasir dapat melihat tabel daftar transaksi hari ini|
|AC-005|Produk dengan stok menipis/habis ditampilkan dengan indikator merah|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F003|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-004|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
