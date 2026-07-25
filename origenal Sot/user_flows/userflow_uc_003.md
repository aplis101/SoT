# User Flow Specification

Document Version: v0.1

Use Case ID: UC-003  
Use Case Name: Print Receipt

Status: Draft  
Last Updated: 2026-06-14  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

Kasir mencetak struk belanja untuk pelanggan setelah transaksi penjualan selesai menggunakan fitur cetak bawaan browser.

## 1.2 Goal

Kasir ingin memberikan struk fisik belanjaan kepada pelanggan sebagai bukti transaksi.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F001|Pencatatan Transaksi Penjualan (Cetak Struk)|

## 1.4 Primary Actor

Kasir

## 1.5 Supporting Actors

Browser Print Engine

---

# 2. TRIGGER

Kasir mengklik tombol "Cetak Struk" atau menekan Enter pada dialog pembayaran.

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|Transaksi penjualan sudah selesai (UC-002 selesai)|
|PRE-002|Perangkat kasir terhubung dengan printer|
|PRE-003|Browser mengizinkan dialog print|

---

# 4. MAIN FLOW

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Cetak Struk" atau menekan Enter|Sistem menyiapkan data struk untuk dicetak|
|2||Sistem memanggil browser print dialog (window.print())|
|3||Browser menampilkan dialog print preview|
|4|Kasir memilih printer yang tersedia|Browser menampilkan daftar printer yang terhubung|
|5|Kasir mengklik tombol "Print" di browser dialog|Browser mengirim data cetak ke printer|
|6||Printer mencetak struk belanja|
|7|Kasir menutup dialog print|Kembali ke halaman POS Terminal|

---

# 5. ALTERNATIVE FLOWS

## AF-001: Membatalkan Cetak

### Condition

Ketika Kasir membatalkan proses pencetakan.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Cancel" di browser print dialog|Dialog print tertutup|
|2||Kasir kembali ke halaman POS Terminal|
|3||Transaksi tetap tercatat di sistem|

---

## AF-002: Printer Tidak Terdeteksi

### Condition

Ketika tidak ada printer yang terhubung ke perangkat.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Cetak Struk"|Sistem memanggil browser print dialog|
|2||Browser menampilkan dialog tanpa printer tersedia|
|3|Kasir membatalkan cetak atau menghubungkan printer|Kembali ke POS Terminal|

---

# 6. EXCEPTION FLOWS

## EF-001: Browser Print Dialog Diblokir

### Condition

Ketika browser memblokir popup print dialog.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Cetak Struk"|Browser memblokir print dialog|
|2||Sistem menampilkan pesan "Izinkan popup untuk mencetak struk"|
|3|Kasir mengizinkan popup dan mencoba lagi|Sistem memanggil print dialog|

---

## EF-002: Printer Mengalami Error

### Condition

Ketika printer mengalami gangguan atau kehabisan tinta/kertas.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Cetak Struk"|Browser mengirim data ke printer|
|2||Printer mengalami error (kertas habis, tinta habis, dll)|
|3|Kasir memperbaiki printer dan mencoba cetak ulang|Sistem dapat memanggil print dialog lagi|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|Struk belanja tercetak|
|POST-002|Data transaksi sudah tersimpan di sistem|
|POST-003|Stok produk sudah berkurang|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|Pencetakan struk menggunakan browser print dialog bawaan|
|BR-002|Transaksi tetap tercatat meskipun pencetakan dibatalkan|
|BR-003|Struk berisi: nama toko, daftar item, total bayar, waktu transaksi|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-002|POS Terminal (Transaksi)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|Transaction|Mengambil data transaksi untuk ditampilkan di struk|
|TransactionDetail|Mengambil rincian item yang dibeli|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|None|Tidak ada data baru yang dibuat|

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
|AC-001|Sistem memanggil browser print dialog saat kasir mengklik "Cetak Struk"|
|AC-002|Struk mencakup informasi: nama toko, daftar item, total bayar, waktu|
|AC-003|Pembatalan cetak tidak mempengaruhi data transaksi|
|AC-004|Transaksi tetap tercatat meskipun pencetakan gagal|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F001|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-002|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
