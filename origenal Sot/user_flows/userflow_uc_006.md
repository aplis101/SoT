# User Flow Specification

Document Version: v0.1

Use Case ID: UC-006  
Use Case Name: View Monthly Report

Status: Draft  
Last Updated: 2026-06-14  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

Kasir melihat laporan pendapatan dan stok bulanan untuk menganalisis performa penjualan jangka panjang.

## 1.2 Goal

Kasir ingin melihat rekap total uang masuk dan stok akhir di setiap bulannya.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F004|Laporan Pendapatan & Stok Bulanan|

## 1.4 Primary Actor

Kasir

## 1.5 Supporting Actors

Sistem Laporan

---

# 2. TRIGGER

Kasir mengakses halaman Laporan Bulanan (`/laporan/bulanan`).

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|Kasir sudah login (UC-001 selesai)|
|PRE-002|Ada data laporan harian yang terakumulasi|

---

# 4. MAIN FLOW

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses halaman Laporan Bulanan|Sistem mengambil data laporan bulanan|
|2||Sistem menampilkan KPI Cards: Total Pendapatan, Total Transaksi, Rata-rata Bulanan|
|3||Sistem menampilkan tabel rekap bulanan dengan kolom: Bulan, Transaksi, Pendapatan, Item Terjual|
|4|Kasir melihat data yang ditampilkan|Kasir dapat menganalisis tren penjualan|

---

# 5. ALTERNATIVE FLOWS

## AF-001: Filter Berdasarkan Bulan

### Condition

Ketika Kasir ingin melihat laporan untuk bulan tertentu.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir memilih bulan dan tahun dari dropdown filter|Sistem memfilter data berdasarkan bulan yang dipilih|
|2||Tabel hanya menampilkan data untuk bulan yang dipilih|

---

## AF-002: Tidak Ada Data

### Condition

Ketika belum ada data laporan untuk bulan tertentu.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir memilih bulan tanpa data|Tabel menampilkan "Tidak ada data"|
|2||KPI Cards menampilkan nilai 0|

---

# 6. EXCEPTION FLOWS

## EF-001: Server Error

### Condition

Ketika terjadi kesalahan server saat mengambil data.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses halaman Laporan Bulanan|Sistem mencoba mengambil data dari server|
|2||Sistem mendapat error dari server|
|3||Sistem menampilkan pesan "Gagal memuat laporan. Silakan coba lagi."|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|Kasir berhasil melihat laporan bulanan|
|POST-002|Data laporan tidak berubah (read-only)|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|Laporan bulanan dihasilkan dari akumulasi data laporan harian|
|BR-002|Data laporan bulanan tidak dapat diubah oleh Kasir|
|BR-003|Kasir dapat memfilter data berdasarkan bulan dan tahun|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-005|Laporan Bulanan|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|Transaction|Mengambil data transaksi bulanan|
|Product|Mengambil data stok akhir bulan|

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
|AC-001|Kasir dapat melihat Total Pendapatan bulanan|
|AC-002|Kasir dapat melihat Total Transaksi bulanan|
|AC-003|Kasir dapat melihat Rata-rata pendapatan per bulan|
|AC-004|Kasir dapat melihat tabel rekap bulanan|
|AC-005|Kasir dapat memfilter data berdasarkan bulan dan tahun|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F004|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-005|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
