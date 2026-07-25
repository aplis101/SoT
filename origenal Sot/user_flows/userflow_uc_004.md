# User Flow Specification

Document Version: v0.1

Use Case ID: UC-004  
Use Case Name: Add New Product

Status: Draft  
Last Updated: 2026-06-14  
Author: System Analyst AI

---

# 1. OVERVIEW

## 1.1 Summary

Kasir menambahkan produk baru ke dalam sistem katalog toko melalui formulir input barang baru.

## 1.2 Goal

Kasir ingin mendaftarkan produk baru agar dapat dijual melalui sistem POS.

## 1.3 Requirement References

|Requirement ID|Requirement Name|
|---|---|
|F002|Manajemen Stok (Tambah Barang Baru)|

## 1.4 Primary Actor

Kasir

## 1.5 Supporting Actors

Sistem POS

---

# 2. TRIGGER

Kasir mengklik tombol "Tambah Barang" pada halaman Kelola Stok.

---

# 3. PRECONDITIONS

|ID|Condition|
|---|---|
|PRE-001|Kasir sudah login (UC-001 selesai)|
|PRE-002|Kasir mengakses halaman Kelola Stok (`/stok`)|

---

# 4. MAIN FLOW

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengakses halaman Kelola Stok|Sistem menampilkan tabel inventaris barang|
|2|Kasir mengklik tombol "Tambah Barang"|Sistem menampilkan modal form "Tambah Produk Baru"|
|3|Kasir mengisi kolom "Nama Produk"|Input diterima|
|4|Kasir mengisi kolom "Kategori"|Input diterima|
|5|Kasir mengisi kolom "Harga" (harga jual)|Input diterima|
|6|Kasir mengisi kolom "Stok Awal"|Input diterima|
|7|Kasir mengklik tombol "Simpan"|Sistem memvalidasi semua input|
|8||Input valid: sistem menyimpan produk baru ke database|
|9||Sistem menutup modal form|
|10||Sistem memperbarui daftar produk di halaman Kelola Stok|
|11||Produk baru juga muncul di daftar produk halaman POS Terminal|

---

# 5. ALTERNATIVE FLOWS

## AF-001: Membatalkan Penambahan

### Condition

Ketika Kasir membatalkan proses penambahan produk.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Batal" atau tombol X di modal|Sistem menutup modal form|
|2||Data yang terisi tidak disimpan|
|3||Tabel inventaris tidak berubah|

---

## AF-002: Input Tidak Lengkap

### Condition

Ketika Kasir tidak mengisi salah satu field yang wajib.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Simpan" tanpa mengisi semua field|Sistem menampilkan pesan error pada field yang kosong|
|2|Kasir mengisi field yang kosong|Sistem kembali ke step 5 pada Main Flow|

---

# 6. EXCEPTION FLOWS

## EF-001: Nama Produk Duplikat

### Condition

Ketika nama produk yang dimasukkan sudah ada di sistem.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Simpan"|Sistem memvalidasi nama produk|
|2||Sistem mendeteksi nama duplikat|
|3||Sistem menampilkan pesan error "Nama produk sudah ada"|
|4|Kasir mengubah nama produk|Sistem kembali ke step 7 pada Main Flow|

---

## EF-002: Harga atau Stok Negatif

### Condition

Ketika Kasir memasukkan harga atau stok dengan nilai negatif.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir memasukkan harga < 0 atau stok < 0|Sistem menampilkan pesan error "Harga dan stok harus lebih dari 0"|
|2|Kasir memperbaiki nilai input|Sistem kembali ke step 7 pada Main Flow|

---

## EF-003: Server Error

### Condition

Ketika terjadi kesalahan server saat menyimpan data.

### Flow

|Step|Actor Action|System Response|
|---|---|---|
|1|Kasir mengklik tombol "Simpan"|Sistem mencoba menyimpan ke database|
|2||Sistem mendapat error dari server|
|3||Sistem menampilkan pesan "Gagal menyimpan produk. Silakan coba lagi."|

---

# 7. POSTCONDITIONS

|ID|Condition|
|---|---|
|POST-001|Produk baru berhasil disimpan ke database|
|POST-002|Produk baru muncul di daftar inventaris|
|POST-003|Produk baru tersedia untuk transaksi di POS Terminal|

---

# 8. BUSINESS RULES

|Rule ID|Description|
|---|---|
|BR-001|Nama barang tidak boleh duplikat dengan produk yang sudah ada|
|BR-002|Harga Jual harus >= 0|
|BR-003|Stok Awal harus >= 0|
|BR-004|Semua field wajib diisi|

---

# 9. RELATED PAGES

|Page ID|Page Name|
|---|---|
|PAGE-003|Kelola Stok & Katalog|
|PAGE-003-SUB-01|Form Tambah Barang Baru (Modal)|

---

# 10. DATA USAGE

## 10.1 Data Read

|Entity|Description|
|---|---|
|Product|Mengecek apakah nama produk sudah ada (validasi duplikat)|

---

## 10.2 Data Created

|Entity|Description|
|---|---|
|Product|Membuat data produk baru|

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
|AC-001|Kasir dapat membuka modal form "Tambah Produk Baru"|
|AC-002|Kasir dapat mengisi semua field yang diperlukan|
|AC-003|Sistem memvalidasi input (nama duplikat, harga/stok negatif)|
|AC-004|Produk baru muncul di daftar inventaris setelah disimpan|
|AC-005|Produk baru tersedia untuk transaksi di POS Terminal|

---

# 13. TRACEABILITY

## Requirement Traceability

|Requirement ID|
|---|
|F002|

## Information Architecture Traceability

|Page ID|
|---|
|PAGE-003|
|PAGE-003-SUB-01|

---

# 15. REVISION HISTORY

|Version|Date|Author|Description|
|---|---|---|---|
|0.1|2026-06-14|System Analyst AI|Initial Draft|
